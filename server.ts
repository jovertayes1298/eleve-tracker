import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const OWNER_PASSCODE = process.env.OWNER_PASSCODE || 'ELEVE2026';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'eleve-store-v3.json');

// ============================================================================
// SERVER TYPES
// ============================================================================

type ProductionStage =
  | 'New Order'
  | 'Blank Sourcing'
  | 'Design & Mockup'
  | 'Printing'
  | 'Quality Check'
  | 'Ready to Ship';

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

interface StoreState {
  orders: Order[];
  materials: MaterialItem[];
  chats: ChatThread[];
}

// ============================================================================
// SEED DATA
// ============================================================================

function addDaysISO(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function createInitialState(): StoreState {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const orders: Order[] = [
    {
      id: 'ELV-101',
      customerName: 'Marco Santos',
      destination: 'Makati, PH',
      isInternational: false,
      itemName: 'Elevé V1 — Keffiyeh Boxy Tee',
      variant: 'Pitch Black',
      swatchHex: '#09090B',
      isCustom: false,
      sizeBreakdown: { XS: 0, S: 1, M: 2, L: 1, XL: 0 },
      quantity: 4,
      totalPricePhp: 5160,
      dueDate: addDaysISO(now, 4),
      stage: 'Printing',
      notes: '280GSM boxy fit; glow chest mark + lower hem print.',
      createdAt: addDaysISO(now, -2),
      updates: [
        {
          id: 'upd-101-1',
          stage: 'New Order',
          message: 'Order received from Elevé Storefront.',
          timestamp: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
        },
        {
          id: 'upd-101-2',
          stage: 'Printing',
          message: 'Screens aligned; printing Pitch Black batch now.',
          timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'ELV-102',
      customerName: 'Kenji Sato',
      destination: 'Tokyo, JP',
      isInternational: true,
      itemName: 'Elevé Collection — Essential Ash Tee',
      variant: 'Ash Grey',
      swatchHex: '#D4D4D8',
      isCustom: false,
      sizeBreakdown: { XS: 0, S: 0, M: 2, L: 2, XL: 0 },
      quantity: 4,
      totalPricePhp: 4760,
      dueDate: addDaysISO(now, 6),
      stage: 'Blank Sourcing',
      notes: 'International DHL express parcel.',
      createdAt: addDaysISO(now, -3),
      updates: [
        {
          id: 'upd-102-1',
          stage: 'Blank Sourcing',
          message: 'Verifying 260GSM Ash Grey stock in Legazpi City studio.',
          timestamp: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'ELV-103',
      customerName: 'Devon Brooks',
      destination: 'Los Angeles, US',
      isInternational: true,
      itemName: 'Elevé Collection — Ascension Tee',
      variant: 'Pitch Black',
      swatchHex: '#09090B',
      isCustom: true,
      sizeBreakdown: { XS: 0, S: 0, M: 0, L: 0, XL: 0 },
      quantity: 2,
      totalPricePhp: 2980,
      dueDate: addDaysISO(now, 2),
      stage: 'Design & Mockup',
      notes: 'Custom print placement approval.',
      createdAt: addDaysISO(now, -5),
      measurements: {
        unit: 'in',
        bust: '44.0',
        waist: '41.0',
        hip: '42.0',
        inseam: '—',
        length: '31.5',
        notes: 'Ascension beam graphic aligned 3.5 in below collar rib.',
        updatedAt: addDaysISO(now, -4),
      },
      updates: [
        {
          id: 'upd-103-1',
          stage: 'Design & Mockup',
          message: 'Mockup sizing adjusted for 31.5 in tee length.',
          timestamp: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'ELV-104',
      customerName: 'Chloe Reyes',
      destination: 'BGC, PH',
      isInternational: false,
      itemName: 'Elevé V1 — Lumen Skeleton Tee',
      variant: 'Pitch Black',
      swatchHex: '#09090B',
      isCustom: false,
      sizeBreakdown: { XS: 1, S: 1, M: 0, L: 0, XL: 0 },
      quantity: 2,
      totalPricePhp: 2780,
      dueDate: addDaysISO(now, 1),
      stage: 'Quality Check',
      notes: 'Inspect skeleton sternum print & Elevé woven neck tag.',
      createdAt: addDaysISO(now, -4),
      updates: [
        {
          id: 'upd-104-1',
          stage: 'Quality Check',
          message: 'Printing finished; inspecting stitches and print cure.',
          timestamp: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'ELV-105',
      customerName: 'Sofia Tan',
      destination: 'Cebu, PH',
      isInternational: false,
      itemName: 'Elevé V1 — Keffiyeh Boxy Tee',
      variant: 'Optic White',
      swatchHex: '#FFFFFF',
      isCustom: false,
      sizeBreakdown: { XS: 0, S: 2, M: 2, L: 1, XL: 0 },
      quantity: 5,
      totalPricePhp: 6450,
      dueDate: addDaysISO(now, 0),
      stage: 'Ready to Ship',
      notes: 'Packed in matte mailers; courier pickup booked.',
      createdAt: addDaysISO(now, -7),
      completedAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      updates: [
        {
          id: 'upd-105-1',
          stage: 'Ready to Ship',
          message: 'Passed QC and sealed for J&T Air Cargo dispatch.',
          timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        },
      ],
    },
  ];

  const materials: MaterialItem[] = [
    {
      id: 'MAT-01',
      sku: 'ELV-BLK-280',
      name: '280GSM Boxy Blank Tees (Pitch Black)',
      category: 'Blank Tees',
      unit: 'pcs',
      stock: 18,
      minThreshold: 30,
      supplier: 'Taytay Blanks Wholesale, PH',
      lastUpdated: today,
    },
    {
      id: 'MAT-02',
      sku: 'ELV-WHT-280',
      name: '280GSM Boxy Blank Tees (Optic White)',
      category: 'Blank Tees',
      unit: 'pcs',
      stock: 64,
      minThreshold: 25,
      supplier: 'Taytay Blanks Wholesale, PH',
      lastUpdated: today,
    },
    {
      id: 'MAT-03',
      sku: 'ELV-CHR-280',
      name: '280GSM Acid-Wash Blank Tees (Washed Charcoal)',
      category: 'Blank Tees',
      unit: 'pcs',
      stock: 42,
      minThreshold: 20,
      supplier: 'Valenzuela Apparel Blanks, PH',
      lastUpdated: today,
    },
    {
      id: 'MAT-04',
      sku: 'ELV-INK-DTF',
      name: 'Eleve V1 Neck & Care DTF Transfers',
      category: 'Print & Ink',
      unit: 'sheets',
      stock: 12,
      minThreshold: 25,
      supplier: 'Legazpi Print Supply',
      lastUpdated: today,
    },
    {
      id: 'MAT-05',
      sku: 'ELV-PKG-02',
      name: 'Matte Black Frosted Ziplock Mailers',
      category: 'Labels & Packaging',
      unit: 'pcs',
      stock: 55,
      minThreshold: 100,
      supplier: 'Pacific Pack PH',
      lastUpdated: today,
    },
  ];

  const chats: ChatThread[] = [
    {
      id: 'chat-cust-101',
      customerName: 'Marco Santos',
      location: 'Legazpi City, PH',
      productContext: 'Elevé V1 — Keffiyeh Boxy Tee (Pitch Black)',
      linkedOrderId: 'ELV-101',
      unread: true,
      messages: [
        {
          id: 'm-101-1',
          sender: 'customer',
          text: 'Hi! Ordered 4pcs of the Elevé V1 Keffiyeh Tee (ELV-101). When will it ship out?',
          timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        },
        {
          id: 'm-101-2',
          sender: 'owner',
          text: 'Hi Marco! Your Pitch Black tees are being prepared right now in our Legazpi City studio—we will dispatch once QC wraps up.',
          timestamp: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
        },
        {
          id: 'm-101-3',
          sender: 'customer',
          text: 'Awesome, appreciate the quick update!',
          timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'chat-cust-102',
      customerName: 'Kenji Sato',
      location: 'Tokyo, JP',
      productContext: 'Elevé Collection — Essential Ash Tee (Ash Grey)',
      linkedOrderId: 'ELV-102',
      unread: false,
      messages: [
        {
          id: 'm-102-1',
          sender: 'customer',
          text: 'Hello from Tokyo! Does the 260GSM Essential Ash Tee shrink after washing?',
          timestamp: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
        },
        {
          id: 'm-102-2',
          sender: 'owner',
          text: 'Hi Kenji! Our combed cotton jersey is pre-shrunk and enzyme washed, so shrinkage is under 2%.',
          timestamp: new Date(now.getTime() - 165 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];

  return { orders, materials, chats };
}

function loadState(): StoreState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoreState;
      if (
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.materials) &&
        Array.isArray(parsed.chats)
      ) {
        return parsed;
      }
    }
  } catch {
    // Fall back to clean seed
  }
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore filesystem errors in constrained environments
  }
}

// ============================================================================
// SERVER BOOTSTRAP
// ============================================================================

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  let state: StoreState = loadState();

  const ownerSessions = new Map<string, { mode: 'owner' | 'demo'; createdAt: number }>();
  const wsTokens = new WeakMap<WebSocket, string>();

  function getOwnerToken(req: Request): string {
    const headerToken = req.header('x-owner-token');
    if (headerToken) return headerToken.trim();
    const auth = req.header('authorization');
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      return auth.slice(7).trim();
    }
    return '';
  }

  function isValidOwnerToken(token?: string | null): boolean {
    if (!token) return false;
    return ownerSessions.has(token);
  }

  function requireOwner(req: Request, res: Response, next: NextFunction): void {
    if (!isValidOwnerToken(getOwnerToken(req))) {
      res.status(401).json({ error: 'Owner authentication required' });
      return;
    }
    next();
  }

  function toPublicOrderReceipt(o: Order) {
    return {
      id: o.id,
      itemName: o.itemName,
      variant: o.variant,
      quantity: o.quantity,
      totalPricePhp: o.totalPricePhp,
    };
  }

  function broadcastState() {
    saveState(state);
    const ownerMsg = JSON.stringify({ type: 'state:sync', payload: state });
    const publicMsg = JSON.stringify({ type: 'public:ping' });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const token = wsTokens.get(client);
        client.send(isValidOwnerToken(token) ? ownerMsg : publicMsg);
      }
    });
  }

  wss.on('connection', (ws, req) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://localhost');
      const token = reqUrl.searchParams.get('token') || '';
      if (isValidOwnerToken(token)) {
        wsTokens.set(ws, token);
        ws.send(JSON.stringify({ type: 'state:sync', payload: state }));
      } else {
        ws.send(JSON.stringify({ type: 'public:ping' }));
      }
    } catch {
      ws.send(JSON.stringify({ type: 'public:ping' }));
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string; token?: string };
        if (msg.type === 'auth') {
          if (msg.token && isValidOwnerToken(msg.token)) {
            wsTokens.set(ws, msg.token);
            ws.send(JSON.stringify({ type: 'state:sync', payload: state }));
          } else {
            wsTokens.delete(ws);
          }
        }
      } catch {
        // Ignore malformed WS payloads
      }
    });
  });

  // --------------------------------------------------------------------------
  // OWNER & DEMO AUTHENTICATION ROUTES
  // --------------------------------------------------------------------------

  app.post('/api/owner/login', (req: Request, res: Response) => {
    const { passcode } = (req.body || {}) as { passcode?: string };
    if (!passcode || passcode.trim() !== OWNER_PASSCODE) {
      res.status(401).json({ error: 'Invalid studio passcode' });
      return;
    }
    const token = crypto.randomUUID();
    ownerSessions.set(token, { mode: 'owner', createdAt: Date.now() });
    res.json({ token, mode: 'owner' });
  });

  app.post('/api/owner/demo-login', (_req: Request, res: Response) => {
    const token = crypto.randomUUID();
    ownerSessions.set(token, { mode: 'demo', createdAt: Date.now() });
    res.json({ token, mode: 'demo' });
  });

  app.post('/api/owner/logout', (req: Request, res: Response) => {
    const token = getOwnerToken(req);
    if (token) ownerSessions.delete(token);
    res.json({ ok: true });
  });

  // --------------------------------------------------------------------------
  // PUBLIC STOREFRONT ROUTES (SCOPED — NO PRIVATE ADMIN OR TRACKER DATA EXPOSED)
  // --------------------------------------------------------------------------

  app.get('/api/public/chats/:id', (req: Request, res: Response) => {
    const thread = state.chats.find((c) => c.id === req.params.id);
    if (!thread) {
      res.status(404).json({ error: 'Chat thread not found' });
      return;
    }
    res.json(thread);
  });

  // --------------------------------------------------------------------------
  // PROTECTED OWNER TRACKER ROUTES
  // --------------------------------------------------------------------------

  app.get('/api/owner/state', requireOwner, (_req: Request, res: Response) => {
    res.json(state);
  });

  app.get('/api/state', requireOwner, (_req: Request, res: Response) => {
    res.json(state);
  });

  // Create order (from Storefront Checkout OR authenticated Owner Tracker)
  app.post('/api/orders', (req: Request, res: Response) => {
    const body = req.body as Partial<Order> & { updateMessage?: string };
    if (!body.customerName || !body.itemName || !body.variant) {
      res.status(400).json({ error: 'customerName, itemName, and variant are required' });
      return;
    }

    const isOwner = isValidOwnerToken(getOwnerToken(req));
    const maxNum = state.orders.reduce((max, o) => {
      const match = o.id.match(/ELV-(\d+)/);
      const num = match ? parseInt(match[1], 10) : 100;
      return num > max ? num : max;
    }, 100);

    const newId = `ELV-${maxNum + 1}`;
    const nowIso = new Date().toISOString();
    const stage: ProductionStage = isOwner ? body.stage || 'New Order' : 'New Order';
    const quantity = Math.max(1, Number(body.quantity) || 1);

    const newOrder: Order = {
      id: newId,
      customerName: body.customerName.trim(),
      destination: (body.destination || 'Legazpi City, PH').trim(),
      isInternational: Boolean(body.isInternational),
      itemName: body.itemName.trim(),
      variant: body.variant.trim(),
      swatchHex: body.swatchHex || '#09090B',
      isCustom: isOwner ? Boolean(body.isCustom) : false,
      sizeBreakdown: body.sizeBreakdown || { XS: 0, S: 0, M: quantity, L: 0, XL: 0 },
      quantity,
      totalPricePhp: Number(body.totalPricePhp) || quantity * 1290,
      dueDate: body.dueDate || addDaysISO(new Date(), 7),
      stage,
      notes: (body.notes || '').trim(),
      createdAt: nowIso.split('T')[0],
      completedAt: stage === 'Ready to Ship' ? nowIso : undefined,
      measurements: isOwner ? body.measurements : undefined,
      updates: [
        {
          id: `upd-${Date.now()}`,
          stage,
          message: body.updateMessage || `Order ${newId} received by Legazpi City Studio.`,
          timestamp: nowIso,
        },
      ],
    };

    state.orders = [newOrder, ...state.orders];
    broadcastState();
    res.status(201).json(isOwner ? newOrder : toPublicOrderReceipt(newOrder));
  });

  // Update order (owner-only)
  app.patch('/api/orders/:id', requireOwner, (req: Request, res: Response) => {
    const id = req.params.id;
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const existing = state.orders[idx];
    const patch = req.body as Partial<Order> & {
      liveUpdateMessage?: string;
      clearMeasurements?: boolean;
    };

    const nextStage = patch.stage ?? existing.stage;
    const stageChanged = nextStage !== existing.stage;
    const nowIso = new Date().toISOString();

    const nextUpdates = [...(existing.updates || [])];
    if (patch.liveUpdateMessage && patch.liveUpdateMessage.trim()) {
      nextUpdates.push({
        id: `upd-${Date.now()}`,
        stage: nextStage,
        message: patch.liveUpdateMessage.trim(),
        timestamp: nowIso,
      });
    } else if (stageChanged) {
      nextUpdates.push({
        id: `upd-${Date.now()}`,
        stage: nextStage,
        message: `Stage updated to ${nextStage}.`,
        timestamp: nowIso,
      });
    }

    const completedAt =
      nextStage === 'Ready to Ship'
        ? existing.completedAt ?? nowIso
        : undefined;

    const updated: Order = {
      ...existing,
      ...patch,
      id: existing.id,
      stage: nextStage,
      completedAt,
      updates: nextUpdates,
      measurements: patch.clearMeasurements
        ? undefined
        : patch.measurements !== undefined
          ? patch.measurements
          : existing.measurements,
    };

    state.orders[idx] = updated;
    broadcastState();
    res.json(updated);
  });

  app.delete('/api/orders/:id', requireOwner, (req: Request, res: Response) => {
    const id = req.params.id;
    state.orders = state.orders.filter((o) => o.id !== id);
    broadcastState();
    res.json({ deleted: id });
  });

  // Materials CRUD (owner-only)
  app.post('/api/materials', requireOwner, (req: Request, res: Response) => {
    const body = req.body as Omit<MaterialItem, 'id' | 'lastUpdated'>;
    if (!body.name) {
      res.status(400).json({ error: 'Material name is required' });
      return;
    }
    const newItem: MaterialItem = {
      ...body,
      id: `MAT-${Date.now().toString().slice(-5)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    state.materials = [newItem, ...state.materials];
    broadcastState();
    res.status(201).json(newItem);
  });

  app.patch('/api/materials/:id', requireOwner, (req: Request, res: Response) => {
    const id = req.params.id;
    const idx = state.materials.findIndex((m) => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }
    const patch = req.body as Partial<MaterialItem> & { delta?: number };
    const current = state.materials[idx];
    const nextStock =
      typeof patch.delta === 'number'
        ? Math.max(0, current.stock + patch.delta)
        : typeof patch.stock === 'number'
          ? Math.max(0, patch.stock)
          : current.stock;

    const updated: MaterialItem = {
      ...current,
      ...patch,
      stock: nextStock,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    state.materials[idx] = updated;
    broadcastState();
    res.json(updated);
  });

  app.delete('/api/materials/:id', requireOwner, (req: Request, res: Response) => {
    const id = req.params.id;
    state.materials = state.materials.filter((m) => m.id !== id);
    broadcastState();
    res.json({ deleted: id });
  });

  // Customer-only Chat Threads (customers can create/reply; owner replies require owner auth)
  app.post('/api/chats', (req: Request, res: Response) => {
    const body = req.body as {
      id?: string;
      customerName: string;
      location?: string;
      productContext?: string;
      linkedOrderId?: string;
      initialMessage?: string;
      sender?: 'owner' | 'customer';
    };

    if (body.sender === 'owner' && !isValidOwnerToken(getOwnerToken(req))) {
      res.status(401).json({ error: 'Owner authentication required' });
      return;
    }

    if (!body.customerName?.trim()) {
      res.status(400).json({ error: 'customerName is required' });
      return;
    }

    if (body.id) {
      const existing = state.chats.find((c) => c.id === body.id);
      if (existing) {
        res.json(existing);
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const newThread: ChatThread = {
      id: body.id || `chat-${Date.now()}`,
      customerName: body.customerName.trim(),
      location: (body.location || 'Philippines').trim(),
      productContext: body.productContext,
      linkedOrderId: body.linkedOrderId,
      unread: body.sender !== 'owner',
      messages: body.initialMessage
        ? [
            {
              id: `msg-${Date.now()}`,
              sender: body.sender === 'owner' ? 'owner' : 'customer',
              text: body.initialMessage.trim(),
              timestamp: nowIso,
            },
          ]
        : [],
    };

    state.chats = [newThread, ...state.chats];
    broadcastState();
    res.status(201).json(newThread);
  });

  app.post('/api/chats/:id/messages', (req: Request, res: Response) => {
    const id = req.params.id;
    const thread = state.chats.find((c) => c.id === id);
    if (!thread) {
      res.status(404).json({ error: 'Chat thread not found' });
      return;
    }

    const { sender, text, productContext } = req.body as {
      sender: 'owner' | 'customer';
      text: string;
      productContext?: string;
    };

    if (sender === 'owner' && !isValidOwnerToken(getOwnerToken(req))) {
      res.status(401).json({ error: 'Owner authentication required' });
      return;
    }

    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: sender === 'owner' ? 'owner' : 'customer',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    thread.messages.push(msg);
    thread.unread = msg.sender === 'customer';
    if (productContext) thread.productContext = productContext;

    // Move thread to top
    state.chats = [thread, ...state.chats.filter((c) => c.id !== id)];
    broadcastState();
    res.status(201).json(msg);
  });

  app.patch('/api/chats/:id', requireOwner, (req: Request, res: Response) => {
    const id = req.params.id;
    const thread = state.chats.find((c) => c.id === id);
    if (!thread) {
      res.status(404).json({ error: 'Chat thread not found' });
      return;
    }
    const { unread, linkedOrderId } = req.body as {
      unread?: boolean;
      linkedOrderId?: string;
    };
    if (typeof unread === 'boolean') thread.unread = unread;
    if (linkedOrderId !== undefined) thread.linkedOrderId = linkedOrderId || undefined;
    broadcastState();
    res.json(thread);
  });

  app.post('/api/reset', requireOwner, (_req: Request, res: Response) => {
    state = createInitialState();
    broadcastState();
    res.json(state);
  });

  // --------------------------------------------------------------------------
  // VITE DEV MIDDLEWARE / PRODUCTION STATIC ASSETS
  // --------------------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Eleve Store & Tracker running on port ${PORT}`);
  });
}

startServer();
