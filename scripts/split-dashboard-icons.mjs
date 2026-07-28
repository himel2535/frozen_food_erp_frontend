/**
 * Split dashboard icon sheets into individual KPI PNGs.
 * Uses PowerShell System.Drawing (no sharp dependency).
 *
 * Run: node scripts/split-dashboard-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'images', 'dashboard');

const mainSheet =
  'C:/Users/hookm/.cursor/projects/c-Projects-toyerp/assets/c__Users_hookm_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_Jul_18__2026__05_26_46_PM-94dc6964-f055-4b21-b636-c067486f76ea.png';

const stockPairSheet =
  'C:/Users/hookm/.cursor/projects/c-Projects-toyerp/assets/c__Users_hookm_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-2667beb2-2d85-4e18-b355-82fe206eb70d.png';

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

// --- Main 4x3 sheet (SF/FG come from dedicated pair image below) ---
if (!fs.existsSync(mainSheet)) {
  console.error('Main sheet not found:', mainSheet);
  process.exit(1);
}

const cells = [
  { file: 'sales-summary.png', row: 1, col: 0, iconRatio: 0.74 },
  { file: 'rm-stock.png', row: 0, col: 1, iconRatio: 0.76 },
  { file: 'customer-due.png', row: 0, col: 2, iconRatio: 0.74 },
  { file: 'production-summary.png', row: 0, col: 3 },
  { file: 'purchase-summary.png', row: 1, col: 1, iconRatio: 0.75 },
  { file: 'pending-purchase.png', row: 1, col: 2, iconRatio: 0.74 },
  { file: 'pending-sales.png', row: 1, col: 3, iconRatio: 0.75 },
  { file: 'supplier-due.png', row: 2, col: 0 },
  { file: 'pending-production.png', row: 2, col: 1 },
  { file: 'low-stock.png', row: 2, col: 2 },
];

const cellsJson = JSON.stringify(cells).replace(/'/g, "''");
runPowerShell(`
Add-Type -AssemblyName System.Drawing
$srcPath = '${mainSheet.replace(/'/g, "''")}'
$outDir = '${outDir.replace(/'/g, "''")}'
$cells = ConvertFrom-Json '${cellsJson}'
$cols = 4
$rows = 3
$defaultIconRatio = 0.70
$pad = 0.05

$img = [System.Drawing.Image]::FromFile($srcPath)
$cellW = [int]($img.Width / $cols)
$cellH = [int]($img.Height / $rows)
Write-Host ("Sheet {0}x{1} cell {2}x{3}" -f $img.Width, $img.Height, $cellW, $cellH)

function Save-Crop($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

foreach ($c in $cells) {
  $ratio = if ($null -ne $c.iconRatio -and $c.iconRatio -gt 0) { [double]$c.iconRatio } else { $defaultIconRatio }
  $x0 = [int]($c.col * $cellW + $cellW * $pad)
  $y0 = [int]($c.row * $cellH + $cellH * 0.03)
  $w = [int]($cellW * (1 - 2 * $pad))
  $h = [int]($cellH * $ratio)
  if ($h -lt 1) { $h = [int]($cellH * 0.6) }
  $rect = New-Object System.Drawing.Rectangle $x0, $y0, $w, $h
  $crop = $img.Clone($rect, $img.PixelFormat)
  $outPath = Join-Path $outDir $c.file
  Save-Crop $crop $outPath
  Write-Host ("OK {0} ratio={1} {2}" -f $c.file, $ratio, (Get-Item $outPath).Length)
}

$img.Dispose()
Write-Host 'Main sheet done.'
`);

for (const c of cells) assertFile(c.file);

// --- Dedicated Semi Finished / FG Stock pair (side-by-side) ---
if (!fs.existsSync(stockPairSheet)) {
  console.error('Stock pair sheet not found:', stockPairSheet);
  process.exit(1);
}

runPowerShell(`
Add-Type -AssemblyName System.Drawing
$srcPath = '${stockPairSheet.replace(/'/g, "''")}'
$outDir = '${outDir.replace(/'/g, "''")}'
$img = [System.Drawing.Image]::FromFile($srcPath)
Write-Host ("Stock pair {0}x{1}" -f $img.Width, $img.Height)

# Two columns; crop icon area only (exclude bottom labels)
$cols = 2
$padX = 0.04
$padTop = 0.03
$iconRatio = 0.72
$cellW = [int]($img.Width / $cols)
$cellH = $img.Height

function Save-Crop($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$pairs = @(
  @{ file = 'sf-stock.png'; col = 0 },
  @{ file = 'fg-stock.png'; col = 1 }
)

foreach ($p in $pairs) {
  $x0 = [int]($p.col * $cellW + $cellW * $padX)
  $y0 = [int]($cellH * $padTop)
  $w = [int]($cellW * (1 - 2 * $padX))
  $h = [int]($cellH * $iconRatio)
  $rect = New-Object System.Drawing.Rectangle $x0, $y0, $w, $h
  $crop = $img.Clone($rect, $img.PixelFormat)
  $outPath = Join-Path $outDir $p.file
  Save-Crop $crop $outPath
  Write-Host ("OK {0} {1}" -f $p.file, (Get-Item $outPath).Length)
}

$img.Dispose()
Write-Host 'Stock pair done.'
`);

assertFile('sf-stock.png');
assertFile('fg-stock.png');

console.log('Exported icons to', outDir);
