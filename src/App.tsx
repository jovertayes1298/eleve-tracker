import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Globe,
  GripVertical,
  Layers,
  LayoutGrid,
  Menu,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Ruler,
  Search,
  Send,
  Shirt,
  ShoppingBag,
  Table as TableIcon,
  Trash2,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES & CATALOG
// ============================================================================

type ProductionStage =
  | 'New Order'
  | 'Blank Sourcing'
  | 'Design & Mockup'
  | 'Printing'
  | 'Quality Check'
  | 'Ready to Ship';

const PRODUCTION_STAGES: ProductionStage[] = [
  'New Order',
  'Blank Sourcing',
  'Design & Mockup',
  'Printing',
  'Quality Check',
  'Ready to Ship',
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
type StandardSize = (typeof STANDARD_SIZES)[number];

interface SizeBreakdown {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
}

interface CustomMeasurements {
  unit: 'in' | 'cm';
  bust: string;
  waist: string;
  hip: string;
  inseam: string;
  length: string;
  notes: string;
  updatedAt: string;
}

interface OrderUpdateEntry {
  id: string;
  message: string;
  stage: ProductionStage;
  timestamp: string;
}

interface Order {
  id: string;
  customerName: string;
  destination: string;
  isInternational: boolean;
  itemName: string;
  variant: string;
  swatchHex: string;
  isCustom: boolean;
  sizeBreakdown: SizeBreakdown;
  quantity: number;
  totalPricePhp: number;
  dueDate: string;
  stage: ProductionStage;
  notes: string;
  createdAt: string;
  completedAt?: string;
  measurements?: CustomMeasurements;
  updates: OrderUpdateEntry[];
}

type MaterialCategory = 'Blank Tees' | 'Print & Ink' | 'Labels & Packaging';

interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  stock: number;
  minThreshold: number;
  supplier: string;
  lastUpdated: string;
}

interface ChatMessage {
  id: string;
  sender: 'owner' | 'customer';
  text: string;
  timestamp: string;
}

interface ChatThread {
  id: string;
  customerName: string;
  location: string;
  productContext?: string;
  linkedOrderId?: string;
  unread: boolean;
  messages: ChatMessage[];
}

interface ProductColorOption {
  name: string;
  hex: string;
}

interface StoreProduct {
  id: string;
  name: string;
  subtitle: string;
  pricePhp: number;
  gsm: string;
  fit: string;
  image: string;
  description: string;
  colors: ProductColorOption[];
}

interface CartItem {
  key: string;
  productId: string;
  productName: string;
  colorName: string;
  swatchHex: string;
  size: StandardSize;
  quantity: number;
  unitPricePhp: number;
}

type AppSurface = 'storefront' | 'tracker';
type TrackerTab = 'orders' | 'messages' | 'inventory' | 'measurements';
type OrdersViewMode = 'kanban' | 'table';

const ELEVE_LOGO_SRC = '/assets/aistudio/instappa-post-DV08ZM_j44l_65b01847.webp';

const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'tee-v1-keffiyeh',
    name: 'Elevé V1 — Keffiyeh Heavyweight Tee',
    subtitle: 'Drop 01 · Signature Graphic',
    pricePhp: 1290,
    gsm: '280 GSM',
    fit: 'Boxy Cropped Fit',
    image: '/assets/aistudio/instappa-post-DfgHCkKj1eA-1_c83688f2.webp',
    description:
      'Cut from heavyweight 280GSM combed cotton featuring our glowing Elevé chest mark and high-contrast monochrome portrait print. Printed to order in our Manila studio.',
    colors: [
      { name: 'Pitch Black', hex: '#09090B' },
      { name: 'Washed Charcoal', hex: '#3F3F46' },
      { name: 'Optic White', hex: '#FFFFFF' },
    ],
  },
  {
    id: 'tee-v1-lumen',
    name: 'Elevé V1 — Lumen Skeleton Tee',
    subtitle: 'Drop 01 · Heavy Knit',
    pricePhp: 1390,
    gsm: '300 GSM',
    fit: 'Boxy Drop-Shoulder',
    image: '/assets/aistudio/instappa-post-DW1a4NvD37u-1_616e3e00.webp',
    description:
      'Structured 300GSM boxy drop-shoulder tee finished with the Elevé chest mark, woven neck tag, and luminous sternum skeleton artwork.',
    colors: [
      { name: 'Pitch Black', hex: '#09090B' },
      { name: 'Obsidian Fade', hex: '#18181B' },
      { name: 'Bone', hex: '#E7E5E4' },
    ],
  },
  {
    id: 'tee-collection-ascension',
    name: 'Elevé Collection — Ascension Tee',
    subtitle: 'Drop 01 · Studio Graphic',
    pricePhp: 1490,
    gsm: '300 GSM',
    fit: 'Oversized Street Fit',
    image: '/assets/aistudio/instappa-post-DV1IXFAjxQE_25a5fdcf.webp',
    description:
      'Oversized 300GSM jersey spotlighting the ELEVÉ COLLECTION light-beam typography and wireframe ascension print. Ships locally and worldwide.',
    colors: [
      { name: 'Pitch Black', hex: '#09090B' },
      { name: 'Slate Charcoal', hex: '#334155' },
      { name: 'Ash Heather', hex: '#A1A1AA' },
    ],
  },
  {
    id: 'tee-collection-ash',
    name: 'Elevé Collection — Essential Ash Tee',
    subtitle: 'Drop 01 · Washed Essential',
    pricePhp: 1190,
    gsm: '260 GSM',
    fit: 'Relaxed Box Cut',
    image: '/assets/aistudio/instappa-post-DWXwXhtj9LH-1_51fdc037.webp',
    description:
      'Enzyme-washed 260GSM ash jersey tailored for humid Manila days and clean everyday layering, finished with minimal Elevé Collection chest typography and woven hem label.',
    colors: [
      { name: 'Ash Grey', hex: '#D4D4D8' },
      { name: 'Pitch Black', hex: '#09090B' },
      { name: 'Optic White', hex: '#FFFFFF' },
    ],
  },
];

const LOCAL_CUSTOMER_KEYS = {
  CART: 'eleve_shopper_cart_v1',
  MY_ORDERS: 'eleve_shopper_order_ids_v1',
  CHAT_ID: 'eleve_shopper_chat_id_v1',
  PROFILE: 'eleve_shopper_profile_v1',
};

// ============================================================================
// FORMAT & DATE HELPERS
// ============================================================================

function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

