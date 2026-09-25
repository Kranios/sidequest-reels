<#
Render one or more reels without taking the machine hostage.

  .\render.ps1 T1-Receipt-Itinerary
  .\render.ps1 T2-Reveal-Itinerary T5-Atlas-Itinerary -OutDir ..\output

- Bundles ONCE, then renders every id from that bundle (no re-bundle per reel).
- Runs at BelowNormal CPU priority: node, remotion.exe, Chrome and ffmpeg
  inherit it, so the desktop wins every tie.
- --concurrency=1 and --gl=angle explicitly (remotion.config.ts sets both
  too; the flags keep this script right if the config ever drifts).
- One reel per process, and between reels it kills whatever a finished or
  failed render left behind under node_modules, so RAM starts clean for the
  next one. Studio's esbuild.exe is not touched.
- CRF per template, from the QA bitrate floor (CLAUDE.md): T2 4, T5 8,
  otherwise the config's 16. -Crf overrides it for every id.
#>
[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)]
    [string[]] $Ids,
    [string] $OutDir = "out\templates",
    [int] $Crf = 0
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$TemplateCrf = @{ "T2" = 4; "T5" = 8 }
$Leftovers = 'chrome-headless-shell.exe', 'remotion.exe', 'ffmpeg.exe', 'ffprobe.exe'

function Stop-Leftovers {
    Get-CimInstance Win32_Process |
        Where-Object { $_.ExecutablePath -like '*reel_factory_v2\remotion\node_modules*' -and
                       $_.Name -in $Leftovers } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

# Chrome sets its own priority on some children (the GPU process runs
# AboveNormal), so inheritance alone is not enough: pull them back down
# every couple of seconds while a render runs.
function Limit-RenderPriority {
    Get-Process -Name chrome-headless-shell, remotion, ffmpeg -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -like '*reel_factory_v2\remotion\node_modules*' -and
                       $_.PriorityClass -notin 'BelowNormal', 'Idle' } |
        ForEach-Object { try { $_.PriorityClass = 'BelowNormal' } catch {} }
}

$me = Get-Process -Id $PID
$oldPriority = $me.PriorityClass
$me.PriorityClass = 'BelowNormal'
$bundle = Join-Path $env:TEMP "reel-bundle-$PID"
$failed = @()
try {
    New-Item -ItemType Directory -Force $OutDir | Out-Null
    Write-Host "bundling -> $bundle"
    npx remotion bundle src/index.ts --out-dir=$bundle --log=error
    if ($LASTEXITCODE -ne 0) { throw "bundle failed" }

    foreach ($id in $Ids) {
        $template = $id.Split('-')[0]
        $flags = @('--concurrency=1', '--gl=angle')
        if ($Crf -gt 0) { $flags += "--crf=$Crf" }
        elseif ($TemplateCrf.ContainsKey($template)) { $flags += "--crf=$($TemplateCrf[$template])" }

        $out = Join-Path $OutDir "$id.mp4"
        $sw = [Diagnostics.Stopwatch]::StartNew()
        Write-Host "`n== $id  ($($flags -join ' '))"
        $args_ = @('remotion', 'render', $bundle, $id, $out) + $flags
        $p = Start-Process -FilePath 'npx.cmd' -ArgumentList $args_ -NoNewWindow -PassThru
        $null = $p.Handle  # keeps ExitCode readable after exit
        while (-not $p.WaitForExit(2000)) { Limit-RenderPriority }
        $ok = $p.ExitCode -eq 0
        Stop-Leftovers
        [GC]::Collect()
        if ($ok) { Write-Host ("== {0} done in {1:N0} s -> {2}" -f $id, $sw.Elapsed.TotalSeconds, $out) }
        else { Write-Host "== $id FAILED" -ForegroundColor Red; $failed += $id }
    }
}
finally {
    Stop-Leftovers
    Remove-Item -Recurse -Force $bundle -ErrorAction SilentlyContinue
    $me.PriorityClass = $oldPriority
}
if ($failed) { Write-Host "`nfailed: $($failed -join ', ')" -ForegroundColor Red; exit 1 }
