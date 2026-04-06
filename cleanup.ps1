Get-ChildItem -Path html -Filter *.html | ForEach-Object {
    $content = [IO.File]::ReadAllText($_.FullName)
    # Remove CSS
    $content = $content -replace '(?s)#sidebarad1,.*?\.sidebar-frame \{.*?\}', ''
    # Remove DIVs
    $content = $content -replace '(?s)<div id=[\x22\x27]sidebarad1[\x22\x27]>.*?</div>', ''
    $content = $content -replace '(?s)<div id=[\x22\x27]sidebarad2[\x22\x27]>.*?</div>', ''
    # Remove obfuscated script
    $content = $content -replace '(?s)<script>\(function\(_0x598993,_0x33924f\).*?<\/script>', ''
    # Remove gn-math link
    $content = $content -replace '(?s)<a href=[\x22\x27]https://gn-math\.github\.io/.*?>.*?</a>', ''
    [IO.File]::WriteAllText($_.FullName, $content)
}
