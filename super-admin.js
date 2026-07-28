import { 
  createIcons, 
  LayoutDashboard, 
  Building,
  Layers,
  CreditCard,
  PackageCheck,
  Users,
  Wallet,
  LifeBuoy,
  Settings,
  ArrowLeftToLine,
  ArrowRightToLine
} from 'lucide';

function initIcons() {
  createIcons({
    icons: {
      LayoutDashboard,
      Building,
      Layers,
      CreditCard,
      PackageCheck,
      Users,
      Wallet,
      LifeBuoy,
      Settings,
      ArrowLeftToLine,
      ArrowRightToLine
    }
  });
}

// ----------------------------------------------------
// SIDEBAR COLLAPSE TOGGLE
// ----------------------------------------------------
let sidebarCollapsed = false;

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const labels = document.querySelectorAll('.sidebar-label');
  const toggleIcon = document.getElementById('toggle-icon');

  sidebarCollapsed = !sidebarCollapsed;

  if (sidebarCollapsed) {
    sidebar.classList.remove('w-64');
    sidebar.classList.add('w-20');
    labels.forEach(l => l.classList.add('hidden'));
    toggleIcon.setAttribute('data-lucide', 'arrow-right-to-line');
  } else {
    sidebar.classList.remove('w-20');
    sidebar.classList.add('w-64');
    setTimeout(() => {
      if (!sidebarCollapsed) {
        labels.forEach(l => l.classList.remove('hidden'));
      }
    }, 150);
    toggleIcon.setAttribute('data-lucide', 'arrow-left-to-line');
  }
  initIcons();
  
  setTimeout(drawRevenueChart, 305);
  setTimeout(drawGrowthChart, 305);
}

// ----------------------------------------------------
// DYNAMIC SVG CHARTS DRAWING
// ----------------------------------------------------
function drawRevenueChart() {
  const box = document.getElementById('sa-revenue-box');
  const svg = document.getElementById('sa-revenue-svg');
  const path = document.getElementById('sa-rev-line');
  const area = document.getElementById('sa-rev-area');

  if (!box || !svg || !path) return;

  const w = box.clientWidth;
  const h = box.clientHeight - 20;

  // Revenue progression points
  const values = [120000, 145000, 138000, 160000, 155000, 185420];
  const max = 220000;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * w;
    const y = h - (val / max) * (h - 20);
    return { x, y };
  });

  const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  path.setAttribute('d', lineD);

  const areaD = `${lineD} L ${w} ${h} L 0 ${h} Z`;
  area.setAttribute('d', areaD);
}

function drawGrowthChart() {
  const box = document.getElementById('sa-growth-box');
  const svg = document.getElementById('sa-growth-svg');
  const path = document.getElementById('sa-growth-line');

  if (!box || !svg || !path) return;

  const w = box.clientWidth;
  const h = box.clientHeight - 20;

  // weekly company registrations curve
  const values = [800, 950, 1100, 1248];
  const max = 1500;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * w;
    const y = h - (val / max) * (h - 20);
    return { x, y };
  });

  const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  path.setAttribute('d', lineD);
}

// ----------------------------------------------------
// BOOTSTRAP INITIAL
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  drawRevenueChart();
  drawGrowthChart();

  document.addEventListener('click', (e) => {
    if (e.target.closest('#sidebar-toggle')) {
      toggleSidebar();
    }
  });

  window.addEventListener('resize', () => {
    drawRevenueChart();
    drawGrowthChart();
  });
});