function addDaysISO(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function formatShortDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return isoTimestamp;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatChatTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return isoTimestamp;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getDueStatus(dueDate: string, stage: ProductionStage): 'overdue' | 'soon' | 'normal' {
  if (stage === 'Ready to Ship') return 'normal';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 'normal';
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

function isWithinLast7Days(isoTimestamp?: string): boolean {
  if (!isoTimestamp) return false;
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function formatSizeSummary(order: Order): string {
  if (order.isCustom) return 'Custom Fit';
  const parts = STANDARD_SIZES.filter((sz) => order.sizeBreakdown[sz] > 0).map(
    (sz) => `${sz}: ${order.sizeBreakdown[sz]}`
  );
  return parts.length > 0 ? parts.join(' · ') : `${order.quantity} pcs`;
}

function emptySizeBreakdown(): SizeBreakdown {
  return { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
}

function sumSizes(sb: SizeBreakdown): number {
  return sb.XS + sb.S + sb.M + sb.L + sb.XL;
}

function getStageTextTone(stage: ProductionStage): string {
  switch (stage) {
    case 'Blank Sourcing':
      return 'text-amber-700';
    case 'Ready to Ship':
      return 'text-emerald-700';
    default:
      return 'text-zinc-900';
  }
}

function getStageDotClass(stage: ProductionStage): string {
  switch (stage) {
    case 'New Order':
      return 'bg-zinc-300';
    case 'Blank Sourcing':
      return 'bg-amber-500';
    case 'Design & Mockup':
      return 'bg-zinc-500';
    case 'Printing':
      return 'bg-zinc-800';
    case 'Quality Check':
      return 'bg-zinc-950';
    case 'Ready to Ship':
      return 'bg-emerald-600';
  }
}

// ============================================================================
// BRAND LOGO & PRODUCT PHOTOGRAPHY COMPONENTS
// ============================================================================

function BrandLogoMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false);
  const boxClass = size === 'sm' ? 'h-7 w-[74px] rounded-md' : 'h-9 w-24 rounded-lg';

  return (
    <span
      className={`${boxClass} bg-[#262626] inline-flex items-center justify-center overflow-hidden shrink-0 border border-zinc-800`}
    >
      {failed ? (
        <span className="font-display text-sm font-bold tracking-tight text-white">Elevé</span>
      ) : (
        <img
          src={ELEVE_LOGO_SRC}
          alt="Elevé logo"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-center"
        />
      )}
    </span>
  );
}

function ProductGarmentImage({
  src,
  alt,
  aspectClass = 'aspect-square',
  className = '',
}: {
  src: string;
  alt: string;
  aspectClass?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full ${aspectClass} bg-zinc-100 overflow-hidden select-none flex items-center justify-center ${className}`}
    >
      {failed ? (
        <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 p-6 text-center">
          <Shirt className="w-8 h-8" />
          <span className="text-xs font-medium text-zinc-500">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function App() {
  // Server-authoritative synced state
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loadingState, setLoadingState] = useState(true);

  // Surface Switch: Public Storefront vs Owner Tracker
  const [surface, setSurface] = useState<AppSurface>('storefront');
  const [trackerTab, setTrackerTab] = useState<TrackerTab>('orders');
  const [viewMode, setViewMode] = useState<OrdersViewMode>('kanban');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Storefront State
  const [selectedColors, setSelectedColors] = useState<Record<string, ProductColorOption>>(() => {
    const map: Record<string, ProductColorOption> = {};
    for (const p of STORE_PRODUCTS) map[p.id] = p.colors[0];
    return map;
  });
  const [selectedSizes, setSelectedSizes] = useState<Record<string, StandardSize>>(() => {
    const map: Record<string, StandardSize> = {};
    for (const p of STORE_PRODUCTS) map[p.id] = 'M';
    return map;
  });
  const [activeProductModal, setActiveProductModal] = useState<StoreProduct | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CUSTOMER_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CUSTOMER_KEYS.MY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return ['ELV-101'];
  });
  const [trackOrderInput, setTrackOrderInput] = useState('ELV-101');
  const [lastPlacedOrders, setLastPlacedOrders] = useState<Order[]>([]);

  // Checkout Form
  const [checkoutName, setCheckoutName] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CUSTOMER_KEYS.PROFILE);
      if (saved) return JSON.parse(saved).name || '';
    } catch {
      // Ignore
    }
    return '';
  });
  const [checkoutDestination, setCheckoutDestination] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CUSTOMER_KEYS.PROFILE);
      if (saved) return JSON.parse(saved).location || 'Makati, PH';
    } catch {
      // Ignore
    }
    return 'Makati, PH';
  });
  const [checkoutIntl, setCheckoutIntl] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Storefront Customer Chat Drawer
  const [customerChatOpen, setCustomerChatOpen] = useState(false);
  const [customerChatId, setCustomerChatId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_CUSTOMER_KEYS.CHAT_ID);
    } catch {
      return null;
    }
  });
  const [customerChatProductContext, setCustomerChatProductContext] = useState<string | undefined>(
    undefined
  );
  const [customerDraft, setCustomerDraft] = useState('');
  const [shopperNameInput, setShopperNameInput] = useState(checkoutName);
  const [shopperLocationInput, setShopperLocationInput] = useState(checkoutDestination);

  // Owner Tracker Filters & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | ProductionStage>('ALL');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'PH' | 'INTL'>('ALL');
  const [materialSearch, setMaterialSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [chatSearch, setChatSearch] = useState('');
  const [selectedOwnerChatId, setSelectedOwnerChatId] = useState<string>('');
  const [mobileShowOwnerThread, setMobileShowOwnerThread] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState('');

  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProductionStage | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [measurementOrderId, setMeasurementOrderId] = useState<string | null>(null);
  const [liveUpdateOrder, setLiveUpdateOrder] = useState<Order | null>(null);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const trackSectionRef = useRef<HTMLElement | null>(null);
  const collectionSectionRef = useRef<HTMLElement | null>(null);

  // Persist local shopper session
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CUSTOMER_KEYS.CART, JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CUSTOMER_KEYS.MY_ORDERS, JSON.stringify(myOrderIds));
    } catch {
      // Ignore
    }
  }, [myOrderIds]);

  useEffect(() => {
    try {
      if (customerChatId) localStorage.setItem(LOCAL_CUSTOMER_KEYS.CHAT_ID, customerChatId);
    } catch {
      // Ignore
    }
  }, [customerChatId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_CUSTOMER_KEYS.PROFILE,
        JSON.stringify({ name: checkoutName, location: checkoutDestination })
      );
    } catch {
      // Ignore
    }
  }, [checkoutName, checkoutDestination]);

  // Real-time Server Synchronization via WebSocket + Initial HTTP Fetch
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let unmounted = false;

    const applySync = (payload: {
      orders: Order[];
      materials: MaterialItem[];
      chats: ChatThread[];
    }) => {
      setOrders(payload.orders);
      setMaterials(payload.materials);
      setChats(payload.chats);
      setLoadingState(false);
    };

    const loadInitial = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok && !unmounted) {
          const data = await res.json();
          applySync(data);
        }
      } catch {
        setLoadingState(false);
      }
    };

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state:sync' && msg.payload) {
            applySync(msg.payload);
          }
        } catch {
          // Ignore malformed message
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          reconnectTimer = window.setTimeout(connectWs, 2000);
        }
      };
    };

    loadInitial();
    connectWs();

    return () => {
      unmounted = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Keep selectedOwnerChatId initialized when chats load
  useEffect(() => {
    if (!selectedOwnerChatId && chats.length > 0) {
      setSelectedOwnerChatId(chats[0].id);
    }
  }, [chats, selectedOwnerChatId]);

  // ============================================================================
  // DERIVED METRICS & FILTERS
  // ============================================================================

  const lowStockMaterials = useMemo(
    () => materials.filter((m) => m.stock <= m.minThreshold),
    [materials]
  );

  const unreadChatsCount = useMemo(() => chats.filter((c) => c.unread).length, [chats]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotalPhp = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPricePhp * item.quantity, 0),
    [cart]
  );

  const trackedOrder = useMemo(() => {
    const q = trackOrderInput.trim().toUpperCase();
    if (!q) return null;
    return orders.find((o) => o.id.toUpperCase() === q) ?? null;
  }, [orders, trackOrderInput]);

  const activeCustomerThread = useMemo(
    () => chats.find((c) => c.id === customerChatId) ?? null,
    [chats, customerChatId]
  );

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.stage !== 'Ready to Ship');
    const activeUnits = activeOrders.reduce((sum, o) => sum + o.quantity, 0);

    const inProductionOrders = orders.filter(
      (o) =>
        o.stage === 'Design & Mockup' ||
        o.stage === 'Printing' ||
        o.stage === 'Quality Check'
    );
    const inProductionUnits = inProductionOrders.reduce((sum, o) => sum + o.quantity, 0);

    const blankSourcingOrders = orders.filter((o) => o.stage === 'Blank Sourcing');
    const pendingBlanksTotal = blankSourcingOrders.length + lowStockMaterials.length;

    const completedThisWeek = orders.filter(
      (o) => o.stage === 'Ready to Ship' && isWithinLast7Days(o.completedAt)
    );
    const completedUnits = completedThisWeek.reduce((sum, o) => sum + o.quantity, 0);

    return {
      totalActiveCount: activeOrders.length,
      activeUnits,
      intlActiveCount: activeOrders.filter((o) => o.isInternational).length,
      phActiveCount: activeOrders.filter((o) => !o.isInternational).length,
      inProductionCount: inProductionOrders.length,
      inProductionUnits,
      pendingBlanksTotal,
      blankSourcingCount: blankSourcingOrders.length,
      lowStockCount: lowStockMaterials.length,
      completedThisWeekCount: completedThisWeek.length,
      completedUnits,
    };
  }, [orders, lowStockMaterials]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (stageFilter !== 'ALL' && order.stage !== stageFilter) return false;
      if (regionFilter === 'PH' && order.isInternational) return false;
      if (regionFilter === 'INTL' && !order.isInternational) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.destination.toLowerCase().includes(q) ||
        order.itemName.toLowerCase().includes(q) ||
        order.variant.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, stageFilter, regionFilter]);

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    return materials.filter((item) => {
      if (lowStockOnly && item.stock > item.minThreshold) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q)
      );
    });
  }, [materials, materialSearch, lowStockOnly]);

  const filteredOwnerChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    return chats.filter((t) => {
      if (!q) return true;
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        (t.productContext && t.productContext.toLowerCase().includes(q)) ||
        (t.linkedOrderId && t.linkedOrderId.toLowerCase().includes(q))
      );
    });
  }, [chats, chatSearch]);

  const activeOwnerChat = useMemo(
    () => chats.find((c) => c.id === selectedOwnerChatId) ?? filteredOwnerChats[0] ?? null,
    [chats, selectedOwnerChatId, filteredOwnerChats]
  );

  const customMeasurementOrders = useMemo(
    () => orders.filter((o) => o.isCustom || Boolean(o.measurements)),
    [orders]
  );

  const activeMeasurementOrder = useMemo(
    () => orders.find((o) => o.id === measurementOrderId) ?? null,
    [orders, measurementOrderId]
  );

  // ============================================================================
  // STOREFRONT HANDLERS
  // ============================================================================

  const handleAddToBag = (product: StoreProduct, color?: ProductColorOption, size?: StandardSize) => {
    const chosenColor = color ?? selectedColors[product.id] ?? product.colors[0];
    const chosenSize = size ?? selectedSizes[product.id] ?? 'M';
    const key = `${product.id}__${chosenColor.name}__${chosenSize}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          productName: product.name,
          colorName: chosenColor.name,
          swatchHex: chosenColor.hex,
          size: chosenSize,
          quantity: 1,
          unitPricePhp: product.pricePhp,
        },
      ];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !checkoutName.trim() || placingOrder) return;
    setPlacingOrder(true);

    try {
      // Group cart items by Product + Colorway so each tee batch records cleanly on the Tracker
      const groups = new Map<
        string,
        {
          productName: string;
          colorName: string;
          swatchHex: string;
          sizeBreakdown: SizeBreakdown;
          quantity: number;
          totalPricePhp: number;
        }
      >();

      for (const item of cart) {
        const gKey = `${item.productName}__${item.colorName}`;
        const existing = groups.get(gKey) ?? {
          productName: item.productName,
          colorName: item.colorName,
          swatchHex: item.swatchHex,
          sizeBreakdown: emptySizeBreakdown(),
          quantity: 0,
          totalPricePhp: 0,
        };
        existing.sizeBreakdown[item.size] += item.quantity;
        existing.quantity += item.quantity;
        existing.totalPricePhp += item.unitPricePhp * item.quantity;
        groups.set(gKey, existing);
      }

      const createdOrders: Order[] = [];
      for (const group of groups.values()) {
        const resp = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: checkoutName.trim(),
            destination: checkoutDestination.trim() || (checkoutIntl ? 'International' : 'Philippines'),
            isInternational: checkoutIntl,
            itemName: group.productName,
            variant: group.colorName,
            swatchHex: group.swatchHex,
            isCustom: false,
            sizeBreakdown: group.sizeBreakdown,
            quantity: group.quantity,
            totalPricePhp: group.totalPricePhp,
            stage: 'New Order',
            notes: checkoutNotes.trim() || 'Placed via Eleve Storefront.',
            updateMessage: `Order placed on Eleve Storefront (${group.quantity} pcs · ${group.colorName}).`,
          }),
        });
        if (resp.ok) {
          const created = (await resp.json()) as Order;
          createdOrders.push(created);
        }
      }

      if (createdOrders.length > 0) {
        const newIds = createdOrders.map((o) => o.id);
        setMyOrderIds((prev) => Array.from(new Set([...newIds, ...prev])));
        setTrackOrderInput(createdOrders[0].id);
        setLastPlacedOrders(createdOrders);
        setCart([]);
        setCheckoutNotes('');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleAskAboutProduct = (product: StoreProduct) => {
    const chosenColor = selectedColors[product.id] ?? product.colors[0];
    const contextStr = `${product.name} (${chosenColor.name})`;
    setCustomerChatProductContext(contextStr);
    setCustomerDraft(`Hi! I have a question about the ${contextStr}: `);
    setActiveProductModal(null);
    setCustomerChatOpen(true);
  };

  const handleSendCustomerChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = customerDraft.trim();
    if (!text) return;

    const name = (shopperNameInput || checkoutName || 'Storefront Guest').trim();
    const location = (shopperLocationInput || checkoutDestination || 'Philippines').trim();

    if (!activeCustomerThread) {
      const resp = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          location,
          productContext: customerChatProductContext,
          linkedOrderId: myOrderIds[0],
          initialMessage: text,
          sender: 'customer',
        }),
      });
      if (resp.ok) {
        const created = (await resp.json()) as ChatThread;
        setCustomerChatId(created.id);
        setCheckoutName(name);
        setCheckoutDestination(location);
        setCustomerDraft('');
      }
    } else {
      const resp = await fetch(`/api/chats/${activeCustomerThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text,
          productContext: customerChatProductContext,
        }),
      });
      if (resp.ok) {
        setCustomerDraft('');
      }
    }
  };

  // ============================================================================
  // OWNER TRACKER HANDLERS (SERVER-AUTHORITATIVE)
  // ============================================================================

  const handleStageChange = async (orderId: string, nextStage: ProductionStage) => {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage }),
    });
  };

  const handleSendLiveOrderUpdate = async (orderId: string, stage: ProductionStage, message: string) => {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, liveUpdateMessage: message }),
    });
    setLiveUpdateOrder(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
  };

  const handleSaveOrder = async (
    payload: Omit<Order, 'id' | 'createdAt' | 'completedAt' | 'updates'>,
    existingId?: string
  ) => {
    if (existingId) {
      await fetch(`/api/orders/${encodeURIComponent(existingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setOrderModalOpen(false);
    setEditingOrder(null);
  };

  const handleSaveMeasurements = async (orderId: string, specs: CustomMeasurements) => {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCustom: true, measurements: specs }),
    });
    setMeasurementOrderId(null);
  };

  const handleClearMeasurements = async (orderId: string) => {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearMeasurements: true }),
    });
    setMeasurementOrderId(null);
  };

  const handleAdjustStock = async (materialId: string, delta: number) => {
    await fetch(`/api/materials/${encodeURIComponent(materialId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
  };

  const handleSaveMaterial = async (
    payload: Omit<MaterialItem, 'id' | 'lastUpdated'>,
    existingId?: string
  ) => {
    if (existingId) {
      await fetch(`/api/materials/${encodeURIComponent(existingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setMaterialModalOpen(false);
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    await fetch(`/api/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' });
  };

  const handleOpenCustomerChatInTracker = async (order: Order) => {
    const existing = chats.find(
      (c) =>
        c.linkedOrderId === order.id ||
        c.customerName.toLowerCase() === order.customerName.toLowerCase()
    );
    if (existing) {
      setSelectedOwnerChatId(existing.id);
      if (existing.unread) {
        await fetch(`/api/chats/${encodeURIComponent(existing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unread: false }),
        });
      }
    } else {
      const resp = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.customerName,
          location: order.destination,
          productContext: `${order.itemName} (${order.variant})`,
          linkedOrderId: order.id,
          initialMessage: `Hi ${order.customerName}! Reaching out regarding your order ${order.id} (${order.itemName} · ${order.variant}). Currently at: ${order.stage}.`,
          sender: 'owner',
        }),
      });
      if (resp.ok) {
        const created = (await resp.json()) as ChatThread;
        setSelectedOwnerChatId(created.id);
      }
    }
    setTrackerTab('messages');
    setMobileShowOwnerThread(true);
  };

  const handleSelectOwnerChat = async (chat: ChatThread) => {
    setSelectedOwnerChatId(chat.id);
    setMobileShowOwnerThread(true);
    if (chat.unread) {
      await fetch(`/api/chats/${encodeURIComponent(chat.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread: false }),
      });
    }
  };

  const handleOwnerSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOwnerChat || !ownerDraft.trim()) return;
    const text = ownerDraft.trim();
    setOwnerDraft('');
    await fetch(`/api/chats/${encodeURIComponent(activeOwnerChat.id)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'owner', text }),
    });
  };

  const handleResetDemoData = async () => {
    await fetch('/api/reset', { method: 'POST' });
    setConfirmResetOpen(false);
  };

  // Drag & Drop Handlers
  const onDragStartOrder = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverStage = (e: React.DragEvent, stage: ProductionStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const onDropStage = (e: React.DragEvent, targetStage: ProductionStage) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (droppedId) handleStageChange(droppedId, targetStage);
    setDraggedOrderId(null);
    setDragOverStage(null);
  };

  const onDragEndOrder = () => {
    setDraggedOrderId(null);
    setDragOverStage(null);
  };

  // ============================================================================
  // RENDER: PUBLIC STOREFRONT MODE
  // ============================================================================

  if (surface === 'storefront') {
    return (
      <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
        {/* Clean 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center shrink-0 focus:outline-none"
            aria-label="Elevé Home"
          >
            <BrandLogoMark />
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <button
              type="button"
              onClick={() => collectionSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Collection
            </button>
            <button
              type="button"
              onClick={() => trackSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => setCustomerChatOpen(true)}
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Ask Studio
            </button>
            <button
              type="button"
              onClick={() => setSurface('tracker')}
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Owner Tracker
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSurface('tracker')}
              className="md:hidden px-3 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0"
            >
              Owner Tracker
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bag</span>
              <span className="font-mono tabular-nums">({cartCount})</span>
            </button>
          </div>
        </header>

        {/* Minimalist Storefront Hero */}
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                <span>Manila, Philippines</span>
                <span aria-hidden="true">·</span>
                <span>Domestic & Worldwide Shipping</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 text-balance leading-[1.08]">
                Heavyweight blank tees, printed to order.
              </h1>
              <p className="text-base text-zinc-600 max-w-xl leading-relaxed">
                Every Eleve piece starts with 260–300GSM combed cotton blanks and is printed in
                small batches in our Manila studio. Order online and follow your shirt from blank
                sourcing to dispatch in real time.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    collectionSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="px-5 py-3 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Shop Drop 01
                </button>
                <button
                  type="button"
                  onClick={() => trackSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-3 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Track Live Order
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerChatOpen(true)}
                  className="px-4 py-3 text-sm font-medium text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask Studio</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <BrandLogoMark size="sm" />
                <span>Manila Studio</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div>
                  <div className="text-xs text-zinc-500">Drop 01</div>
                  <div className="font-mono text-2xl font-semibold text-zinc-950 mt-0.5">
                    04 Styles
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">In Production</div>
                  <div className="font-mono text-2xl font-semibold text-zinc-950 mt-0.5">
                    {metrics.totalActiveCount} Orders
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 border-t border-zinc-100 pt-3">
                Printed in small batches from 260–300GSM blanks. Checkout syncs directly to our
                real-time Manila production tracker.
              </p>
            </div>
          </div>
        </section>

        {/* 4-Product Collection Grid */}
        <section
          ref={collectionSectionRef}
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-14 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                Drop 01 Collection
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Four signature Elevé silhouettes. Select your colorway and size below.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500">
              {STORE_PRODUCTS.length} items available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STORE_PRODUCTS.map((product) => {
              const chosenColor = selectedColors[product.id] ?? product.colors[0];
              const chosenSize = selectedSizes[product.id] ?? 'M';

              return (
                <article
                  key={product.id}
                  className="group bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveProductModal(product)}
                      className="w-full text-left block focus:outline-none border-b border-zinc-200"
                      aria-label={`Inspect ${product.name}`}
                    >
                      <ProductGarmentImage
                        src={product.image}
                        alt={`${product.name} in ${chosenColor.name}`}
                      />
                    </button>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {product.gsm} · {product.fit}
                        </div>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveProductModal(product)}
                            className="font-display text-base font-semibold text-zinc-950 text-left hover:underline leading-snug"
                          >
                            {product.name}
                          </button>
                          <span className="font-mono text-sm font-semibold text-zinc-950 tabular-nums shrink-0">
                            {formatPhp(product.pricePhp)}
                          </span>
                        </div>
                      </div>

                      {/* Color Swatch Selector */}
                      <div className="space-y-1.5">
                        <div className="text-xs text-zinc-500">
                          Color: <span className="text-zinc-900 font-medium">{chosenColor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {product.colors.map((c) => {
                            const active = chosenColor.name === c.name;
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() =>
                                  setSelectedColors((prev) => ({ ...prev, [product.id]: c }))
                                }
                                title={c.name}
                                aria-label={`Select ${c.name} for ${product.name}`}
                                className={`w-6 h-6 rounded-md border transition-transform ${
                                  active
                                    ? 'border-zinc-950 scale-110 ring-2 ring-zinc-950/20'
                                    : 'border-zinc-300 hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Size Selector */}
                      <div className="grid grid-cols-5 gap-1">
                        {STANDARD_SIZES.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() =>
                              setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }))
                            }
                            className={`h-8 text-xs font-mono rounded-md border transition-colors ${
                              chosenSize === sz
                                ? 'bg-zinc-950 text-white border-zinc-950 font-semibold'
                                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToBag(product)}
                      className="flex-1 h-10 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Add to Bag
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskAboutProduct(product)}
                      className="h-10 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                      title="Ask about this shirt"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Real-Time Order Tracker Section */}
        <section
          ref={trackSectionRef}
          className="border-t border-zinc-200 bg-zinc-50 py-14"
          aria-label="Live customer order tracker"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                  Real-Time Order Tracker
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Enter your Order ID to watch live studio updates as your blanks are sourced,
                  printed, and packed.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={trackOrderInput}
                    onChange={(e) => setTrackOrderInput(e.target.value)}
                    placeholder="Order ID (e.g. ELV-101)"
                    className="w-full h-10 pl-9 pr-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Quick-pick from Customer's Recent Orders */}
            {myOrderIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500">Recent orders:</span>
                {myOrderIds.slice(0, 5).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTrackOrderInput(id)}
                    className={`px-2.5 py-1 font-mono rounded-md border transition-colors ${
                      trackOrderInput.toUpperCase() === id.toUpperCase()
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            )}

            {loadingState ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-8 text-sm text-zinc-500">
                Connecting to Manila studio live tracker...
              </div>
            ) : trackedOrder ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                  <div>
                    <div className="font-mono text-xs text-zinc-500">
                      {trackedOrder.id} · {trackedOrder.customerName} · {trackedOrder.destination}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-zinc-950 mt-0.5 flex items-center gap-2">
                      <span>{trackedOrder.itemName}</span>
                      <span className="text-zinc-400 font-normal">·</span>
                      <span className="text-sm font-normal text-zinc-600">
                        {trackedOrder.variant} ({trackedOrder.quantity} pcs)
                      </span>
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-zinc-500">Current Stage</div>
                    <div
                      className={`font-display text-sm font-semibold ${getStageTextTone(
                        trackedOrder.stage
                      )}`}
                    >
                      {trackedOrder.stage}
                    </div>
                  </div>
                </div>

                {/* 6-Stage Progress Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {PRODUCTION_STAGES.map((stage, idx) => {
                    const activeIdx = PRODUCTION_STAGES.indexOf(trackedOrder.stage);
                    const done = idx <= activeIdx;
                    const current = idx === activeIdx;

                    return (
                      <div
                        key={stage}
                        className={`p-3 rounded-lg border text-xs transition-colors ${
                          current
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : done
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-300'
                              : 'bg-white text-zinc-400 border-zinc-200'
                        }`}
                      >
                        <div className="font-mono text-[10px] opacity-70">0{idx + 1}</div>
                        <div className="font-medium mt-0.5 truncate">{stage}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Updates Feed */}
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700">Live Studio Updates</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerChatProductContext(`${trackedOrder.id} (${trackedOrder.itemName})`);
                        setCustomerChatOpen(true);
                      }}
                      className="text-xs font-medium text-zinc-900 hover:underline inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask about {trackedOrder.id}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(trackedOrder.updates || [])
                      .slice()
                      .reverse()
                      .map((upd) => (
                        <div
                          key={upd.id}
                          className="flex items-start justify-between gap-3 text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-lg"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-zinc-900">{upd.stage}</div>
                            <div className="text-zinc-600">{upd.message}</div>
                          </div>
                          <span className="font-mono text-[11px] text-zinc-400 whitespace-nowrap shrink-0">
                            {formatDateTime(upd.timestamp)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-sm text-zinc-500">
                No order found matching <span className="font-mono text-zinc-900">{trackOrderInput}</span>.
              </div>
            )}
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="border-t border-zinc-200 bg-white py-8 px-4 sm:px-6 lg:px-10 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2.5">
              <BrandLogoMark size="sm" />
              <span aria-hidden="true">·</span>
              <span>Manila, Philippines · Local & International Shipping</span>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setCustomerChatOpen(true)}
                className="hover:text-zinc-950 transition-colors"
              >
                Ask Studio
              </button>
              <button
                type="button"
                onClick={() => setSurface('tracker')}
                className="hover:text-zinc-950 transition-colors"
              >
                Owner Production Tracker
              </button>
            </div>
          </div>
        </footer>

        {/* Floating Ask Studio Button */}
        <button
          type="button"
          onClick={() => setCustomerChatOpen(true)}
          className="fixed bottom-5 right-5 z-30 h-12 px-4 rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-2 text-sm font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Studio</span>
        </button>

        {/* PRODUCT QUICK-VIEW MODAL */}
        {activeProductModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2">
              <div className="bg-zinc-100 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200">
                <ProductGarmentImage
                  src={activeProductModal.image}
                  alt={`${activeProductModal.name} in ${(selectedColors[activeProductModal.id] ?? activeProductModal.colors[0]).name}`}
                  aspectClass="aspect-square h-full"
                />
              </div>

              <div className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-zinc-500">
                        {activeProductModal.gsm} · {activeProductModal.fit}
                      </div>
                      <h2 className="font-display text-xl font-bold text-zinc-950 mt-0.5">
                        {activeProductModal.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveProductModal(null)}
                      className="p-1.5 -mr-1.5 text-zinc-400 hover:text-zinc-950 rounded-md"
                      aria-label="Close product modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="font-mono text-lg font-semibold text-zinc-950">
                    {formatPhp(activeProductModal.pricePhp)}
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {activeProductModal.description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs text-zinc-500">
                      Color:{' '}
                      <span className="font-medium text-zinc-950">
                        {(selectedColors[activeProductModal.id] ?? activeProductModal.colors[0]).name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeProductModal.colors.map((c) => {
                        const active =
                          (selectedColors[activeProductModal.id] ?? activeProductModal.colors[0]).name ===
                          c.name;
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() =>
                              setSelectedColors((prev) => ({
                                ...prev,
                                [activeProductModal.id]: c,
                              }))
                            }
                            className={`w-7 h-7 rounded-md border ${
                              active
                                ? 'border-zinc-950 ring-2 ring-zinc-950/20'
                                : 'border-zinc-300'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            aria-label={`Choose ${c.name}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-zinc-500">Size</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {STANDARD_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [activeProductModal.id]: sz,
                            }))
                          }
                          className={`h-9 text-xs font-mono rounded-md border ${
                            (selectedSizes[activeProductModal.id] ?? 'M') === sz
                              ? 'bg-zinc-950 text-white border-zinc-950 font-semibold'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToBag(activeProductModal);
                      setActiveProductModal(null);
                    }}
                    className="w-full h-11 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Add to Bag · {formatPhp(activeProductModal.pricePhp)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskAboutProduct(activeProductModal)}
                    className="w-full h-10 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask About This Shirt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHOPPING BAG & CHECKOUT DRAWER */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45">
            <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-zinc-950">
                  Shopping Bag ({cartCount})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setLastPlacedOrders([]);
                  }}
                  className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {lastPlacedOrders.length > 0 ? (
                  <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Order Recorded on Eleve Tracker</span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Your order has been sent straight to our Manila studio queue. Track its live
                      progress below:
                    </p>
                    <div className="space-y-2">
                      {lastPlacedOrders.map((o) => (
                        <div
                          key={o.id}
                          className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-semibold text-zinc-950">{o.id}</div>
                            <div className="text-zinc-600">
                              {o.itemName} · {o.variant} ({o.quantity} pcs)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTrackOrderInput(o.id);
                              setCartOpen(false);
                              setLastPlacedOrders([]);
                              trackSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1.5 bg-zinc-950 text-white rounded-md font-medium whitespace-nowrap"
                          >
                            Track Live
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-sm text-zinc-500">Your bag is empty.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        collectionSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg"
                    >
                      Browse Tees
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-200">
                      {cart.map((item) => {
                        const matchedProduct = STORE_PRODUCTS.find((p) => p.id === item.productId);
                        return (
                          <div key={item.key} className="py-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {matchedProduct ? (
                                <img
                                  src={matchedProduct.image}
                                  alt={item.productName}
                                  referrerPolicy="no-referrer"
                                  className="w-11 h-11 rounded-md border border-zinc-200 object-cover shrink-0 bg-zinc-100"
                                />
                              ) : (
                                <span
                                  className="w-11 h-11 rounded-md border border-zinc-300 shrink-0"
                                  style={{ backgroundColor: item.swatchHex }}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-zinc-950 truncate">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-xs border border-zinc-300 inline-block shrink-0"
                                    style={{ backgroundColor: item.swatchHex }}
                                  />
                                  <span className="truncate">
                                    {item.colorName} · Size {item.size} · {formatPhp(item.unitPricePhp)}
                                  </span>
                                </div>
                              </div>
                            </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.key, -1)}
                              className="w-7 h-7 border border-zinc-200 rounded flex items-center justify-center text-zinc-600 hover:bg-zinc-100"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.key, 1)}
                              className="w-7 h-7 border border-zinc-200 rounded flex items-center justify-center text-zinc-600 hover:bg-zinc-100"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-zinc-200">
                      <h3 className="font-display text-sm font-semibold text-zinc-950">
                        Delivery Details
                      </h3>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="e.g., Marco Santos"
                          className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-zinc-700">
                            City / Country
                          </label>
                          <div className="inline-flex items-center gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setCheckoutIntl(false)}
                              className={`px-1.5 py-0.5 rounded ${
                                !checkoutIntl ? 'bg-zinc-950 text-white' : 'text-zinc-500'
                              }`}
                            >
                              Philippines
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckoutIntl(true)}
                              className={`px-1.5 py-0.5 rounded ${
                                checkoutIntl ? 'bg-zinc-950 text-white' : 'text-zinc-500'
                              }`}
                            >
                              International
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={checkoutDestination}
                          onChange={(e) => setCheckoutDestination(e.target.value)}
                          placeholder={checkoutIntl ? 'Tokyo, JP' : 'Makati, PH'}
                          className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Order Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={checkoutNotes}
                          onChange={(e) => setCheckoutNotes(e.target.value)}
                          placeholder="Delivery notes, print requests..."
                          className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                        />
                      </div>
                    </form>
                  </>
                )}
              </div>

              {cart.length > 0 && lastPlacedOrders.length === 0 && (
                <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-mono font-semibold text-zinc-950">
                      {formatPhp(cartSubtotalPhp)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={placingOrder}
                    className="w-full h-11 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {placingOrder ? 'Recording Order...' : 'Place Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIVE CUSTOMER CHAT DRAWER */}
        {customerChatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45">
            <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl">
              <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-950">
                    Ask Eleve Studio
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Real-time chat with our Manila team
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerChatOpen(false)}
                  className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!activeCustomerThread && (
                <div className="p-4 bg-zinc-50 border-b border-zinc-200 grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={shopperNameInput}
                      onChange={(e) => setShopperNameInput(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-9 px-2.5 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      City / Country
                    </label>
                    <input
                      type="text"
                      value={shopperLocationInput}
                      onChange={(e) => setShopperLocationInput(e.target.value)}
                      placeholder="Manila, PH"
                      className="w-full h-9 px-2.5 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
                {activeCustomerThread ? (
                  activeCustomerThread.messages.map((msg) => {
                    const isCustomer = msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                            isCustomer
                              ? 'bg-zinc-950 text-white'
                              : 'bg-white border border-zinc-200 text-zinc-950'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 mt-1 px-1">
                          {isCustomer ? 'You' : 'Eleve Manila'} · {formatChatTime(msg.timestamp)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center space-y-2 text-xs text-zinc-500">
                    <MessageSquare className="w-7 h-7 text-zinc-300 mx-auto" />
                    <p className="max-w-xs mx-auto">
                      Ask about blank sizing, print options, or shipping from Manila. Replies appear
                      here in real time.
                    </p>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendCustomerChat}
                className="p-3.5 bg-white border-t border-zinc-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customerDraft}
                  onChange={(e) => setCustomerDraft(e.target.value)}
                  placeholder="Ask about a t-shirt or order..."
                  className="flex-1 h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950"
                />
                <button
                  type="submit"
                  disabled={!customerDraft.trim()}
                  className="h-10 px-4 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: OWNER TRACKER MODE
  // ============================================================================

  const breadcrumbLabel =
    trackerTab === 'orders'
      ? 'T-Shirt Orders'
      : trackerTab === 'messages'
        ? 'Customer Messages'
        : trackerTab === 'inventory'
          ? 'Blanks & Stock'
          : 'Custom Measurements';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandLogoMark size="sm" />
            <span className="font-display text-sm font-semibold tracking-tight text-zinc-950 whitespace-nowrap">
              Tracker
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-950 rounded-md"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Tracker navigation">
          <button
            type="button"
            onClick={() => {
              setTrackerTab('orders');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              trackerTab === 'orders'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>T-Shirt Orders</span>
            </span>
            <span className="font-mono text-xs text-zinc-400">{orders.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackerTab('messages');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              trackerTab === 'messages'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Customer Chat</span>
            </span>
            <span
              className={`font-mono text-xs ${
                unreadChatsCount > 0
                  ? trackerTab === 'messages'
                    ? 'text-white'
                    : 'text-zinc-950 font-semibold'
                  : 'text-zinc-400'
              }`}
            >
              {unreadChatsCount > 0 ? `${unreadChatsCount} new` : chats.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackerTab('inventory');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              trackerTab === 'inventory'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Blanks & Stock</span>
            </span>
            <span
              className={`font-mono text-xs ${
                lowStockMaterials.length > 0
                  ? trackerTab === 'inventory'
                    ? 'text-amber-300'
                    : 'text-amber-700 font-semibold'
                  : 'text-zinc-400'
              }`}
            >
              {lowStockMaterials.length > 0 ? `${lowStockMaterials.length} low` : materials.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackerTab('measurements');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              trackerTab === 'measurements'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Ruler className="w-4 h-4 shrink-0" />
              <span>Measurements</span>
            </span>
            <span className="font-mono text-xs text-zinc-400">
              {customMeasurementOrders.length}
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200 space-y-2.5">
          <button
            type="button"
            onClick={() => setSurface('storefront')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Open Storefront</span>
          </button>

          {!confirmResetOpen ? (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          ) : (
            <div className="space-y-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
              <p className="text-xs text-zinc-700">Restore default orders, chats & stock?</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-950 rounded-lg hover:bg-zinc-100"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-500 hidden sm:inline whitespace-nowrap">Manila Studio</span>
              <span className="text-zinc-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-zinc-950 truncate">
                {breadcrumbLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {trackerTab === 'inventory' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stock Item</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingOrder(null);
                  setOrderModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Dashboard Overview Metric Cards */}
          <section aria-label="Production overview metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-600">Total Active Orders</span>
                  <ClipboardList className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
                    {metrics.totalActiveCount}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">
                    {metrics.activeUnits} tees
                  </span>
                </div>
                <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-2.5 flex items-center gap-2">
                  <span>{metrics.phActiveCount} PH</span>
                  <span aria-hidden="true">·</span>
                  <span>{metrics.intlActiveCount} International</span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-600">Orders in Production</span>
                  <Printer className="w-4 h-4 text-zinc-700 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
                    {metrics.inProductionCount}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 tabular-nums">
                    {metrics.inProductionUnits} tees in print
                  </span>
                </div>
                <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                  Design & Mockup · Printing · QC
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-600">Pending Materials</span>
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-zinc-400'
                    }`}
                  />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
                    {metrics.pendingBlanksTotal}
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      metrics.lowStockCount > 0 ? 'text-amber-700 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {metrics.lowStockCount} low-stock
                  </span>
                </div>
                <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-2.5 flex items-center justify-between gap-2">
                  <span>{metrics.blankSourcingCount} sourcing blanks</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackerTab('inventory');
                      setLowStockOnly(true);
                    }}
                    className="text-zinc-900 hover:underline font-medium inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Check stock</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-600">Completed This Week</span>
                  <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
                    {metrics.completedThisWeekCount}
                  </span>
                  <span className="text-xs font-mono text-emerald-700 tabular-nums">
                    {metrics.completedUnits} tees ready
                  </span>
                </div>
                <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                  Ready to Ship in last 7 days
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================================== */}
          {/* TAB 1: ORDERS (KANBAN & TABLE) */}
          {/* ======================================================================== */}
          {trackerTab === 'orders' && (
            <section className="space-y-4" aria-label="T-shirt order management">
              <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, customer, city, or tee..."
                      className="w-full h-10 pl-9 pr-8 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as 'ALL' | ProductionStage)}
                    aria-label="Filter by production stage"
                    className="h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:bg-white focus:border-zinc-950"
                  >
                    <option value="ALL">All Stages ({orders.length})</option>
                    {PRODUCTION_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage} ({orders.filter((o) => o.stage === stage).length})
                      </option>
                    ))}
                  </select>

                  <div className="inline-flex items-center p-1 bg-zinc-100 rounded-lg self-start sm:self-auto">
                    {(['ALL', 'PH', 'INTL'] as const).map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => setRegionFilter(region)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          regionFilter === region
                            ? 'bg-white text-zinc-950 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {region === 'ALL'
                          ? 'All Regions'
                          : region === 'PH'
                            ? 'Philippines'
                            : 'International'}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="inline-flex items-center p-1 bg-zinc-100 rounded-lg self-start lg:self-auto shrink-0"
                  role="group"
                  aria-label="Order view mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      viewMode === 'kanban'
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Kanban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      viewMode === 'table'
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    <TableIcon className="w-4 h-4" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-3">
                  <Shirt className="w-8 h-8 text-zinc-400 mx-auto" />
                  <h3 className="font-display text-base font-semibold text-zinc-950">
                    No matching orders
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStageFilter('ALL');
                      setRegionFilter('ALL');
                    }}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === 'kanban' ? (
                <div className="overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="grid grid-flow-col auto-cols-[296px] gap-3.5 min-w-max">
                    {PRODUCTION_STAGES.filter(
                      (stage) => stageFilter === 'ALL' || stage === stageFilter
                    ).map((stage) => {
                      const stageOrders = filteredOrders.filter((o) => o.stage === stage);
                      const stageUnits = stageOrders.reduce((acc, o) => acc + o.quantity, 0);
                      const isDropTarget = dragOverStage === stage;

                      return (
                        <div
                          key={stage}
                          onDragOver={(e) => onDragOverStage(e, stage)}
                          onDragLeave={() => {
                            if (dragOverStage === stage) setDragOverStage(null);
                          }}
                          onDrop={(e) => onDropStage(e, stage)}
                          className={`flex flex-col rounded-xl border transition-colors min-h-[460px] ${
                            isDropTarget
                              ? 'bg-zinc-200/70 border-zinc-950'
                              : 'bg-zinc-100/80 border-zinc-200'
                          }`}
                        >
                          <div className="px-3.5 py-3 border-b border-zinc-200 bg-white rounded-t-xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-xs shrink-0 ${getStageDotClass(stage)}`}
                              />
                              <h2 className="font-display text-sm font-semibold text-zinc-950 truncate">
                                {stage}
                              </h2>
                            </div>
                            <span className="font-mono text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                              {stageOrders.length} · {stageUnits} pcs
                            </span>
                          </div>

                          <div className="p-2.5 space-y-2.5 flex-1">
                            {stageOrders.length === 0 ? (
                              <div className="h-24 border border-dashed border-zinc-300 rounded-lg flex items-center justify-center text-xs text-zinc-400 px-4 text-center">
                                Drop order here
                              </div>
                            ) : (
                              stageOrders.map((order) => {
                                const dueStatus = getDueStatus(order.dueDate, order.stage);
                                const isDragging = draggedOrderId === order.id;

                                return (
                                  <article
                                    key={order.id}
                                    draggable
                                    onDragStart={(e) => onDragStartOrder(e, order.id)}
                                    onDragEnd={onDragEndOrder}
                                    className={`bg-white border border-zinc-200 rounded-lg p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-opacity ${
                                      isDragging ? 'opacity-40' : 'hover:border-zinc-400'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                      <div className="flex items-center gap-1.5 min-w-0 font-mono tabular-nums">
                                        <span className="font-semibold text-zinc-900">
                                          {order.id}
                                        </span>
                                        <span className="text-zinc-300" aria-hidden="true">
                                          ·
                                        </span>
                                        <span
                                          className={
                                            dueStatus === 'overdue'
                                              ? 'text-red-600 font-semibold'
                                              : dueStatus === 'soon'
                                                ? 'text-amber-600 font-medium'
                                                : 'text-zinc-500'
                                          }
                                        >
                                          {formatShortDate(order.dueDate)}
                                          {dueStatus === 'overdue' ? ' (Late)' : ''}
                                        </span>
                                      </div>
                                      <GripVertical
                                        className="w-3.5 h-3.5 text-zinc-300 shrink-0"
                                        aria-hidden="true"
                                      />
                                    </div>

                                    <div>
                                      <h3 className="text-sm font-semibold text-zinc-950 leading-snug">
                                        {order.itemName}
                                      </h3>
                                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                                        <span className="truncate font-medium text-zinc-800">
                                          {order.customerName}
                                        </span>
                                        <span className="text-zinc-300" aria-hidden="true">
                                          ·
                                        </span>
                                        <span className="truncate text-zinc-500">
                                          {order.destination}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                                        <span
                                          className="w-2.5 h-2.5 rounded-xs border border-zinc-300 shrink-0"
                                          style={{ backgroundColor: order.swatchHex }}
                                        />
                                        <span className="truncate">{order.variant}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-zinc-100">
                                      <span className="text-zinc-500 truncate">
                                        {formatSizeSummary(order)}
                                      </span>
                                      <span className="font-mono font-semibold text-zinc-950 tabular-nums shrink-0">
                                        {order.quantity} pcs
                                      </span>
                                    </div>

                                    <div className="pt-0.5 space-y-2">
                                      <select
                                        value={order.stage}
                                        onChange={(e) =>
                                          handleStageChange(
                                            order.id,
                                            e.target.value as ProductionStage
                                          )
                                        }
                                        aria-label={`Stage for ${order.id}`}
                                        className={`w-full h-8 px-2 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-950 ${getStageTextTone(
                                          order.stage
                                        )}`}
                                      >
                                        {PRODUCTION_STAGES.map((st) => (
                                          <option key={st} value={st} className="text-zinc-950">
                                            {st}
                                          </option>
                                        ))}
                                      </select>

                                      <div className="flex items-center justify-between gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setLiveUpdateOrder(order)}
                                          className="flex-1 h-8 px-2 text-xs font-medium rounded-md border bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800 inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                                          title="Push live update to customer tracker"
                                        >
                                          <Globe className="w-3 h-3 shrink-0" />
                                          <span>Update</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleOpenCustomerChatInTracker(order)}
                                          className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors"
                                          title={`Chat with ${order.customerName}`}
                                          aria-label={`Chat with ${order.customerName}`}
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setMeasurementOrderId(order.id)}
                                          className={`h-8 w-8 inline-flex items-center justify-center rounded-md border transition-colors ${
                                            order.measurements
                                              ? 'bg-zinc-900 text-white border-zinc-900'
                                              : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                                          }`}
                                          title="Measurements"
                                          aria-label={`Measurements for ${order.id}`}
                                        >
                                          <Ruler className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingOrder(order);
                                            setOrderModalOpen(true);
                                          }}
                                          className="h-8 w-8 inline-flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors"
                                          aria-label={`Edit ${order.id}`}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteOrder(order.id)}
                                          className="h-8 w-8 inline-flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-zinc-200 transition-colors"
                                          aria-label={`Delete ${order.id}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                          <th className="py-3 px-4 whitespace-nowrap">Order ID</th>
                          <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                          <th className="py-3 px-4 whitespace-nowrap">T-Shirt & Color</th>
                          <th className="py-3 px-4 whitespace-nowrap">Sizes</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Qty</th>
                          <th className="py-3 px-4 whitespace-nowrap">Due</th>
                          <th className="py-3 px-4 whitespace-nowrap">Stage</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 text-sm">
                        {filteredOrders.map((order) => {
                          const dueStatus = getDueStatus(order.dueDate, order.stage);
                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-zinc-50/80 transition-colors align-middle"
                            >
                              <td className="py-3 px-4 font-mono text-xs font-semibold text-zinc-900 whitespace-nowrap">
                                {order.id}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-medium text-zinc-950">
                                  {order.customerName}
                                </div>
                                <div className="text-xs text-zinc-500">{order.destination}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-zinc-950">{order.itemName}</div>
                                <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-xs border border-zinc-300 shrink-0"
                                    style={{ backgroundColor: order.swatchHex }}
                                  />
                                  <span>{order.variant}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-xs text-zinc-600 whitespace-nowrap">
                                {formatSizeSummary(order)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-zinc-950 tabular-nums whitespace-nowrap">
                                {order.quantity}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`font-mono text-xs tabular-nums ${
                                    dueStatus === 'overdue'
                                      ? 'text-red-600 font-semibold'
                                      : dueStatus === 'soon'
                                        ? 'text-amber-600 font-medium'
                                        : 'text-zinc-600'
                                  }`}
                                >
                                  {formatShortDate(order.dueDate)}
                                  {dueStatus === 'overdue' ? ' · Late' : ''}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <select
                                  value={order.stage}
                                  onChange={(e) =>
                                    handleStageChange(order.id, e.target.value as ProductionStage)
                                  }
                                  aria-label={`Stage for ${order.id}`}
                                  className={`h-8 px-2.5 text-xs font-medium bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-950 ${getStageTextTone(
                                    order.stage
                                  )}`}
                                >
                                  {PRODUCTION_STAGES.map((st) => (
                                    <option key={st} value={st} className="text-zinc-950">
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setLiveUpdateOrder(order)}
                                    className="px-2.5 h-8 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                                  >
                                    Live Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCustomerChatInTracker(order)}
                                    className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                                    aria-label={`Chat with ${order.customerName}`}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMeasurementOrderId(order.id)}
                                    className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                                    aria-label={`Measurements for ${order.id}`}
                                  >
                                    <Ruler className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOrder(order);
                                      setOrderModalOpen(true);
                                    }}
                                    className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                                    aria-label={`Edit ${order.id}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    aria-label={`Delete ${order.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ======================================================================== */}
          {/* TAB 2: CUSTOMERS-ONLY REAL-TIME CHAT INBOX */}
          {/* ======================================================================== */}
          {trackerTab === 'messages' && (
            <section className="space-y-4" aria-label="Customer messages">
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
                {/* Left Customer Thread List */}
                <div
                  className={`lg:col-span-4 border-r border-zinc-200 flex flex-col ${
                    mobileShowOwnerThread ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  <div className="p-3 border-b border-zinc-200">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Search customer, city, or order ID..."
                        className="w-full h-9 pl-9 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                    {filteredOwnerChats.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        No customer messages yet. Inquiries from the Storefront appear here in real
                        time.
                      </div>
                    ) : (
                      filteredOwnerChats.map((thread) => {
                        const isActive = activeOwnerChat?.id === thread.id;
                        const lastMsg = thread.messages[thread.messages.length - 1];

                        return (
                          <button
                            key={thread.id}
                            type="button"
                            onClick={() => handleSelectOwnerChat(thread)}
                            className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                              isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-zinc-950 text-white border-zinc-950'
                                  : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-zinc-950 truncate">
                                  {thread.customerName}
                                </span>
                                <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                                  {lastMsg ? formatChatTime(lastMsg.timestamp) : ''}
                                </span>
                              </div>

                              <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5 truncate">
                                <span>{thread.location}</span>
                                {thread.linkedOrderId && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono text-zinc-900">
                                      {thread.linkedOrderId}
                                    </span>
                                  </>
                                )}
                              </div>

                              {lastMsg && (
                                <p
                                  className={`text-xs mt-1 truncate ${
                                    thread.unread ? 'text-zinc-950 font-semibold' : 'text-zinc-500'
                                  }`}
                                >
                                  {lastMsg.sender === 'owner' ? 'You: ' : ''}
                                  {lastMsg.text}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Active Customer Conversation */}
                <div
                  className={`lg:col-span-8 flex flex-col bg-zinc-50/50 ${
                    mobileShowOwnerThread ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {activeOwnerChat ? (
                    <>
                      <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => setMobileShowOwnerThread(false)}
                            className="lg:hidden p-1.5 -ml-1.5 text-zinc-600 hover:text-zinc-950 rounded-md"
                            aria-label="Back to customer list"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <h2 className="font-display text-sm font-semibold text-zinc-950 truncate">
                              {activeOwnerChat.customerName}
                            </h2>
                            <div className="text-xs text-zinc-500 truncate">
                              {activeOwnerChat.location}
                              {activeOwnerChat.productContext
                                ? ` · ${activeOwnerChat.productContext}`
                                : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={activeOwnerChat.linkedOrderId ?? ''}
                            onChange={async (e) => {
                              await fetch(`/api/chats/${encodeURIComponent(activeOwnerChat.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ linkedOrderId: e.target.value }),
                              });
                            }}
                            aria-label="Link order to customer chat"
                            className="h-8 px-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md text-zinc-800"
                          >
                            <option value="">No linked order</option>
                            {orders.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.id} · {o.stage}
                              </option>
                            ))}
                          </select>

                          {activeOwnerChat.linkedOrderId && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(activeOwnerChat.linkedOrderId || '');
                                setTrackerTab('orders');
                              }}
                              className="h-8 px-2.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md whitespace-nowrap"
                            >
                              View {activeOwnerChat.linkedOrderId}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[380px]">
                        {activeOwnerChat.messages.map((msg) => {
                          const isOwner = msg.sender === 'owner';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                                  isOwner
                                    ? 'bg-zinc-950 text-white'
                                    : 'bg-white border border-zinc-200 text-zinc-950'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <span className="text-[11px] font-mono text-zinc-400 mt-1 px-1">
                                {isOwner ? 'Eleve Manila' : activeOwnerChat.customerName} ·{' '}
                                {formatChatTime(msg.timestamp)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 sm:p-4 bg-white border-t border-zinc-200 space-y-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setOwnerDraft(
                                `Hi ${activeOwnerChat.customerName}! Your tee batch is in Printing now—we'll update your tracker live once it reaches Quality Check.`
                              )
                            }
                            className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
                          >
                            Printing Update
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setOwnerDraft(
                                `Hi ${activeOwnerChat.customerName}! Our 280GSM blanks are pre-shrunk combed cotton with a relaxed boxy drape. True to size!`
                              )
                            }
                            className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
                          >
                            Sizing & Fit Info
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setOwnerDraft(
                                `Hi ${activeOwnerChat.customerName}, your order passed QC and is Ready to Ship from our Manila studio!`
                              )
                            }
                            className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
                          >
                            Ready to Ship
                          </button>
                        </div>

                        <form onSubmit={handleOwnerSendReply} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ownerDraft}
                            onChange={(e) => setOwnerDraft(e.target.value)}
                            placeholder={`Reply to ${activeOwnerChat.customerName}...`}
                            className="flex-1 h-10 px-3.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950"
                          />
                          <button
                            type="submit"
                            disabled={!ownerDraft.trim()}
                            className="h-10 px-4 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 rounded-lg inline-flex items-center gap-1.5 shrink-0"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8 text-sm text-zinc-500">
                      Select a customer conversation to reply in real time.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ======================================================================== */}
          {/* TAB 3: BLANK SHIRTS & PRINT STOCK INVENTORY */}
          {/* ======================================================================== */}
          {trackerTab === 'inventory' && (
            <section className="space-y-4" aria-label="Blanks and print inventory">
              {lowStockMaterials.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-950">
                        {lowStockMaterials.length} item
                        {lowStockMaterials.length > 1 ? 's' : ''} below reorder level
                      </h2>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {lowStockMaterials
                          .map((m) => `${m.name} (${m.stock} ${m.unit})`)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLowStockOnly((v) => !v)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      lowStockOnly
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-900 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {lowStockOnly ? 'Show All' : 'Low Stock Only'}
                  </button>
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Search blank shirts, neck transfers, mailers..."
                    className="w-full h-10 pl-9 pr-8 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setLowStockOnly((v) => !v)}
                  className={`h-10 px-3.5 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
                    lowStockOnly
                      ? 'bg-zinc-950 border-zinc-950 text-white'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Low Stock ({lowStockMaterials.length})</span>
                </button>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                        <th className="py-3 px-4 whitespace-nowrap">SKU</th>
                        <th className="py-3 px-4 whitespace-nowrap">Blank / Supply Item</th>
                        <th className="py-3 px-4 whitespace-nowrap">Supplier</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">In Stock</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Min</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap">Adjust</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-sm">
                      {filteredMaterials.map((item) => {
                        const isCritical = item.stock === 0;
                        const isLow = item.stock <= item.minThreshold;

                        return (
                          <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                              {item.sku}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-zinc-950">{item.name}</div>
                              <div className="text-xs text-zinc-500">{item.category}</div>
                            </td>
                            <td className="py-3 px-4 text-xs text-zinc-600 whitespace-nowrap">
                              {item.supplier}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-950 tabular-nums whitespace-nowrap">
                              {item.stock} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                              {item.minThreshold} {item.unit}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isLow ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                    isCritical ? 'text-red-600' : 'text-amber-700'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{isCritical ? 'Out of Stock' : 'Low Stock'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>In Stock</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.id, -5)}
                                  className="h-7 px-2 text-xs font-mono border border-zinc-200 rounded bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                                >
                                  -5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.id, -1)}
                                  className="h-7 w-7 inline-flex items-center justify-center border border-zinc-200 rounded bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                                  aria-label={`Decrease ${item.name} by 1`}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.id, 1)}
                                  className="h-7 w-7 inline-flex items-center justify-center border border-zinc-200 rounded bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                                  aria-label={`Increase ${item.name} by 1`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.id, 5)}
                                  className="h-7 px-2 text-xs font-mono border border-zinc-200 rounded bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                                >
                                  +5
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMaterial(item);
                                    setMaterialModalOpen(true);
                                  }}
                                  className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
                                  aria-label={`Edit ${item.name}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterial(item.id)}
                                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                  aria-label={`Delete ${item.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================================== */}
          {/* TAB 4: CUSTOM MEASUREMENT PROFILES */}
          {/* ======================================================================== */}
          {trackerTab === 'measurements' && (
            <section className="space-y-4" aria-label="Custom t-shirt measurements">
              {customMeasurementOrders.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-3">
                  <Ruler className="w-8 h-8 text-zinc-400 mx-auto" />
                  <h3 className="font-display text-base font-semibold text-zinc-950">
                    No custom measurement orders yet
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Click the ruler icon on any order card to log Bust/Chest, Waist, Hip, Inseam,
                    and Length specs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {customMeasurementOrders.map((order) => {
                    const specs = order.measurements;
                    return (
                      <article
                        key={order.id}
                        className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-semibold text-zinc-900">
                              {order.id} · {order.stage}
                            </span>
                            <span className="font-mono text-zinc-500">
                              Due {formatShortDate(order.dueDate)}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-semibold text-zinc-950">
                            {order.customerName} · {order.destination}
                          </h3>
                          <div className="text-xs text-zinc-600 flex items-center gap-1.5">
                            <span>{order.itemName}</span>
                            <span className="text-zinc-300" aria-hidden="true">
                              ·
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-xs border border-zinc-300 shrink-0"
                              style={{ backgroundColor: order.swatchHex }}
                            />
                            <span>{order.variant}</span>
                          </div>
                        </div>

                        {specs ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-5 gap-2 py-3 border-y border-zinc-100 text-center">
                              <div>
                                <div className="text-[11px] text-zinc-500">Bust/Chest</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5">
                                  {specs.bust || '—'}
                                  {specs.bust && specs.bust !== '—' ? specs.unit : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-500">Waist</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5">
                                  {specs.waist || '—'}
                                  {specs.waist && specs.waist !== '—' ? specs.unit : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-500">Hip</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5">
                                  {specs.hip || '—'}
                                  {specs.hip && specs.hip !== '—' ? specs.unit : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-500">Inseam</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5">
                                  {specs.inseam || '—'}
                                  {specs.inseam && specs.inseam !== '—' ? specs.unit : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-500">Length</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5">
                                  {specs.length || '—'}
                                  {specs.length && specs.length !== '—' ? specs.unit : ''}
                                </div>
                              </div>
                            </div>
                            {specs.notes && (
                              <p className="text-xs text-zinc-600 leading-relaxed">{specs.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div className="py-4 border-y border-zinc-100 text-xs text-amber-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Custom tee order awaiting measurement entry.</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-zinc-400 font-mono">
                            {specs ? `Updated ${formatShortDate(specs.updatedAt)}` : 'Not logged'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMeasurementOrderId(order.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{specs ? 'Edit Specs' : 'Log Specs'}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* TRACKER MODALS */}
      {orderModalOpen && (
        <OrderFormModal
          initialOrder={editingOrder}
          onClose={() => {
            setOrderModalOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
        />
      )}

      {activeMeasurementOrder && (
        <MeasurementModal
          order={activeMeasurementOrder}
          onClose={() => setMeasurementOrderId(null)}
          onSave={(specs) => handleSaveMeasurements(activeMeasurementOrder.id, specs)}
          onClear={() => handleClearMeasurements(activeMeasurementOrder.id)}
        />
      )}

      {liveUpdateOrder && (
        <LiveUpdateModal
          order={liveUpdateOrder}
          onClose={() => setLiveUpdateOrder(null)}
          onSend={(stage, msg) => handleSendLiveOrderUpdate(liveUpdateOrder.id, stage, msg)}
        />
      )}

      {materialModalOpen && (
        <MaterialFormModal
          initialMaterial={editingMaterial}
          onClose={() => {
            setMaterialModalOpen(false);
            setEditingMaterial(null);
          }}
          onSave={handleSaveMaterial}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: LIVE UPDATE BROADCAST MODAL
// ============================================================================

function LiveUpdateModal({
  order,
  onClose,
  onSend,
}: {
  order: Order;
  onClose: () => void;
  onSend: (stage: ProductionStage, message: string) => void;
}) {
  const [stage, setStage] = useState<ProductionStage>(order.stage);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(stage, message.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500">
              {order.id} · {order.customerName}
            </div>
            <h2 className="font-display text-base font-semibold text-zinc-950">
              Push Real-Time Update to Customer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Production Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as ProductionStage)}
              className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
            >
              {PRODUCTION_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Customer-Facing Status Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Silkscreen cured cleanly—moving to Quality Check before Lalamove/DHL dispatch."
              className="w-full p-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none"
              required
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'Blanks pulled and checked in Manila studio.',
              'Artwork alignment verified—entering Printing now.',
              'Print cured and passed Quality Check!',
              'Packed & ready for courier pickup.',
            ].map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setMessage(tpl)}
                className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md text-left"
              >
                {tpl}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg"
            >
              Publish Live Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: ORDER FORM MODAL
// ============================================================================

function OrderFormModal({
  initialOrder,
  onClose,
  onSave,
}: {
  initialOrder: Order | null;
  onClose: () => void;
  onSave: (
    payload: Omit<Order, 'id' | 'createdAt' | 'completedAt' | 'updates'>,
    existingId?: string
  ) => void;
}) {
  const defaultDue = addDaysISO(new Date(), 7);
  const [customerName, setCustomerName] = useState(initialOrder?.customerName ?? '');
  const [destination, setDestination] = useState(initialOrder?.destination ?? 'Makati, PH');
  const [isInternational, setIsInternational] = useState(initialOrder?.isInternational ?? false);
  const [itemName, setItemName] = useState(initialOrder?.itemName ?? STORE_PRODUCTS[0].name);
  const [variant, setVariant] = useState(initialOrder?.variant ?? 'Pitch Black');
  const [swatchHex, setSwatchHex] = useState(initialOrder?.swatchHex ?? '#09090B');
  const [isCustom, setIsCustom] = useState(initialOrder?.isCustom ?? false);
  const [sizeBreakdown, setSizeBreakdown] = useState<SizeBreakdown>(
    initialOrder?.sizeBreakdown ?? { XS: 0, S: 1, M: 2, L: 1, XL: 0 }
  );
  const [quantity, setQuantity] = useState<number>(initialOrder?.quantity ?? 4);
  const [dueDate, setDueDate] = useState(initialOrder?.dueDate ?? defaultDue);
  const [stage, setStage] = useState<ProductionStage>(initialOrder?.stage ?? 'New Order');
  const [notes, setNotes] = useState(initialOrder?.notes ?? '');

  const handleSizeChange = (size: StandardSize, rawVal: string) => {
    const val = Math.max(0, parseInt(rawVal || '0', 10) || 0);
    const updated = { ...sizeBreakdown, [size]: val };
    setSizeBreakdown(updated);
    if (!isCustom) {
      const total = sumSizes(updated);
      setQuantity(total > 0 ? total : 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemName.trim() || !variant.trim()) return;
    onSave(
      {
        customerName: customerName.trim(),
        destination: destination.trim() || (isInternational ? 'International' : 'Philippines'),
        isInternational,
        itemName: itemName.trim(),
        variant: variant.trim(),
        swatchHex,
        isCustom,
        sizeBreakdown: isCustom ? emptySizeBreakdown() : sizeBreakdown,
        quantity: Math.max(1, quantity),
        totalPricePhp: quantity * 1290,
        dueDate,
        stage,
        notes: notes.trim(),
        measurements: initialOrder?.measurements,
      },
      initialOrder?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            {initialOrder ? `Edit ${initialOrder.id}` : 'New T-Shirt Order'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Marco Santos"
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-700">Destination</label>
                <div className="inline-flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsInternational(false)}
                    className={`px-1.5 py-0.5 rounded ${
                      !isInternational ? 'bg-zinc-950 text-white' : 'text-zinc-500'
                    }`}
                  >
                    PH
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternational(true)}
                    className={`px-1.5 py-0.5 rounded ${
                      isInternational ? 'bg-zinc-950 text-white' : 'text-zinc-500'
                    }`}
                  >
                    Intl
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={isInternational ? 'Tokyo, JP' : 'Makati, PH'}
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">T-Shirt Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {STORE_PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setItemName(p.name)}
                  className={`px-2.5 py-1 text-xs rounded-md border ${
                    itemName === p.name
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">Blank Color</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span
                  className="w-10 h-10 rounded-lg border border-zinc-300 shrink-0"
                  style={{ backgroundColor: swatchHex }}
                />
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { name: 'Pitch Black', hex: '#09090B' },
                  { name: 'Optic White', hex: '#FFFFFF' },
                  { name: 'Washed Charcoal', hex: '#3F3F46' },
                  { name: 'Bone', hex: '#E7E5E4' },
                  { name: 'Ash Heather', hex: '#A1A1AA' },
                  { name: 'Raw Sage', hex: '#6B7B69' },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSwatchHex(c.hex);
                      setVariant(c.name);
                    }}
                    title={c.name}
                    className={`w-7 h-7 rounded-md border ${
                      swatchHex === c.hex ? 'border-zinc-950 ring-2 ring-zinc-950/20' : 'border-zinc-300'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700">Size Breakdown</span>
              <div className="inline-flex items-center p-0.5 bg-zinc-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    !isCustom ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setQuantity(1);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    isCustom ? 'bg-zinc-950 text-white' : 'text-zinc-600'
                  }`}
                >
                  Custom Fit
                </button>
              </div>
            </div>

            {!isCustom && (
              <div className="grid grid-cols-5 gap-2">
                {STANDARD_SIZES.map((sz) => (
                  <div key={sz} className="space-y-1">
                    <label className="block text-[11px] font-mono text-center text-zinc-500">
                      {sz}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={sizeBreakdown[sz]}
                      onChange={(e) => handleSizeChange(sz, e.target.value)}
                      className="w-full h-9 px-2 text-center font-mono text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10) || 1))}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              >
                {PRODUCTION_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg"
            >
              {initialOrder ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: CUSTOM MEASUREMENT MODAL
// ============================================================================

function MeasurementModal({
  order,
  onClose,
  onSave,
  onClear,
}: {
  order: Order;
  onClose: () => void;
  onSave: (specs: CustomMeasurements) => void;
  onClear: () => void;
}) {
  const [unit, setUnit] = useState<'in' | 'cm'>(order.measurements?.unit ?? 'in');
  const [bust, setBust] = useState(order.measurements?.bust ?? '');
  const [waist, setWaist] = useState(order.measurements?.waist ?? '');
  const [hip, setHip] = useState(order.measurements?.hip ?? '');
  const [inseam, setInseam] = useState(order.measurements?.inseam ?? '');
  const [length, setLength] = useState(order.measurements?.length ?? '');
  const [notes, setNotes] = useState(order.measurements?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      unit,
      bust: bust.trim() || '—',
      waist: waist.trim() || '—',
      hip: hip.trim() || '—',
      inseam: inseam.trim() || '—',
      length: length.trim() || '—',
      notes: notes.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500">
              {order.id} · {order.customerName}
            </div>
            <h2 className="font-display text-base font-semibold text-zinc-950">
              Custom Measurements
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="text-xs">
              <div className="font-medium text-zinc-950">{order.itemName}</div>
              <div className="text-zinc-500">{order.variant}</div>
            </div>
            <div className="inline-flex items-center p-0.5 bg-zinc-200/80 rounded-md">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  unit === 'in' ? 'bg-zinc-950 text-white font-semibold' : 'text-zinc-600'
                }`}
              >
                in
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  unit === 'cm' ? 'bg-zinc-950 text-white font-semibold' : 'text-zinc-600'
                }`}
              >
                cm
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Bust / Chest ({unit})
              </label>
              <input
                type="text"
                value={bust}
                onChange={(e) => setBust(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Waist ({unit})
              </label>
              <input
                type="text"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Hip ({unit})</label>
              <input
                type="text"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Inseam ({unit})
              </label>
              <input
                type="text"
                value={inseam}
                onChange={(e) => setInseam(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Length ({unit})
              </label>
              <input
                type="text"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-3">
            {order.measurements ? (
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove Specs
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Specs</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: MATERIAL FORM MODAL
// ============================================================================

function MaterialFormModal({
  initialMaterial,
  onClose,
  onSave,
}: {
  initialMaterial: MaterialItem | null;
  onClose: () => void;
  onSave: (payload: Omit<MaterialItem, 'id' | 'lastUpdated'>, existingId?: string) => void;
}) {
  const [name, setName] = useState(initialMaterial?.name ?? '');
  const [sku, setSku] = useState(initialMaterial?.sku ?? '');
  const [category, setCategory] = useState<MaterialCategory>(
    initialMaterial?.category ?? 'Blank Tees'
  );
  const [unit, setUnit] = useState(initialMaterial?.unit ?? 'pcs');
  const [stock, setStock] = useState<number>(initialMaterial?.stock ?? 20);
  const [minThreshold, setMinThreshold] = useState<number>(initialMaterial?.minThreshold ?? 15);
  const [supplier, setSupplier] = useState(
    initialMaterial?.supplier ?? 'Taytay Blanks Wholesale, PH'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(
      {
        name: name.trim(),
        sku: sku.trim() || `ELV-${Date.now().toString().slice(-4)}`,
        category,
        unit: unit.trim() || 'pcs',
        stock: Math.max(0, stock),
        minThreshold: Math.max(0, minThreshold),
        supplier: supplier.trim() || 'Manila Studio Supply',
      },
      initialMaterial?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            {initialMaterial ? 'Edit Stock Item' : 'Add Stock Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-950 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
              >
                <option value="Blank Tees">Blank Tees</option>
                <option value="Print & Ink">Print & Ink</option>
                <option value="Labels & Packaging">Labels & Packaging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Stock</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Min</label>
              <input
                type="number"
                min={0}
                value={minThreshold}
                onChange={(e) =>
                  setMinThreshold(Math.max(0, parseInt(e.target.value || '0', 10) || 0))
                }
                className="w-full h-10 px-3 font-mono text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
            />
          </div>

          <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg"
            >
              {initialMaterial ? 'Save Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
