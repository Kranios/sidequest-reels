# Rendera telefon-plattan EN gang (magenta skarm). Ateranvands for alla reels.
# Anvandning:  .\render_plate.ps1 [frames]   (default 45)
param([int]$Frames = 45)
$root = "C:\Users\osgr1\Desktop\reel_factory_v2"
$blender = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
Set-Location $root
$env:SQ_SCREEN_MESH = "Cube.010_screen.001_0"
$env:SQ_FACE_AXIS   = "-x"
$env:SQ_PHONE_ROT   = "0,0,0"
$env:SQ_CHROMA      = "1"   # magenta skarm
Write-Host "Renderar telefon-platta ($Frames frames, magenta skarm)..." -ForegroundColor Cyan
Remove-Item cache\renders\_plate\*.png -Force -ErrorAction SilentlyContinue
& $blender -b -P render\render_phone.py -- "chroma" "$root\cache\renders\_plate" $Frames
Write-Host "KLAR - platta i cache\renders\_plate (ateranvands for alla reels)" -ForegroundColor Green
