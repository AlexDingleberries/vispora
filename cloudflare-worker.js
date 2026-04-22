export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname || "/";

      if (path.startsWith("/tidal")) {
        const res = await handleTidal(request, env, ctx, url);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      const groqResponse = await forwardGroq(request, env, path);
      const responseWithCors = new Response(groqResponse.body, groqResponse);
      Object.entries(corsHeaders).forEach(([k, v]) => responseWithCors.headers.set(k, v));
      return responseWithCors;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

async function forwardGroq(request, env, path) {
  let targetUrl = "https://api.groq.com/openai/v1/chat/completions";
  if (path.includes("/stt")) targetUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
  return fetch(targetUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": request.headers.get("Content-Type") || "application/json",
    },
    body: request.body,
  });
}

async function handleTidal(request, env, ctx, url) {
  const token = await getTidalAccessToken(env, ctx);
  const path = url.pathname;

  if (path.startsWith("/tidal/search")) {
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const data = await tidalSearch(token, q, limit);
    return jsonResponse(data);
  }

  if (path.startsWith("/tidal/lyrics/")) {
    const trackId = path.split("/").pop();
    const data = await tidalLyrics(token, trackId);
    return jsonResponse(data);
  }

  if (path.startsWith("/tidal/stream/")) {
    const trackId = path.split("/").pop();
    const data = await tidalStream(token, trackId);
    return jsonResponse(data);
  }

  if (path.startsWith("/tidal/proxy")) {
    const targetPath = url.searchParams.get("path");
    if (!targetPath) return jsonResponse({ error: "Missing ?path=" }, 400);
    const raw = await tidalFetch(token, targetPath);
    return jsonResponse(raw);
  }

  return jsonResponse({ ok: true, service: "tidal" });
}

async function getTidalAccessToken(env, ctx) {
  if (env.TIDAL_TOKEN_CACHE) {
    const cached = await env.TIDAL_TOKEN_CACHE.get("access_token", { type: "json" });
    if (cached?.token && cached?.expiresAt > Date.now() + 30000) return cached.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.TIDAL_CLIENT_ID,
    client_secret: env.TIDAL_CLIENT_SECRET,
  });

  const res = await fetch("https://auth.tidal.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TIDAL auth failed: ${txt || res.status}`);
  }
  const data = await res.json();
  const token = data.access_token;
  const expiresIn = Number(data.expires_in || 3600);

  if (env.TIDAL_TOKEN_CACHE && token) {
    ctx.waitUntil(env.TIDAL_TOKEN_CACHE.put(
      "access_token",
      JSON.stringify({ token, expiresAt: Date.now() + (expiresIn * 1000) }),
      { expirationTtl: Math.max(60, expiresIn - 60) }
    ));
  }
  return token;
}

async function tidalSearch(token, query, limit) {
  if (!query) return { items: [] };

  const attempts = [
    `/v2/searchresults/${encodeURIComponent(query)}?countryCode=US&include=tracks&limit=${limit}`,
    `/v1/search?query=${encodeURIComponent(query)}&types=TRACKS&countryCode=US&limit=${limit}`,
  ];

  let data = null;
  for (const p of attempts) {
    try {
      data = await tidalFetch(token, p);
      if (data) break;
    } catch {
      continue;
    }
  }
  if (!data) return { items: [] };

  const tracks = data.items || data.tracks?.items || data.tracks || data.data || [];
  const norm = tracks.map((t) => ({
    id: String(t.id || t.uuid || t.trackId || ""),
    title: t.title || t.name || t.attributes?.title || "",
    artistName: t.artist?.name || t.artists?.[0]?.name || t.artistName || t.attributes?.artist || "",
    albumTitle: t.album?.title || t.albumTitle || t.attributes?.album || "",
    coverUrl: t.album?.cover?.[0]?.url || t.album?.image || t.cover || "",
    previewUrl: t.previewUrl || t.preview_url || t.resources?.preview?.url || t.attributes?.previewUrl || "",
    duration: Number(t.duration || t.durationMs / 1000 || t.attributes?.duration || 0),
  })).filter((t) => t.id);

  return { items: norm };
}

async function tidalLyrics(token, trackId) {
  const attempts = [
    `/v1/tracks/${encodeURIComponent(trackId)}/lyrics?countryCode=US`,
    `/v2/tracks/${encodeURIComponent(trackId)}/lyrics?countryCode=US`,
  ];
  for (const p of attempts) {
    try {
      const data = await tidalFetch(token, p);
      const text = data.lyrics || data.text || "";
      const lines = Array.isArray(data.subtitles) ? data.subtitles : [];
      if (text || lines.length) return { text, lines };
    } catch {
      continue;
    }
  }
  return { text: "", lines: [] };
}

async function tidalStream(token, trackId) {
  const attempts = [
    `/v1/tracks/${encodeURIComponent(trackId)}/playbackinfopostpaywall?audioquality=LOW&assetpresentation=FULL&playbackmode=STREAM&countryCode=US`,
    `/v1/tracks/${encodeURIComponent(trackId)}/playbackinfopostpaywall?audioquality=HIGH&assetpresentation=FULL&playbackmode=STREAM&countryCode=US`,
  ];
  for (const p of attempts) {
    try {
      const data = await tidalFetch(token, p);
      const directUrl =
        data?.manifest?.urls?.[0] ||
        data?.urls?.[0] ||
        data?.url ||
        "";
      if (directUrl) return { url: directUrl };

      const manifestBase64 = data?.manifest || "";
      if (typeof manifestBase64 === "string" && manifestBase64.length > 20) {
        const decoded = JSON.parse(atob(manifestBase64));
        const u = decoded?.urls?.[0] || decoded?.url || "";
        if (u) return { url: u };
      }
    } catch {
      continue;
    }
  }
  return { url: "" };
}

async function tidalFetch(token, path) {
  const target = path.startsWith("http") ? path : `https://openapi.tidal.com${path}`;
  const res = await fetch(target, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TIDAL request failed (${res.status}): ${txt}`);
  }
  return res.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
