/**
 * Split Sales & CRM submenu screenshot into 12 label-free PNGs.
 * Detects icon clusters by ink (skips header cluster 0). No equal-row assumption.
 *
 * Run: node scripts/split-sales-crm-submenu-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'public', 'images', 'sidebar', 'sales-crm');

const sourceSheet =
  'C:/Users/hookm/.cursor/projects/c-Projects-toyerp/assets/c__Users_hookm_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-8446f0f7-65e6-46b7-8b47-47379210f75c.png';

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
  console.error('Sales & CRM submenu sheet not found:', sourceSheet);
  process.exit(1);
}

// Cluster 0 = header (skipped). Clusters 1–12 map to these files in order.
const files = [
  'customers.png',
  'leads.png',
  'deals.png',
  'quotations.png',
  'orders.png',
  'deliveries.png',
  'dispatch.png',
  'invoices.png',
  'payments.png',
  'returns.png',
  'pos.png',
  'complaints.png',
];

const filesJson = JSON.stringify(files).replace(/'/g, "''");
runPowerShell(`
Add-Type -AssemblyName System.Drawing
$srcPath = '${sourceSheet.replace(/'/g, "''")}'
$outDir = '${outDir.replace(/'/g, "''")}'
$files = ConvertFrom-Json '${filesJson}'
$threshold = 245
$zoneLeft = 28
$zoneRight = 68
$pad = 1
$clusterGap = 4
$minClusterInk = 3

$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap $img
$zoneRight = [Math]::Min($zoneRight, $bmp.Width - 1)
Write-Host ("Sheet {0}x{1} zoneX {2}-{3}" -f $bmp.Width, $bmp.Height, $zoneLeft, $zoneRight)

$dens = New-Object int[] $bmp.Height
for ($y = 0; $y -lt $bmp.Height; $y++) {
  $ink = 0
  for ($x = $zoneLeft; $x -le $zoneRight; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $ink++ }
  }
  $dens[$y] = $ink
}

$clusters = New-Object System.Collections.Generic.List[object]
$in = $false
$start = 0
$empty = 0
for ($y = 0; $y -lt $bmp.Height; $y++) {
  if ($dens[$y] -ge $minClusterInk) {
    if (-not $in) { $start = $y; $in = $true }
    $empty = 0
  } elseif ($in) {
    $empty++
    if ($empty -ge $clusterGap) {
      $bot = $y - $empty
      $clusters.Add([pscustomobject]@{ top = $start; bot = $bot })
      $in = $false
      $empty = 0
    }
  }
}
if ($in) { $clusters.Add([pscustomobject]@{ top = $start; bot = ($bmp.Height - 1) }) }

Write-Host ("Found {0} clusters (expect 13: header + 12 icons)" -f $clusters.Count)
if ($clusters.Count -lt 13) {
  Write-Host 'ERROR: not enough icon clusters'
  exit 1
}

function Save-Crop($bitmap, $path) {
  # Fixed square canvas so all submenu icons render at equal visual scale
  $canvasSize = 64
  $maxArt = 62
  $scale = [Math]::Min($maxArt / [double]$bitmap.Width, $maxArt / [double]$bitmap.Height)
  $dw = [Math]::Max(1, [int][Math]::Round($bitmap.Width * $scale))
  $dh = [Math]::Max(1, [int][Math]::Round($bitmap.Height * $scale))
  $dx = [int](($canvasSize - $dw) / 2)
  $dy = [int](($canvasSize - $dh) / 2)
  $canvas = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($bitmap, $dx, $dy, $dw, $dh)
  $g.Dispose()
  $canvas.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  $bitmap.Dispose()
}

# Skip cluster 0 (Sales & CRM header)
for ($i = 0; $i -lt $files.Count; $i++) {
  $file = $files[$i]
  $c = $clusters[$i + 1]
  $bandTop = $c.top
  $bandBot = $c.bot

  $minX = $zoneRight
  $maxX = $zoneLeft
  $minY = $bandBot
  $maxY = $bandTop
  $found = $false
  for ($y = $bandTop; $y -le $bandBot; $y++) {
    for ($x = $zoneLeft; $x -le $zoneRight; $x++) {
      $px = $bmp.GetPixel($x, $y)
      $isBg = ($px.R -ge $threshold -and $px.G -ge $threshold -and $px.B -ge $threshold)
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
    Write-Host ("WARN empty {0}" -f $file)
    continue
  }

  $x0 = [Math]::Max($zoneLeft, $minX - $pad)
  $y0 = [Math]::Max(0, $minY - $pad)
  $x1 = [Math]::Min($zoneRight, $maxX + $pad)
  $y1 = [Math]::Min($bmp.Height - 1, $maxY + $pad)
  # Do not pull Y into neighboring clusters
  if ($i -gt 0) {
    $prevBot = $clusters[$i].bot
    $y0 = [Math]::Max($y0, $prevBot + 2)
  }
  if (($i + 2) -lt $clusters.Count) {
    $nextTop = $clusters[$i + 2].top
    $y1 = [Math]::Min($y1, $nextTop - 2)
  }
  $w = $x1 - $x0 + 1
  $h = $y1 - $y0 + 1

  $rect = New-Object System.Drawing.Rectangle $x0, $y0, $w, $h
  $crop = $bmp.Clone($rect, $bmp.PixelFormat)
  $outPath = Join-Path $outDir $file
  Save-Crop $crop $outPath
  Write-Host ("OK {0} {1}x{2} @({3},{4}) band={5}-{6} {7}" -f $file, $w, $h, $x0, $y0, $bandTop, $bandBot, (Get-Item $outPath).Length)
}

$bmp.Dispose()
$img.Dispose()
Write-Host 'Sales & CRM submenu icons done.'
`);

for (const f of files) assertFile(f);
console.log('Exported icons to', outDir);
