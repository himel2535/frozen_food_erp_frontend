/**
 * Split sidebar icon sheet into individual label-free PNGs.
 * Uses PowerShell System.Drawing with full-row scan on the left icon zone.
 *
 * Run: node scripts/split-sidebar-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'images', 'sidebar');

const sourceSheet =
  'C:/Users/hookm/.cursor/projects/c-Projects-toyerp/assets/c__Users_hookm_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_Jul_19__2026__09_39_33_AM-d3f64db5-3534-48f1-8cae-31eb9f4bcf66.png';

fs.mkdirSync(outDir, { recursive: true });

function runPowerShell(script) {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) {
    console.error('Crop failed with exit', result.status);
    process.exit(result.status || 1);
  }
}

function assertFile(file) {
  const p = path.join(outDir, file);
  if (!fs.existsSync(p) || fs.statSync(p).size < 200) {
    console.error('Missing or empty:', file);
    process.exit(1);
  }
}

if (!fs.existsSync(sourceSheet)) {
  console.error('Sidebar sheet not found:', sourceSheet);
  process.exit(1);
}

const rows = [
  { file: 'sales-crm.png', row: 0, bottomBleed: 20 },
  { file: 'inventory.png', row: 1 },
  { file: 'purchases.png', row: 2 },
  { file: 'factory.png', row: 3 },
  { file: 'accounts.png', row: 4 },
  { file: 'hr.png', row: 5 },
  { file: 'payroll.png', row: 6 },
  { file: 'assets.png', row: 7, topBleed: 12 },
  { file: 'reports.png', row: 8 },
  { file: 'administration.png', row: 9, topBleed: 20 },
];

const rowsJson = JSON.stringify(rows).replace(/'/g, "''");
runPowerShell(`
Add-Type -AssemblyName System.Drawing
$srcPath = '${sourceSheet.replace(/'/g, "''")}'
$outDir = '${outDir.replace(/'/g, "''")}'
$rows = ConvertFrom-Json '${rowsJson}'
$rowCount = 10
$threshold = 245
$iconZoneRatio = 0.40
$pad = 12

$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap $img
$cellH = [int]($bmp.Height / $rowCount)
$zoneW = [int]($bmp.Width * $iconZoneRatio)
Write-Host ("Sheet {0}x{1} cellH {2} zoneW {3}" -f $bmp.Width, $bmp.Height, $cellH, $zoneW)

function Save-Crop($bitmap, $path) {
  $margin = 12
  $canvas = New-Object System.Drawing.Bitmap ($bitmap.Width + 2 * $margin), ($bitmap.Height + 2 * $margin)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($bitmap, $margin, $margin, $bitmap.Width, $bitmap.Height)
  $g.Dispose()
  $canvas.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  $bitmap.Dispose()
}

foreach ($r in $rows) {
  $cellTop = $r.row * $cellH
  $cellBot = [Math]::Min($bmp.Height - 1, $cellTop + $cellH - 1)
  $topBleed = if ($null -ne $r.topBleed) { [int]$r.topBleed } else { 0 }
  $bottomBleed = if ($null -ne $r.bottomBleed) { [int]$r.bottomBleed } else { 0 }
  # Scan own cell; optional bleed allows soft edges that cross cell boundaries
  $scanTop = [Math]::Max(0, $cellTop - $topBleed)
  $scanBot = [Math]::Min($bmp.Height - 1, $cellBot + $bottomBleed)
  $midY = [int](($cellTop + $cellBot) / 2)

  $densities = @{}
  for ($y = $scanTop; $y -le $scanBot; $y++) {
    $ink = 0
    for ($x = 0; $x -lt $zoneW; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $ink++ }
    }
    $densities[$y] = $ink
  }

  # Peak must be inside this cell so we don't latch onto a neighbor icon
  $peakY = $midY
  $peakInk = 0
  for ($y = $cellTop; $y -le $cellBot; $y++) {
    $ink = $densities[$y]
    $dist = [Math]::Abs($y - $midY)
    $bestDist = [Math]::Abs($peakY - $midY)
    if (($ink -gt $peakInk) -or (($ink -eq $peakInk) -and ($dist -lt $bestDist))) {
      $peakInk = $ink
      $peakY = $y
    }
  }

  if ($peakInk -lt 5) {
    Write-Host ("WARN empty row {0}" -f $r.file)
    continue
  }

  # Skip sparse neighbor bleed at cell top; real icon = 3+ consecutive dense rows
  # With topBleed, allow icon start above cellTop
  $iconStartY = $scanTop
  $stableRun = 0
  $startThreshold = [Math]::Max(5, [int]($peakInk * 0.12))
  for ($y = $scanTop; $y -le $cellBot; $y++) {
    if ($densities[$y] -ge $startThreshold) {
      $stableRun++
      if ($stableRun -ge 3) { $iconStartY = $y - 2; break }
    } else { $stableRun = 0 }
  }

  # Vertical band: expand from peak until white gap (2+ consecutive near-empty rows)
  $minInk = [Math]::Max(3, [int]($peakInk * 0.10))
  $bandTop = $peakY
  $bandBot = $peakY
  $emptyRun = 0
  for ($y = $peakY - 1; $y -ge $iconStartY; $y--) {
    if ($densities[$y] -ge $minInk) { $bandTop = $y; $emptyRun = 0 }
    else {
      $emptyRun++
      if ($emptyRun -ge 2) { break }
    }
  }
  $bandTop = [Math]::Max($bandTop, $iconStartY)
  $emptyRun = 0
  for ($y = $peakY + 1; $y -le $scanBot; $y++) {
    if ($densities[$y] -ge $minInk) { $bandBot = $y; $emptyRun = 0 }
    else {
      $emptyRun++
      if ($emptyRun -ge 2) { break }
    }
  }

  $minX = $zoneW
  $maxX = 0
  $minY = $bandBot
  $maxY = $bandTop
  $found = $false
  for ($y = $bandTop; $y -le $bandBot; $y++) {
    for ($x = 0; $x -lt $zoneW; $x++) {
      $c = $bmp.GetPixel($x, $y)
      $isBg = ($c.R -ge $threshold -and $c.G -ge $threshold -and $c.B -ge $threshold)
      if (-not $isBg) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
        $found = $true
      }
    }
  }

  if (-not $found) {
    Write-Host ("WARN empty band {0}" -f $r.file)
    continue
  }

  # Cut after 3 consecutive near-white columns (icon → label gap)
  $gapX = -1
  $gapRun = 0
  for ($x = $minX + 40; $x -le $maxX; $x++) {
    $ink = 0
    for ($y = $bandTop; $y -le $bandBot; $y++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $ink++ }
    }
    if ($ink -le 2) {
      $gapRun++
      if ($gapRun -ge 3) { $gapX = $x - 2; break }
    } else {
      $gapRun = 0
    }
  }
  if ($gapX -gt 0) { $maxX = $gapX - 1 }

  $x0 = [Math]::Max(0, $minX - $pad)
  $y0 = [Math]::Max([Math]::Max(0, $cellTop - $topBleed), $minY - $pad)
  $x1 = [Math]::Min($zoneW - 1, $maxX + $pad)
  $y1 = [Math]::Min([Math]::Min($bmp.Height - 1, $cellBot + $bottomBleed), $maxY + $pad)
  $w = $x1 - $x0 + 1
  $h = $y1 - $y0 + 1

  $rect = New-Object System.Drawing.Rectangle $x0, $y0, $w, $h
  $crop = $bmp.Clone($rect, $bmp.PixelFormat)
  $outPath = Join-Path $outDir $r.file
  Save-Crop $crop $outPath
  Write-Host ("OK {0} {1}x{2} @({3},{4}) band={5}-{6} {7}" -f $r.file, $w, $h, $x0, $y0, $bandTop, $bandBot, (Get-Item $outPath).Length)
}

$bmp.Dispose()
$img.Dispose()
Write-Host 'Sidebar icons done.'
`);

for (const r of rows) assertFile(r.file);
console.log('Exported icons to', outDir);
