const VMusic = (() => {
  const WORKER_URL = "https://api-proxz.alexdingleberries.workers.dev";
  const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23171717'/%3E%3Cpath d='M80 220V95l140-25v125' stroke='%23ffffff' stroke-opacity='.65' stroke-width='16' fill='none'/%3E%3Ccircle cx='70' cy='220' r='24' fill='%23ffffff' fill-opacity='.8'/%3E%3Ccircle cx='220' cy='195' r='24' fill='%23ffffff' fill-opacity='.8'/%3E%3C/svg%3E";

  const state = {
    results: [],
    queue: VStorage.getMusicQueue(),
    playlist: VStorage.getMusicPlaylist(),
    currentTrack: null,
    currentSource: "search",
    currentIndex: -1,
    repeat: (VStorage.getMusicState().repeat || "off"),
    volume: Number(VStorage.getMusicState().volume ?? 0.8),
    lyrics: [],
    lyricsMode: "plain",
    lyricsTimer: null,
  };

  let el = {};
  let searchTimer = null;
  let lastSearchToken = 0;

  function esc(s) {
    return VApp.esc(s ?? "");
  }

  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  async function worker(path, options = {}) {
    const url = `${WORKER_URL}${path}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function normalizeTrack(raw) {
    const attrs = raw.attributes || {};
    const id = String(raw.id ?? raw.trackId ?? raw.uuid ?? Math.random());
    const albumObj = raw.album || raw.release || {};
    const artistObj = raw.artist || raw.artists?.[0] || {};
    const title = raw.title || raw.name || raw.trackTitle || attrs.title || "Unknown Track";
    const artist = artistObj.name || raw.artistName || raw.subtitle || attrs.artist || "Unknown Artist";
    const album = albumObj.title || raw.albumTitle || attrs.album || "";
    const albumCoverId = raw.album?.cover || attrs.album?.cover || "";
    const tidalCoverFromId = typeof albumCoverId === "string" && albumCoverId.includes("-")
      ? `https://resources.tidal.com/images/${albumCoverId.replace(/-/g, "/")}/320x320.jpg`
      : "";
    const cover =
      raw.coverUrl ||
      raw.image ||
      albumObj.coverUrl ||
      albumObj.image ||
      attrs.image ||
      tidalCoverFromId ||
      albumObj.cover?.[0]?.url ||
      DEFAULT_COVER;
    const previewUrl =
      raw.previewUrl ||
      raw.url ||
      raw.streamUrl ||
      raw.audioUrl ||
      attrs.previewUrl ||
      attrs.streamUrl ||
      raw.resources?.preview?.url ||
      "";
    return {
      id,
      title,
      artist,
      album,
      cover,
      duration: Number(raw.duration || raw.durationMs / 1000 || 0),
      previewUrl,
      lyricsId: String(raw.id ?? ""),
      raw,
    };
  }

  async function searchTracks(query) {
    if (!query.trim()) return [];
    const data = await worker(`/tidal/search?q=${encodeURIComponent(query)}&limit=20`);
    const list =
      data.items ||
      data.tracks ||
      data.results ||
      data.data?.items ||
      data.data?.tracks ||
      data.data ||
      [];
    return list.map(normalizeTrack);
  }

  async function fetchLyrics(trackId) {
    try {
      const data = await worker(`/tidal/lyrics/${encodeURIComponent(trackId)}`);
      const synced = data.synced || data.lines || data.subtitles || [];
      if (Array.isArray(synced) && synced.length) {
        const parsed = synced.map(line => ({
          t: Number(line.time ?? line.startTime ?? line.ms / 1000 ?? 0),
          text: String(line.text || line.line || "").trim(),
        })).filter(x => x.text);
        if (parsed.length) return { mode: "synced", lines: parsed };
      }
      const plain = String(data.text || data.lyrics || "").split("\n").map(x => x.trim()).filter(Boolean);
      return { mode: "plain", lines: plain.map(text => ({ t: -1, text })) };
    } catch {
      return { mode: "plain", lines: [{ t: -1, text: "Lyrics unavailable for this track." }] };
    }
  }

  function persistMusicState() {
    VStorage.setMusicQueue(state.queue);
    VStorage.setMusicPlaylist(state.playlist);
    VStorage.setMusicState({
      repeat: state.repeat,
      volume: state.volume,
      lastTrack: state.currentTrack,
      lastSource: state.currentSource,
    });
  }

  function renderList(container, tracks, type) {
    if (!tracks.length) {
      container.innerHTML = `<div class="music-empty">${type === "search" ? "Search for songs to start listening." : `No tracks in ${type}.`}</div>`;
      return;
    }
    container.innerHTML = tracks.map((t, i) => {
      const fav = VStorage.isMusicFavorite(t.id);
      return `<div class="music-track ${state.currentTrack?.id === t.id ? "active" : ""}" data-type="${type}" data-index="${i}">
        <img src="${esc(t.cover)}" alt="${esc(t.title)}" class="music-track-cover" loading="lazy">
        <div class="music-track-main">
          <div class="music-track-title">${esc(t.title)}</div>
          <div class="music-track-sub">${esc(t.artist)}${t.album ? " • " + esc(t.album) : ""}${t.previewUrl ? "" : " • unavailable"}</div>
        </div>
        <div class="music-track-actions">
          <button class="music-mini-btn js-fav ${fav ? "on" : ""}" data-id="${esc(t.id)}">♥</button>
          <button class="music-mini-btn js-add-playlist" data-type="${type}" data-index="${i}">＋P</button>
          <button class="music-mini-btn js-add-queue" data-type="${type}" data-index="${i}">＋Q</button>
          <button class="music-mini-btn js-play" data-type="${type}" data-index="${i}">▶</button>
        </div>
      </div>`;
    }).join("");
  }

  function renderAll() {
    renderList(el.searchResults, state.results, "search");
    renderList(el.playlistResults, state.playlist, "playlist");
    renderList(el.queueResults, state.queue, "queue");
    el.repeatBtn.textContent = `Repeat: ${state.repeat}`;
    el.volume.value = String(Math.round(state.volume * 100));
    el.volumeVal.textContent = `${Math.round(state.volume * 100)}%`;
    updatePlayerUI();
  }

  function getSourceArray(source) {
    if (source === "playlist") return state.playlist;
    if (source === "queue") return state.queue;
    return state.results;
  }

  function setCurrent(track, source, index) {
    state.currentTrack = track;
    state.currentSource = source;
    state.currentIndex = index;
    persistMusicState();
  }

  async function resolvePlaybackUrl(track) {
    if (track?.previewUrl) return track.previewUrl;
    try {
      const data = await worker(`/tidal/stream/${encodeURIComponent(track.id)}`);
      return data.url || "";
    } catch {
      return "";
    }
  }

  async function playTrack(track, source, index) {
    const playbackUrl = await resolvePlaybackUrl(track);
    if (!playbackUrl) {
      VApp.showToast("Track playback unavailable", "error");
      return;
    }
    setCurrent(track, source, index);
    el.audio.src = playbackUrl;
    el.audio.volume = state.volume;
    await el.audio.play().catch(() => {});
    el.playPause.textContent = "Pause";
    await loadLyrics(track.lyricsId || track.id);
    renderAll();
  }

  async function loadLyrics(trackId) {
    const lyr = await fetchLyrics(trackId);
    state.lyrics = lyr.lines;
    state.lyricsMode = lyr.mode;
    renderLyrics();
  }

  function renderLyrics() {
    if (!state.lyrics.length) {
      el.lyrics.innerHTML = `<div class="lyrics-line dim">Lyrics unavailable.</div>`;
      return;
    }
    el.lyrics.innerHTML = state.lyrics.map((line, i) =>
      `<div class="lyrics-line ${i === 0 ? "active" : ""}" data-idx="${i}" data-time="${line.t}">${esc(line.text)}</div>`
    ).join("");
  }

  function updateSyncedLyrics() {
    if (state.lyricsMode !== "synced") return;
    const t = el.audio.currentTime;
    let active = 0;
    for (let i = 0; i < state.lyrics.length; i += 1) {
      if (state.lyrics[i].t <= t) active = i;
      else break;
    }
    el.lyrics.querySelectorAll(".lyrics-line").forEach((node, idx) => {
      node.classList.toggle("active", idx === active);
    });
    const activeNode = el.lyrics.querySelector(`.lyrics-line[data-idx="${active}"]`);
    if (activeNode) activeNode.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function nextTrack() {
    const sourceList = getSourceArray(state.currentSource);
    if (!sourceList.length) return;
    let next = state.currentIndex + 1;
    if (next >= sourceList.length) {
      if (state.repeat === "all") next = 0;
      else return;
    }
    playTrack(sourceList[next], state.currentSource, next);
  }

  function prevTrack() {
    const sourceList = getSourceArray(state.currentSource);
    if (!sourceList.length) return;
    let prev = state.currentIndex - 1;
    if (prev < 0) prev = 0;
    playTrack(sourceList[prev], state.currentSource, prev);
  }

  function updatePlayerUI() {
    const t = state.currentTrack;
    if (!t) {
      el.nowTitle.textContent = "Nothing playing";
      el.nowSub.textContent = "Search and play a track";
      el.nowCover.src = DEFAULT_COVER;
      el.progress.value = "0";
      el.timeNow.textContent = "0:00";
      el.timeTotal.textContent = "0:00";
      return;
    }
    el.nowTitle.textContent = t.title;
    el.nowSub.textContent = `${t.artist}${t.album ? " • " + t.album : ""}`;
    el.nowCover.src = t.cover || DEFAULT_COVER;
    el.timeNow.textContent = fmtTime(el.audio.currentTime || 0);
    el.timeTotal.textContent = fmtTime(el.audio.duration || t.duration || 0);
    const total = el.audio.duration || t.duration || 1;
    const pct = Math.min(100, ((el.audio.currentTime || 0) / total) * 100);
    el.progress.value = String(pct);
    const fav = VStorage.isMusicFavorite(t.id);
    el.nowFav.classList.toggle("on", fav);
  }

  async function onSearchInput() {
    const q = el.search.value.trim();
    const token = ++lastSearchToken;
    if (!q) {
      state.results = [];
      renderAll();
      return;
    }
    el.searchStatus.textContent = "Searching...";
    try {
      const tracks = await searchTracks(q);
      if (token !== lastSearchToken) return;
      state.results = tracks;
      const playable = tracks.filter(t => !!t.previewUrl).length;
      el.searchStatus.textContent = `${tracks.length} tracks (${playable} playable)`;
    } catch (err) {
      if (token !== lastSearchToken) return;
      el.searchStatus.textContent = "Search failed";
      VApp.showToast(err.message || "Search failed", "error");
    }
    renderAll();
  }

  function trackByDataset(btn) {
    const source = btn.dataset.type;
    const idx = Number(btn.dataset.index);
    const arr = getSourceArray(source);
    return { track: arr[idx], source, idx };
  }

  function bindListEvents(container) {
    container.addEventListener("click", (e) => {
      const playBtn = e.target.closest(".js-play");
      const addPl = e.target.closest(".js-add-playlist");
      const addQ = e.target.closest(".js-add-queue");
      const favBtn = e.target.closest(".js-fav");
      const row = e.target.closest(".music-track");
      if (playBtn) {
        const { track, source, idx } = trackByDataset(playBtn);
        if (track) playTrack(track, source, idx);
      } else if (addPl) {
        const { track } = trackByDataset(addPl);
        if (track && !state.playlist.some(x => x.id === track.id)) {
          state.playlist.push(track);
          persistMusicState();
          renderAll();
        }
      } else if (addQ) {
        const { track } = trackByDataset(addQ);
        if (track) {
          state.queue.push(track);
          persistMusicState();
          renderAll();
        }
      } else if (favBtn) {
        const id = favBtn.dataset.id;
        VStorage.toggleMusicFavorite(id);
        renderAll();
      } else if (row) {
        const source = row.dataset.type;
        const idx = Number(row.dataset.index);
        const arr = getSourceArray(source);
        if (arr[idx]) playTrack(arr[idx], source, idx);
      }
    });
  }

  function bootFromSaved() {
    const saved = VStorage.getMusicState();
    if (saved.lastTrack?.previewUrl) {
      state.currentTrack = saved.lastTrack;
      state.currentSource = saved.lastSource || "search";
      const list = getSourceArray(state.currentSource);
      state.currentIndex = list.findIndex(x => x.id === saved.lastTrack.id);
    }
    updatePlayerUI();
  }

  function bindPlayerEvents() {
    el.playPause.addEventListener("click", async () => {
      if (!state.currentTrack) return;
      if (el.audio.paused) {
        await el.audio.play().catch(() => {});
        el.playPause.textContent = "Pause";
      } else {
        el.audio.pause();
        el.playPause.textContent = "Play";
      }
    });
    el.next.addEventListener("click", nextTrack);
    el.prev.addEventListener("click", prevTrack);
    el.repeatBtn.addEventListener("click", () => {
      state.repeat = state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
      persistMusicState();
      renderAll();
    });
    el.nowFav.addEventListener("click", () => {
      if (!state.currentTrack) return;
      VStorage.toggleMusicFavorite(state.currentTrack.id);
      renderAll();
    });
    el.volume.addEventListener("input", () => {
      state.volume = Number(el.volume.value) / 100;
      el.audio.volume = state.volume;
      persistMusicState();
      el.volumeVal.textContent = `${Math.round(state.volume * 100)}%`;
    });
    el.progress.addEventListener("input", () => {
      const total = el.audio.duration || state.currentTrack?.duration || 0;
      if (!total) return;
      const pct = Number(el.progress.value) / 100;
      el.audio.currentTime = total * pct;
    });
    el.audio.addEventListener("timeupdate", () => {
      updatePlayerUI();
      updateSyncedLyrics();
    });
    el.audio.addEventListener("ended", () => {
      if (state.repeat === "one") {
        el.audio.currentTime = 0;
        el.audio.play().catch(() => {});
        return;
      }
      nextTrack();
    });
  }

  function init() {
    el = {
      search: document.getElementById("music-search"),
      searchStatus: document.getElementById("music-search-status"),
      searchResults: document.getElementById("music-search-results"),
      playlistResults: document.getElementById("music-playlist-results"),
      queueResults: document.getElementById("music-queue-results"),
      nowCover: document.getElementById("music-now-cover"),
      nowTitle: document.getElementById("music-now-title"),
      nowSub: document.getElementById("music-now-sub"),
      nowFav: document.getElementById("music-now-fav"),
      prev: document.getElementById("music-prev"),
      playPause: document.getElementById("music-playpause"),
      next: document.getElementById("music-next"),
      repeatBtn: document.getElementById("music-repeat"),
      volume: document.getElementById("music-volume"),
      volumeVal: document.getElementById("music-volume-val"),
      progress: document.getElementById("music-progress"),
      timeNow: document.getElementById("music-time-now"),
      timeTotal: document.getElementById("music-time-total"),
      lyrics: document.getElementById("music-lyrics"),
      audio: document.getElementById("music-audio"),
    };
    el.audio.volume = state.volume;
    el.search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(onSearchInput, 280);
    });
    bindListEvents(el.searchResults);
    bindListEvents(el.playlistResults);
    bindListEvents(el.queueResults);
    bindPlayerEvents();
    renderAll();
    bootFromSaved();
  }

  return { init };
})();

