import { 
  createIcons, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Box, 
  ShoppingCart, 
  Landmark, 
  Contact, 
  CreditCard, 
  FolderKanban, 
  Cpu, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  ChevronsUpDown, 
  ArrowLeftToLine, 
  ArrowRightToLine, 
  Menu, 
  Search, 
  Plus, 
  Bell, 
  MessageSquare, 
  Calendar, 
  Globe, 
  ChevronDown, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  User, 
  Package, 
  AlertTriangle,
  Mail,
  Phone,
  X,
  Eye,
  Trash2,
  SlidersHorizontal
} from 'lucide';

function initIcons() {
  createIcons({
    icons: {
      LayoutDashboard,
      Users,
      Receipt,
      Box,
      ShoppingCart,
      Landmark,
      Contact,
      CreditCard,
      FolderKanban,
      Cpu,
      BarChart3,
      Settings,
      ChevronRight,
      ChevronsUpDown,
      ArrowLeftToLine,
      ArrowRightToLine,
      Menu,
      Search,
      Plus,
      Bell,
      MessageSquare,
      Calendar,
      Globe,
      ChevronDown,
      ArrowUpRight,
      TrendingUp,
      DollarSign,
      User,
      Package,
      AlertTriangle,
      Mail,
      Phone,
      X,
      Eye,
      Trash2,
      SlidersHorizontal
    }
  });
}

// ----------------------------------------------------
// UI KIT DEMO ACTIONS
// ----------------------------------------------------
window.toggleModal = function(modalId, show) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }
};

window.toggleDSDrawer = function(show) {
  const overlay = document.getElementById('ds-demo-drawer-overlay');
  const drawer = document.getElementById('ds-demo-drawer');

  if (show) {
    overlay.classList.remove('hidden');
    setTimeout(() => {
      drawer.classList.remove('drawer-hidden');
      drawer.classList.add('drawer-visible');
    }, 10);
  } else {
    drawer.classList.remove('drawer-visible');
    drawer.classList.add('drawer-hidden');
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 300);
  }
};

// ----------------------------------------------------
// INITIALIZE PAGE
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
});
