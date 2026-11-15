# Elevé — Streetwear Storefront & Production Tracker

A full-stack e-commerce storefront and real-time production tracking dashboard built for **Elevé**, a Manila-based t-shirt brand shipping locally across the Philippines and internationally.

> **Live Interactive App:** [Open Hosted App](https://ais-pre-cpq4d7ioyuzgsme5lljzz5-581314554413.asia-east1.run.app)

---

## Important Note on GitHub vs. Running the App

GitHub stores the source code for inspection and download, while the interactive storefront and WebSocket-powered tracker require a running Node.js server. You can evaluate the app in either of two ways:

1. **Use the Live App Link above** to interact with the storefront, place test orders, and test real-time updates immediately in your browser.
2. **Clone and run locally** using the instructions below.

---

## Features & How to Test

### 1. Public Storefront
- **Drop 01 Collection (4 Styles)**:
  - *Elevé V1 — Keffiyeh Heavyweight Tee* (`₱1,290`)
  - *Elevé V1 — Lumen Skeleton Tee* (`₱1,390`)
  - *Elevé Collection — Ascension Tee* (`₱1,490`)
  - *Elevé Collection — Essential Ash Tee* (`₱1,190`)
- **Color & Size Selection**: Pick colorways and sizes (`XS`–`XL`), inspect product details, add items to the **Bag**, and submit a test checkout. Orders sync automatically to the Owner Tracker.
- **Real-Time Order Tracker**: Look up sample order `ELV-101` (or your newly placed order ID) to watch live production stage progress and studio status messages.
- **Ask Studio (Customer Chat)**: Open **Ask Studio** to send messages that appear immediately inside the Owner Tracker inbox.

### 2. Owner Production Tracker
Click **Owner Tracker** in the top navigation bar (or **Owner Production Tracker** in the footer) to switch to the internal studio workspace:
- **Overview Metrics**: `Total Active Orders`, `Orders in Production`, `Pending Materials`, and `Completed This Week`.
- **6-Stage Kanban & Order Table**: Drag and drop orders across `New Order`, `Blank Sourcing`, `Design & Mockup`, `Printing`, `Quality Check`, and `Ready to Ship`, or push live customer status updates.
- **Customer Chat Inbox**: Reply to storefront inquiries in real time and link conversations to order IDs.
- **Blanks & Stock Inventory**: Track blank shirts, DTF transfers, and mailers with low-stock alerts and quick `+1` / `-1` / `+5` / `-5` adjustments.
- **Custom Measurements**: Log `Bust/Chest`, `Waist`, `Hip`, `Inseam`, and `Length` specs (`in` / `cm`) tied to custom orders.

---

## Run Locally

### Prerequisites
- **Node.js** `22.18+` (for production `npm start`), or **Node.js** `18+` (for development `npm run dev`)
- **npm**

### Setup & Launch

```bash
# 1. Clone the repository
git clone <your-github-repo-url>
cd <repo-folder>

# 2. Install dependencies
npm install

# 3. Start the full-stack development server (Express + Vite + WebSockets)
npm run dev
```

Open **`http://localhost:3000`** in your browser.

*(Optional)* To run a production build locally on Node 22.18+:

```bash
npm run build
npm start
```

---

## Hosting on Render (Free Web Service)

This repository includes a `render.yaml` configuration for **Render**:

1. Push this project to your GitHub repository.
2. In **Render**, click **New + → Web Service** (or **New + → Blueprint** to auto-detect `render.yaml`).
3. Connect your GitHub repository and verify these settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Click **Deploy Web Service**. Render will automatically assign a public `https://....onrender.com` URL.

*(Note: On Render's free tier, the service sleeps after 15 minutes of inactivity and wakes up in ~30–50 seconds on first visit. Runtime orders/chats reset if the container restarts, automatically re-seeding the sample Elevé orders and stock.)*

---

## Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend & Real-Time Sync:** Node.js, Express, `ws` (WebSockets)
- **Persistence:** JSON store (`data/eleve-store-v2.json`, auto-seeded on first launch)
