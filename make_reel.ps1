# SideQuest Reel Factory v2 - snabb reel via green-screen compositing
# Anvandning:  .\make_reel.ps1 theme07_globe travel-tracker travel_tracker [scroll|still|seed]
#   arg1=config  arg2=app-route  arg3=namn  arg4=lage (default seed)
# Kraver att telefon-plattan finns (kor .\render_plate.ps1 en gang forst).
# INGEN Blender har - bara capture + composite + compose + QA. Snabbt.
param(
    [Parameter(Mandatory=$true)][string]$Config,
    [Parameter(Mandatory=$true)][string]$Route,
    [Parameter(Mandatory=$true)][string]$Screen,
    [string]$Mode = "seed"
)
$ErrorActionPreference = "Stop"
$root = "C:\Users\osgr1\Desktop\reel_factory_v2"
Set-Location $root
$env:SQ_APP_URL = "http://localhost:8081"
$plate = "cache\renders\_plate"
if (-not (Test-Path "$plate\f0000.png")) {
    Write-Host "Ingen telefon-platta hittad. Kor .\render_plate.ps1 forst." -ForegroundColor Red
    exit 1
}

Write-Host "1/5 Capture ($Mode)..." -ForegroundColor Cyan
if ($Mode -eq "scroll") {
    python capture\capture.py scroll $Route $Screen 45 20
    $appsrc = "cache\captures\$Screen"
    # NOTE: green-screen compositing maps the app image in 2D onto the detected
    # screen quad — no GLB UV involved — so NO 180 rotation here (that was only
    # for the old in-Blender texture path). Rotating here flips the screen.
} elseif ($Mode -eq "seed") {
    python capture\capture.py seed $Route $Screen
    $appsrc = "cache\captures\$Screen.png"
} else {
    python capture\capture.py still $Route $Screen
    $appsrc = "cache\captures\$Screen.png"
}

Write-Host "2/5 Preflight..." -ForegroundColor Cyan
python qa\qa.py preflight configs\$Config.json

Write-Host "3/5 Composite app UI onto phone plate..." -ForegroundColor Cyan
Remove-Item cache\renders\$Screen\*.png -Force -ErrorAction SilentlyContinue
python compose\screen_composite.py "$plate" "$appsrc" "cache\renders\$Screen"

Write-Host "4/5 Compose reel..." -ForegroundColor Cyan
python compose\compose.py configs\$Config.json

Write-Host "5/5 QA check..." -ForegroundColor Cyan
python qa\qa.py check output\$Config.mp4
if ($LASTEXITCODE -ne 0) { Write-Host "QA UNDERKAND - levererar INTE." -ForegroundColor Red; exit 1 }
Write-Host "KLAR - oppnar reelen" -ForegroundColor Green
Start-Process "output\$Config.mp4"
