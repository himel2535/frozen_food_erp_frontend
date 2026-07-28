// ============================================================
// SHARED MODULE — Used by every page in the MPA
// ============================================================
import { 
  createIcons, 
  ArrowLeft,
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
  SlidersHorizontal,
  ArrowUpRight, 
  ArrowDownLeft,
  TrendingUp, 
  DollarSign, 
  User, 
  Package, 
  PackageCheck,
  AlertTriangle,
  AlertCircle,
  Mail,
  Phone,
  X,
  Eye,
  Trash2,
  Printer,
  Download,
  Check,
  LayoutGrid,
  ArrowDownToLine,
  UserPlus,
  ShoppingBag,
  PackagePlus,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  ArrowUpFromLine,
  Scale,
  FileText,
  TrendingDown,
  Factory,
  Boxes,
  Puzzle
} from 'lucide';
import { saveRemoteAppState, subscribeToRemoteAppState } from '/js/firebase.js';
import { translations, phrases } from '/js/i18n.js';
import { ensureCrmState } from '/js/crm-service.js';

// ----------------------------------------------------
// ICON SYSTEM
// ----------------------------------------------------
export function initIcons() {
  createIcons({
    icons: {
      ArrowLeft,
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
      SlidersHorizontal,
      ArrowUpRight,
      ArrowDownLeft,
      TrendingUp,
      DollarSign,
      User,
      Package,
      PackageCheck,
      AlertTriangle,
      AlertCircle,
      Mail,
      Phone,
      X,
      Eye,
      Trash2,
      Printer,
      Download,
      Check,
      LayoutGrid,
      ArrowDownToLine,
      UserPlus,
      ShoppingBag,
      PackagePlus,
      ArrowRightLeft,
      Clock,
      CheckCircle,
      ArrowUpFromLine,
      Scale,
      FileText,
      TrendingDown,
      Factory,
      Boxes,
      Puzzle
    }
  });
}

// Make initIcons available globally for layout.js and inline handlers
window.initIcons = initIcons;

// ----------------------------------------------------
// STATE SYSTEM & MOCK DATABASE
// ----------------------------------------------------
export const DEFAULT_STATE = {
  isLoggedIn: false,
  sidebarCollapsed: false,
  crmFilter: 'all',
  invFilterCategory: 'all',
  hrmActiveTab: 'directory',
  hrmDirectoryFilterStatus: 'all',
  hrmDirectoryFilterDept: 'all',
  hrmAttendanceDate: '2026-06-17',
  salesUi: {
    customerFilter: 'all',
    statusFilter: 'all',
    riskFilter: 'all',
    dateStart: '',
    dateEnd: '',
    search: '',
    selectedInvoiceId: null
  },
  invoiceApprovalsById: {},
  recurringInvoicesById: {},
  paymentAllocationsById: {},
  crmCustomers: [
    { id: 1, name: "Alexander Graham", company: "Bell Labs", phone: "+1 555-0199", email: "alexander@bell.com", status: "active", sales: 12450.00, due: 0.00 },
    { id: 2, name: "Marie Curie", company: "Radium Co", phone: "+33 1 4276", email: "marie@radium.org", status: "overdue", sales: 45200.00, due: 2450.00 },
    { id: 3, name: "Thomas Edison", company: "General Electric", phone: "+1 555-9832", email: "edison@ge.com", status: "active", sales: 89000.00, due: 0.00 },
    { id: 4, name: "Nikola Tesla", company: "Wardenclyffe", phone: "+1 555-4309", email: "tesla@lightning.net", status: "inactive", sales: 0.00, due: 12000.00 }
  ],
  inventory: [
    { 
      id: 1, 
      name: "Premium ABS Plastic Pellets", 
      sku: "SKU-PLST-01", 
      category: "Plastic Pellets", 
      productType: "Raw Materials",
      cost: 2.50, 
      price: 4.50, 
      wholesalePrice: 3.50,
      taxRate: 5,
      stock: 4500, 
      warehouseStock: { "WH-001": 3000, "WH-002": 1500 },
      minStock: 1000,
      reorderLevel: 1500,
      defaultWarehouse: "WH-001",
      description: "High quality ABS plastic pellets for injection molding.",
      uom: "kg",
      reserved: 500,
      discontinued: false
    },
    { 
      id: 2, 
      name: "Red Dye Colorant", 
      sku: "SKU-DYE-02", 
      category: "Colorants", 
      productType: "Raw Materials",
      cost: 15.00, 
      price: 25.00, 
      wholesalePrice: 20.00,
      taxRate: 12,
      stock: 250, 
      warehouseStock: { "WH-001": 150, "WH-002": 100 },
      minStock: 30,
      reorderLevel: 50,
      defaultWarehouse: "WH-001",
      description: "Concentrated red dye for plastic molding.",
      uom: "liter",
      reserved: 5,
      discontinued: false
    },
    { 
      id: 3, 
      name: "Action Figure Arms", 
      sku: "SKU-AF-ARMS", 
      category: "Action Figure Parts", 
      productType: "Semi-Finished Goods",
      cost: 0.40, 
      price: 1.00, 
      wholesalePrice: 0.80,
      taxRate: 15,
      stock: 8000, 
      warehouseStock: { "WH-001": 5000, "WH-002": 3000 },
      minStock: 1000,
      reorderLevel: 2000,
      defaultWarehouse: "WH-001",
      description: "Molded arms for standard action figure assembly.",
      uom: "pcs",
      reserved: 1000,
      discontinued: false
    },
    { 
      id: 4, 
      name: "Super Hero Action Figure", 
      sku: "SKU-AF-SH01", 
      category: "Action Figures", 
      productType: "Finished Goods",
      cost: 2.10, 
      price: 12.99, 
      wholesalePrice: 8.50,
      taxRate: 5,
      stock: 1200, 
      warehouseStock: { "WH-001": 1200, "WH-002": 0 },
      minStock: 500,
      reorderLevel: 800,
      defaultWarehouse: "WH-001",
      description: "Fully assembled and packaged super hero action figure.",
      uom: "pcs",
      reserved: 200,
      discontinued: false
    }
  ],
  inventoryCategories: [
    {
      id: "CAT-001",
      code: "PLST",
      name: "Plastic Pellets",
      type: "Raw Materials",
      description: "Plastic resins and pellets used in injection molding.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 5,
      defaultUnitType: "kg",
      stockPolicy: "FIFO"
    },
    {
      id: "CAT-002",
      code: "COL",
      name: "Colorants",
      type: "Raw Materials",
      description: "Coloring materials, pigments, and dyes for plastic.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 12,
      defaultUnitType: "l",
      stockPolicy: "FEFO"
    },
    {
      id: "CAT-003",
      code: "PART",
      name: "Action Figure Parts",
      type: "Semi-Finished Goods",
      description: "Molded parts ready for assembly.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 15,
      defaultUnitType: "pcs",
      stockPolicy: "FIFO"
    },
    {
      id: "CAT-004",
      code: "RCC",
      name: "RC Car Components",
      type: "Semi-Finished Goods",
      description: "Chassis, motors, and wheels for RC cars.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 10,
      defaultUnitType: "pcs",
      stockPolicy: "FIFO"
    },
    {
      id: "CAT-005",
      code: "ACT",
      name: "Action Figures",
      type: "Finished Goods",
      description: "Sellable assembled action figures.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 15,
      defaultUnitType: "pcs",
      stockPolicy: "FIFO"
    },
    {
      id: "CAT-006",
      code: "RCC-FG",
      name: "RC Cars",
      type: "Finished Goods",
      description: "Sellable boxed RC Cars.",
      parentId: "",
      status: "Active",
      defaultTaxRate: 15,
      defaultUnitType: "pcs",
      stockPolicy: "FIFO"
    }
  ],
  inventoryUnits: [
    { id: "UOM-001", code: "kg", name: "Kilogram", symbol: "kg", status: "Active", description: "Weight in kilograms" },
    { id: "UOM-002", code: "liter", name: "Liter", symbol: "L", status: "Active", description: "Liquid volume in liters" },
    { id: "UOM-003", code: "pcs", name: "Pieces", symbol: "pcs", status: "Active", description: "Countable units" },
    { id: "UOM-004", code: "box", name: "Box", symbol: "box", status: "Active", description: "Packaging box" },
    { id: "UOM-005", code: "carton", name: "Carton", symbol: "ctn", status: "Active", description: "Shipping carton" },
    { id: "UOM-006", code: "set", name: "Set", symbol: "set", status: "Active", description: "Assembled set" }
  ],
  inventoryWarehouses: [
    {
      id: "WH-001",
      name: "Central Hub",
      location: "Dhaka",
      capacity: 10000,
      type: "Main Warehouse",
      manager: "Sarah Connor",
      contact: "+880 1711-223344",
      status: "Active",
      allowedProductTypes: "Yarn, Dyes, Fabrics",
      storageRules: "FIFO, Temp-controlled"
    },
    {
      id: "WH-002",
      name: "Main Warehouse",
      location: "New York",
      capacity: 8000,
      type: "Main Warehouse",
      manager: "John Connor",
      contact: "+1 212-555-0144",
      status: "Active",
      allowedProductTypes: "Yarn, Fabrics",
      storageRules: "FIFO, Secure access"
    },
    {
      id: "WH-003",
      name: "Regional Warehouse",
      location: "London",
      capacity: 6500,
      type: "Regional Warehouse",
      manager: "Ellen Ripley",
      contact: "+44 20 7946 0821",
      status: "Active",
      allowedProductTypes: "Dyes, Fabrics",
      storageRules: "FEFO, Hazard review"
    },
    {
      id: "WH-004",
      name: "Retail Storage",
      location: "Tokyo",
      capacity: 4000,
      type: "Retail Storage",
      manager: "Marcus Wright",
      contact: "+81 3-4510-8821",
      status: "Inactive",
      allowedProductTypes: "Fabrics, Accessories",
      storageRules: "Display-ready, Fast-pick"
    }
  ],
  invoices: [
    { id: "INV-2025-00145", customerId: 1, date: "2025-06-12", amount: 2450.00, paid: 2450.00, due: 0.00, status: "paid", items: [{ name: "Premium Cotton Yarn", quantity: 140, price: 12.50, total: 1750.00 }, { name: "Indigo Dye Concentrate", quantity: 5, price: 85.00, total: 425.00 }], discount: 0, tax: 275.00 },
    { id: "INV-2025-00144", customerId: 2, date: "2025-06-11", amount: 1850.00, paid: 0.00, due: 1850.00, status: "pending", items: [{ name: "Silk Satin Blend Fabric", quantity: 70, price: 24.00, total: 1680.00 }], discount: 0, tax: 170.00 },
    { id: "INV-2025-00143", customerId: 3, date: "2025-06-10", amount: 3200.00, paid: 3200.00, due: 0.00, status: "paid", items: [{ name: "Premium Cotton Yarn", quantity: 200, price: 12.50, total: 2500.00 }, { name: "Polyester Thread Spool", quantity: 90, price: 4.50, total: 405.00 }], discount: 0, tax: 295.00 },
    { id: "INV-2025-00142", customerId: 4, date: "2025-06-09", amount: 950.00, paid: 0.00, due: 950.00, status: "overdue", items: [{ name: "Indigo Dye Concentrate", quantity: 10, price: 85.00, total: 850.00 }], discount: 0, tax: 100.00 },
    { id: "INV-2025-00141", customerId: 1, date: "2025-06-08", amount: 4125.00, paid: 4125.00, due: 0.00, status: "paid", items: [{ name: "Silk Satin Blend Fabric", quantity: 150, price: 24.00, total: 3600.00 }, { name: "Polyester Thread Spool", quantity: 33, price: 4.50, total: 150.00 }], discount: 0, tax: 375.00 }
  ],
  employees: [
    { id: "EMP-001", name: "Sarah Connor", department: "IT", designation: "Lead DevOps Architect", phone: "+1 555-9081", email: "sarah.c@hookerp.com", joiningDate: "2023-01-15", status: "active" },
    { id: "EMP-002", name: "John Connor", department: "IT", designation: "Full Stack Engineer", phone: "+1 555-9082", email: "john.c@hookerp.com", joiningDate: "2023-06-20", status: "active" },
    { id: "EMP-003", name: "Ellen Ripley", department: "Production", designation: "Operations Director", phone: "+1 555-8711", email: "ripley@hookerp.com", joiningDate: "2021-11-01", status: "active" },
    { id: "EMP-004", name: "Arthur Dent", department: "HR", designation: "HR Specialist", phone: "+1 555-4242", email: "dent@hookerp.com", joiningDate: "2024-02-10", status: "on-leave" },
    { id: "EMP-005", name: "Marcus Wright", department: "Sales", designation: "VP of Sales", phone: "+1 555-2018", email: "marcus.w@hookerp.com", joiningDate: "2022-09-05", status: "inactive" }
  ],
  attendance: [
    { date: "2026-06-16", employeeId: "EMP-001", checkIn: "08:45 AM", checkOut: "05:15 PM", status: "Present", workingHours: 8.5 },
    { date: "2026-06-16", employeeId: "EMP-002", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Late", workingHours: 8.75 },
    { date: "2026-06-16", employeeId: "EMP-003", checkIn: "08:30 AM", checkOut: "05:00 PM", status: "Present", workingHours: 8.5 },
    { date: "2026-06-16", employeeId: "EMP-004", checkIn: "--", checkOut: "--", status: "On Leave", workingHours: 0 },
    { date: "2026-06-16", employeeId: "EMP-005", checkIn: "--", checkOut: "--", status: "Absent", workingHours: 0 },
    { date: "2026-06-17", employeeId: "EMP-001", checkIn: "08:50 AM", checkOut: "", status: "Present", workingHours: 0 },
    { date: "2026-06-17", employeeId: "EMP-002", checkIn: "09:35 AM", checkOut: "", status: "Late", workingHours: 0 },
    { date: "2026-06-17", employeeId: "EMP-003", checkIn: "", checkOut: "", status: "Absent", workingHours: 0 },
    { date: "2026-06-17", employeeId: "EMP-004", checkIn: "--", checkOut: "--", status: "On Leave", workingHours: 0 }
  ],
  purchases: [
    { id: "PO-2026-00041", supplier: "Apex Yarns Ltd", date: "2026-06-14", qty: 250, total: 3125.00, status: "Received" },
    { id: "PO-2026-00042", supplier: "Global Dye Chemicals", date: "2026-06-15", qty: 15, total: 825.00, status: "Sent" },
    { id: "PO-2026-00043", supplier: "Universal Silks Co", date: "2026-06-16", qty: 90, total: 1260.00, status: "Draft" }
  ],
  accounting: [
    { ref: "TXN-100245", date: "2026-06-14", account: "Sales Revenue", desc: "Invoice payment INV-00141", debit: 0.00, credit: 4125.00, balance: 12450.00 },
    { ref: "TXN-100246", date: "2026-06-15", account: "Office Expenses", desc: "Internet monthly fiber fee", debit: 120.00, credit: 0.00, balance: 12330.00 },
    { ref: "TXN-100247", date: "2026-06-16", account: "Cost of Goods Sold", desc: "Purchase apex yarn batch PO-00041", debit: 3125.00, credit: 0.00, balance: 9205.00 }
  ],
  payroll: [
    { id: "PAY-0091", name: "Sarah Connor", base: 8500, allowances: 450, deductions: 220, net: 8730, date: "2026-05-30", status: "Disbursed" },
    { id: "PAY-0092", name: "John Connor", base: 6000, allowances: 200, deductions: 150, net: 6050, date: "2026-05-30", status: "Disbursed" },
    { id: "PAY-0093", name: "Arthur Dent", base: 4500, allowances: 100, deductions: 100, net: 4500, date: "2026-05-30", status: "Pending" }
  ],
  projects: [
    { name: "ERP System Launch", lead: "Sarah Connor", deadline: "2026-08-30", progress: 68, health: "On Track", budget: 15000 },
    { name: "B2B Portal Integrations", lead: "John Connor", deadline: "2026-07-15", progress: 40, health: "At Risk", budget: 8500 }
  ],
  manufacturing: [
    { id: "WO-99081", product: "Premium Cotton Yarn", qty: 500, start: "2026-06-15", end: "2026-06-20", stage: "Assembly" },
    { id: "WO-99082", product: "Silk Satin Blend Fabric", qty: 200, start: "2026-06-16", end: "2026-06-22", stage: "Queue" }
  ]
};

const LOCAL_STORAGE_KEY = 'hookerp_auth_state';

function cloneDefaultWarehouses() {
  return DEFAULT_STATE.inventoryWarehouses.map((warehouse) => ({ ...warehouse }));
}

function cloneDefaultInventoryCategories() {
  return DEFAULT_STATE.inventoryCategories.map((category) => ({ ...category }));
}

function cloneDefaultInventoryUnits() {
  return DEFAULT_STATE.inventoryUnits.map((unit) => ({ ...unit }));
}

function normalizeInventoryUnitRecord(record, index = 0) {
  const fallback = DEFAULT_STATE.inventoryUnits[index] || {};
  return {
    id: record?.id || fallback.id || `UOM-${String(index + 1).padStart(3, '0')}`,
    code: String(record?.code || fallback.code || '').trim().toLowerCase(),
    name: String(record?.name || fallback.name || `Unit ${index + 1}`).trim(),
    symbol: String(record?.symbol || fallback.symbol || record?.code || '').trim(),
    status: String(record?.status || fallback.status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
    description: String(record?.description || fallback.description || '').trim()
  };
}

function normalizeInventoryUnits(units) {
  const source = Array.isArray(units) && units.length ? units : cloneDefaultInventoryUnits();
  const normalizedById = new Map();
  source.forEach((unit, index) => {
    const normalized = normalizeInventoryUnitRecord(unit, index);
    if (!normalizedById.has(normalized.id)) {
      normalizedById.set(normalized.id, normalized);
    }
  });
  return Array.from(normalizedById.values());
}

function normalizeCategoryStatus(status) {
  return String(status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
}

function createCategoryCodeFromName(name) {
  const lettersOnly = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  if (!lettersOnly) return '';

  const words = lettersOnly.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 4);
  }

  return words.map((word) => word[0]).join('').slice(0, 4);
}

function normalizeInventoryCategoryRecord(record, index = 0) {
  const fallback = DEFAULT_STATE.inventoryCategories[index] || {};

  return {
    id: record?.id || fallback.id || `CAT-${String(index + 1).padStart(3, '0')}`,
    code: String(record?.code || fallback.code || createCategoryCodeFromName(record?.name || fallback.name || '')).trim().toUpperCase(),
    name: String(record?.name || fallback.name || `Category ${index + 1}`).trim(),
    type: String(record?.type || fallback.type || 'Finished Goods').trim(),
    description: String(record?.description || fallback.description || '').trim(),
    parentId: String(record?.parentId || fallback.parentId || '').trim(),
    status: normalizeCategoryStatus(record?.status || fallback.status),
    defaultTaxRate: Number.parseFloat(record?.defaultTaxRate ?? fallback.defaultTaxRate ?? 0) || 0,
    defaultUnitType: String(record?.defaultUnitType || fallback.defaultUnitType || '').trim(),
    stockPolicy: String(record?.stockPolicy || fallback.stockPolicy || '').trim()
  };
}

function getNextGeneratedCategoryId(existingIds) {
  const maxNumericId = existingIds.reduce((maxValue, id) => {
    const numericId = Number.parseInt(String(id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);

  return `CAT-${String(maxNumericId + 1).padStart(3, '0')}`;
}

function normalizeInventoryCategories(categories, inventory = []) {
  const incoming = Array.isArray(categories) ? categories : cloneDefaultInventoryCategories();
  const normalizedByName = new Map();

  incoming.forEach((category, index) => {
    const normalized = normalizeInventoryCategoryRecord(category, index);
    normalizedByName.set(normalized.name.toLowerCase(), normalized);
  });

  const usedIds = Array.from(normalizedByName.values()).map((category) => category.id);

  inventory.forEach((product) => {
    const categoryName = String(product?.category || '').trim();
    if (!categoryName) return;

    const key = categoryName.toLowerCase();
    if (normalizedByName.has(key)) return;

    const generatedId = getNextGeneratedCategoryId(usedIds);
    usedIds.push(generatedId);

    normalizedByName.set(key, normalizeInventoryCategoryRecord({
      id: generatedId,
      code: createCategoryCodeFromName(categoryName),
      name: categoryName,
      type: String(product?.productType || 'Finished Goods').trim(),
      description: `${categoryName} items currently linked from the product catalog.`,
      parentId: '',
      status: 'Active',
      defaultTaxRate: Number.parseFloat(product?.taxRate ?? 0) || 0,
      defaultUnitType: String(product?.uom || '').trim(),
      stockPolicy: ''
    }, normalizedByName.size));
  });

  return Array.from(normalizedByName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function parseWarehouseCapacity(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeWarehouseStatus(status) {
  return String(status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
}

function normalizeWarehouseRecord(record, index) {
  const fallback = DEFAULT_STATE.inventoryWarehouses.find((warehouse) => warehouse.id === record?.id)
    || DEFAULT_STATE.inventoryWarehouses[index]
    || DEFAULT_STATE.inventoryWarehouses[0];

  return {
    id: record?.id || fallback.id,
    name: record?.name || fallback.name,
    location: record?.location || fallback.location,
    capacity: parseWarehouseCapacity(record?.capacity ?? fallback.capacity),
    type: record?.type || fallback.type,
    manager: record?.manager || fallback.manager,
    contact: record?.contact || fallback.contact,
    status: normalizeWarehouseStatus(record?.status ?? fallback.status),
    allowedProductTypes: record?.allowedProductTypes || fallback.allowedProductTypes,
    storageRules: record?.storageRules || fallback.storageRules
  };
}

function normalizeInventoryWarehouses(warehouses) {
  const incoming = Array.isArray(warehouses) ? warehouses : [];
  const normalizedById = new Map();

  incoming.forEach((warehouse, index) => {
    const normalized = normalizeWarehouseRecord(warehouse, index);
    normalizedById.set(warehouse.id, normalized);
  });

  DEFAULT_STATE.inventoryWarehouses.forEach((warehouse, index) => {
    if (!normalizedById.has(warehouse.id)) {
      normalizedById.set(warehouse.id, normalizeWarehouseRecord(warehouse, index));
    }
  });

  return Array.from(normalizedById.values());
}

function hydrateAppState(state) {
  const nextState = state ? { ...state } : { ...DEFAULT_STATE };

  if (!nextState.inventory) nextState.inventory = DEFAULT_STATE.inventory;
  nextState.inventoryCategories = normalizeInventoryCategories(nextState.inventoryCategories, nextState.inventory);
  nextState.inventoryUnits = normalizeInventoryUnits(nextState.inventoryUnits);
  nextState.inventoryWarehouses = normalizeInventoryWarehouses(nextState.inventoryWarehouses);
  if (!nextState.invoices) nextState.invoices = DEFAULT_STATE.invoices;
  if (!nextState.employees) nextState.employees = DEFAULT_STATE.employees;
  if (!nextState.attendance) nextState.attendance = DEFAULT_STATE.attendance;
  if (!nextState.hrmActiveTab) nextState.hrmActiveTab = DEFAULT_STATE.hrmActiveTab;
  if (!nextState.hrmDirectoryFilterStatus) nextState.hrmDirectoryFilterStatus = DEFAULT_STATE.hrmDirectoryFilterStatus;
  if (!nextState.hrmDirectoryFilterDept) nextState.hrmDirectoryFilterDept = DEFAULT_STATE.hrmDirectoryFilterDept;
  if (!nextState.hrmAttendanceDate) nextState.hrmAttendanceDate = DEFAULT_STATE.hrmAttendanceDate;
  if (!nextState.salesUi) nextState.salesUi = DEFAULT_STATE.salesUi;
  if (!nextState.invoiceApprovalsById) nextState.invoiceApprovalsById = DEFAULT_STATE.invoiceApprovalsById;
  if (!nextState.recurringInvoicesById) nextState.recurringInvoicesById = DEFAULT_STATE.recurringInvoicesById;
  if (!nextState.paymentAllocationsById) nextState.paymentAllocationsById = DEFAULT_STATE.paymentAllocationsById;
  if (!nextState.purchases) nextState.purchases = DEFAULT_STATE.purchases;
  if (!nextState.purchasesFilter) nextState.purchasesFilter = 'all';
  if (!nextState.accounting) nextState.accounting = DEFAULT_STATE.accounting;
  if (!nextState.payroll) nextState.payroll = DEFAULT_STATE.payroll;
  if (!nextState.projects) nextState.projects = DEFAULT_STATE.projects;
  if (!nextState.manufacturing) nextState.manufacturing = DEFAULT_STATE.manufacturing;
  ensureCrmState(nextState);

  return nextState;
}

function persistLocalState(state) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

function replaceAppState(nextState) {
  const currentLoggedIn = appState.isLoggedIn;
  const currentSidebar = appState.sidebarCollapsed;
  appState = hydrateAppState(nextState);
  appState.isLoggedIn = currentLoggedIn;
  appState.sidebarCollapsed = currentSidebar;
  persistLocalState(appState);
}

export let appState = hydrateAppState(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || DEFAULT_STATE);
let lastSyncedState = JSON.stringify(appState);
let ignoreRemoteEcho = false;
let remoteListenerStarted = false;

// i18n Helper
if (!appState.lang) {
  appState.lang = 'en'; // default
  saveAppState();
}

window.t = function(key, vars) {
  const lang = appState.lang || 'en';
  let text = (translations[lang] && translations[lang][key])
    || (translations.en && translations.en[key])
    || key;
  if (vars && typeof vars === 'object') {
    Object.keys(vars).forEach((k) => {
      text = String(text).replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    });
  }
  return text;
};

const phraseOriginals = new WeakMap();
const placeholderOriginals = new WeakMap();

function isPhraseSkipElement(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-skip')) return true;
  const tag = el.tagName;
  return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SELECT' || tag === 'OPTION' || tag === 'CODE' || tag === 'PRE';
}

function isInsideSkipped(node) {
  let el = node.nodeType === 1 ? node : node.parentElement;
  while (el) {
    if (isPhraseSkipElement(el)) return true;
    el = el.parentElement;
  }
  return false;
}

function applyPhraseValue(original, lang) {
  if (lang === 'bn' && phrases[original]) return phrases[original];
  return original;
}

window.translateAutoPhrases = function(lang) {
  const activeLang = lang || appState.lang || 'en';
  if (!document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (isInsideSkipped(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const raw = node.nodeValue;
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (!phraseOriginals.has(node)) {
      if (!phrases[trimmed]) return;
      phraseOriginals.set(node, trimmed);
    }

    const original = phraseOriginals.get(node);
    if (!original || !phrases[original]) return;
    node.nodeValue = lead + applyPhraseValue(original, activeLang) + trail;
  });

  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
    if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-skip')) return;
    if (el.closest('[data-i18n-skip]')) return;
    const current = el.getAttribute('placeholder');
    if (!current) return;
    const trimmed = current.trim();
    if (!placeholderOriginals.has(el)) {
      if (!phrases[trimmed]) return;
      placeholderOriginals.set(el, trimmed);
    }
    const original = placeholderOriginals.get(el);
    if (!original || !phrases[original]) return;
    el.placeholder = applyPhraseValue(original, activeLang);
  });
};

window.applyLanguage = function() {
  const lang = appState.lang || 'en';
  document.documentElement.lang = lang;
  document.body.classList.toggle('lang-bn', lang === 'bn');

  if (typeof window.translatePage === 'function') {
    window.translatePage();
  }
  if (typeof window.translateAutoPhrases === 'function') {
    window.translateAutoPhrases(lang);
  }

  const btnEn = document.querySelector('button[onclick="window.toggleLanguage()"] span:first-child');
  const btnBn = document.querySelector('button[onclick="window.toggleLanguage()"] span:last-child');
  if (btnEn && btnBn) {
    if (lang === 'en') {
      btnEn.className = 'text-slate-900';
      btnBn.className = 'text-slate-400';
    } else {
      btnEn.className = 'text-slate-400';
      btnBn.className = 'text-slate-900';
    }
  }

  window.dispatchEvent(new CustomEvent('hookerp:language-changed', { detail: { lang } }));

  // Re-apply after page JS re-renders dynamic labels/enums
  [0, 120, 400, 800].forEach((ms) => {
    setTimeout(() => {
      if (typeof window.translateAutoPhrases === 'function') window.translateAutoPhrases(lang);
    }, ms);
  });
};

export function getInventoryWarehouses() {
  if (!Array.isArray(appState.inventoryWarehouses) || appState.inventoryWarehouses.length === 0) {
    appState.inventoryWarehouses = cloneDefaultWarehouses();
  } else {
    appState.inventoryWarehouses = normalizeInventoryWarehouses(appState.inventoryWarehouses);
  }

  return appState.inventoryWarehouses;
}

export function getInventoryCategories() {
  if (!Array.isArray(appState.inventoryCategories)) {
    appState.inventoryCategories = cloneDefaultInventoryCategories();
  }

  appState.inventoryCategories = normalizeInventoryCategories(appState.inventoryCategories, appState.inventory);
  return appState.inventoryCategories;
}

export function getInventoryUnits() {
  if (!Array.isArray(appState.inventoryUnits) || appState.inventoryUnits.length === 0) {
    appState.inventoryUnits = cloneDefaultInventoryUnits();
  } else {
    appState.inventoryUnits = normalizeInventoryUnits(appState.inventoryUnits);
  }
  return appState.inventoryUnits;
}

export function saveAppState() {
  const serializedState = JSON.stringify(appState);
  persistLocalState(appState);

  if (!remoteListenerStarted || ignoreRemoteEcho || serializedState === lastSyncedState) {
    lastSyncedState = serializedState;
    return;
  }

  lastSyncedState = serializedState;

  // Exclude login and UI session state from remote database sync
  const stateToSend = { ...appState };
  delete stateToSend.isLoggedIn;
  delete stateToSend.sidebarCollapsed;

  saveRemoteAppState(stateToSend).catch((error) => {
    console.warn('Firebase Realtime Database sync failed. Continuing with local state.', error);
  });
}

function startRealtimeStateSync() {
  return new Promise((resolve) => {
    try {
      remoteListenerStarted = true;
      let resolved = false;

      subscribeToRemoteAppState((remoteState) => {
        if (!remoteState) {
          saveRemoteAppState(appState).catch((error) => {
            console.warn('Firebase Realtime Database bootstrap sync failed.', error);
          });
        } else {
          const hydratedRemoteState = hydrateAppState(remoteState);
          const serializedRemoteState = JSON.stringify(hydratedRemoteState);

          if (serializedRemoteState !== lastSyncedState) {
            ignoreRemoteEcho = true;
            replaceAppState(hydratedRemoteState);
            lastSyncedState = serializedRemoteState;
            ignoreRemoteEcho = false;
            window.dispatchEvent(new CustomEvent('hookerp:state-synced'));
          }
        }

        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
    } catch (error) {
      remoteListenerStarted = false;
      console.warn('Firebase Realtime Database is unavailable. Falling back to local state only.', error);
      resolve();
    }
  });
}

export const appReadyPromise = startRealtimeStateSync();

// ----------------------------------------------------
// MODAL TOGGLE UTILITY
// ----------------------------------------------------
window.toggleModal = function(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
};

// ----------------------------------------------------
// SIDEBAR COLLAPSE TOGGLE
// ----------------------------------------------------
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const labels = document.querySelectorAll('.sidebar-label');
  const sidebarToggleButtons = document.querySelectorAll('[data-sidebar-toggle]');

  if (!sidebar) return;

  appState.sidebarCollapsed = !appState.sidebarCollapsed;
  saveAppState();

  if (appState.sidebarCollapsed) {
    sidebar.classList.remove('w-64', 'w-72');
    sidebar.classList.add('w-20');
    sidebar.classList.add('sidebar-is-collapsed');
    labels.forEach(l => l.classList.add('hidden'));
  } else {
    sidebar.classList.remove('w-20');
    sidebar.classList.remove('sidebar-is-collapsed');
    sidebar.classList.add(sidebar.classList.contains('bg-slate-950') ? 'w-72' : 'w-64');
    setTimeout(() => {
      if (!appState.sidebarCollapsed) {
        labels.forEach(l => l.classList.remove('hidden'));
      }
    }, 150);
  }

  sidebarToggleButtons.forEach((button) => {
    button.setAttribute('aria-label', appState.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  });

  initIcons();

  if (typeof window.drawSalesTrend === 'function') {
    setTimeout(() => window.drawSalesTrend(), 305);
  }
};

// ----------------------------------------------------
// LOGOUT
// ----------------------------------------------------
window.handleLogout = function() {
  appState.isLoggedIn = false;
  saveAppState();
  window.location.href = '/index.html';
};

window.handleSandboxLogin = function(event) {
  event.preventDefault();
  appState.isLoggedIn = true;
  saveAppState();
  window.location.href = '/dashboard.html';
};

// ----------------------------------------------------
// AUTH GUARD & SIDEBAR ACTIVE STATE
// ----------------------------------------------------
function highlightActiveSidebar() {
  const path = window.location.pathname;
    const routeToBtnMap = {
    '/dashboard.html': 'side-dashboard',
    '/crm-leads.html': 'side-crm',
    '/crm-deals.html': 'side-crm',
    '/crm-customers.html': 'side-crm',
    '/crm-activities.html': 'side-crm',
    '/sales-quotations.html': 'side-sales',
    '/sales-orders.html': 'side-sales',
    '/sales-deliveries.html': 'side-sales',
    '/sales-invoices.html': 'side-sales',
    '/sales-payments.html': 'side-sales',
    '/sales-returns.html': 'side-sales',
    '/inventory-products.html': 'side-inventory',
    '/inventory-categories.html': 'side-inventory',
    '/inventory-warehouses.html': 'side-inventory',
    '/inventory-stock-in.html': 'side-inventory',
    '/inventory-stock-out.html': 'side-inventory',
    '/inventory-transfers.html': 'side-inventory',
    '/inventory-adjustments.html': 'side-inventory',
    '/purchases-suppliers.html': 'side-purchases',
    '/purchases-orders.html': 'side-purchases',
    '/purchases-goods-received.html': 'side-purchases',
    '/purchases-bills.html': 'side-purchases',
    '/purchases-payments.html': 'side-purchases',
    '/purchases-returns.html': 'side-purchases',
    '/accounting-receivables.html': 'side-accounting',
    '/accounting-payables.html': 'side-accounting',
    '/accounting-journals.html': 'side-accounting',
    '/accounting-ledger.html': 'side-accounting',
    '/accounting-trial.html': 'side-accounting',
    '/accounting-pl.html': 'side-accounting',
    '/accounting-balance.html': 'side-accounting',
    '/hrm-employees.html': 'side-hrm',
    '/hrm-departments.html': 'side-hrm',
    '/hrm-designations.html': 'side-hrm',
    '/hrm-attendance.html': 'side-hrm',
    '/hrm-leave.html': 'side-hrm',
    '/payroll-structures.html': 'side-payroll',
    '/payroll-runs.html': 'side-payroll',
    '/payroll-slips.html': 'side-payroll',
    '/projects.html': 'side-projects',
    '/manufacturing.html': 'side-manufacturing',
    '/reports-sales.html': 'side-reports',
    '/reports-purchases.html': 'side-reports',
    '/reports-inventory.html': 'side-reports',
    '/reports-customers.html': 'side-reports',
    '/reports-suppliers.html': 'side-reports',
    '/reports-financial.html': 'side-reports',
    '/reports-hr.html': 'side-reports',
    '/settings-users.html': 'side-settings',
    '/settings-roles.html': 'side-settings',
    '/settings-permissions.html': 'side-settings',
    '/settings-company.html': 'side-settings'
  };

  // We no longer manually add bg-blue-600 here because layout.js handles the beautiful dynamic light highlighting per module.
}

function restoreSidebarState() {
  if (appState.sidebarCollapsed) {
    const sidebar = document.getElementById('sidebar');
    const labels = document.querySelectorAll('.sidebar-label');
    if (sidebar) {
      sidebar.classList.remove('w-64', 'w-72');
      sidebar.classList.add('w-20');
      sidebar.classList.add('sidebar-is-collapsed');
      labels.forEach(l => l.classList.add('hidden'));
      document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
        button.setAttribute('aria-label', 'Expand sidebar');
      });
    }
  }
}
// ----------------------------------------------------
// CRM ADVANCED FIELDS TOGGLE
// ----------------------------------------------------
window.toggleAdvancedCrmFields = function(type) {
  const section = document.getElementById(`crm-${type}-advanced-section`);
  const icon = document.getElementById(`crm-${type}-advanced-icon`);
  if (!section) return;
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

// ----------------------------------------------------
// BOOTSTRAP — runs on every page
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  appReadyPromise
    .catch(() => {
      // The app already falls back to local state, so the UI can continue booting.
    })
    .finally(() => {
      setTimeout(() => {
        if (typeof window.translateAutoPhrases === 'function') {
          window.translateAutoPhrases(appState.lang || 'en');
        }
      }, 50);
    });
  const currentPage = window.location.pathname;
  const isLoginPage = currentPage === '/' || currentPage === '/index.html' || currentPage === '';

  if (isLoginPage && appState.isLoggedIn) {
    window.location.href = '/dashboard.html';
    return;
  }

  // Auth guard: redirect to login if not authenticated (skip for login page itself)
  if (!isLoginPage && !appState.isLoggedIn) {
    window.location.href = '/index.html';
    return;
  }

  // Apply saved language on every page boot
  setTimeout(() => {
    if (typeof window.applyLanguage === 'function') {
      window.applyLanguage();
    }
  }, 80);

  // For non-login pages, set up sidebar
  if (!isLoginPage) {
    // Use event delegation for sidebar actions since they are loaded dynamically
    document.addEventListener('click', (e) => {
      if (e.target.closest('#logout-action')) {
        window.handleLogout();
      }
      if (e.target.closest('[data-sidebar-toggle]')) {
        window.toggleSidebar();
      }
    });

    // Highlight active sidebar item and restore collapsed state
    setTimeout(() => {
      highlightActiveSidebar();
      restoreSidebarState();
      initIcons();
    }, 50);
  }
});

// Expose globally for layout scripts
window.appState = appState;
window.saveAppState = saveAppState;


window.toggleLanguage = function() {
  const current = appState.lang || 'en';
  appState.lang = current === 'en' ? 'bn' : 'en';
  saveAppState();
  if (typeof window.applyLanguage === 'function') {
    window.applyLanguage();
  }
};
