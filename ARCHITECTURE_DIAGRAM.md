# 🏗️ Architecture Diagram - Sales Invoice History

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPS / Docker Host                        │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   Frontend     │  │    Backend     │  │      MySQL       │  │
│  │   Container    │  │   Container    │  │    Container     │  │
│  │                │  │                │  │                  │  │
│  │  React App     │  │  Node.js API   │  │  Database        │  │
│  │  Port: 3000    │  │  Port: 5000    │  │  Port: 3306      │  │
│  │                │  │                │  │                  │  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘  │
│           │                   │                    │             │
│           └───────────────────┴────────────────────┘             │
│                          Docker Network                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
                    ┌───────────────────────┐
                    │   Accurate Online     │
                    │   API                 │
                    │                       │
                    │  - Customer API       │
                    │  - Sales Order API    │
                    └───────────────────────┘
```

---

## Data Flow - Sales Invoice History

```
┌──────────────┐
│   Browser    │
│   (User)     │
└──────┬───────┘
       │
       │ 1. Open Sales Orders Page
       ▼
┌──────────────────────────────────────┐
│   Frontend (React)                   │
│                                      │
│   SalesOrdersPage.jsx                │
│   ├─ Fetch sales orders              │
│   └─ For each order with status      │
│      "Sebagian diproses":            │
│      └─ Render SalesInvoiceHistory   │
│         component                    │
└──────┬───────────────────────────────┘
       │
       │ 2. GET /api/sales-invoice-history/so/:soId
       ▼
┌──────────────────────────────────────┐
│   Backend (Node.js)                  │
│                                      │
│   SalesInvoiceHistoryController      │
│   └─ getBySoId()                     │
│      │                                │
│      ▼                                │
│   SalesInvoiceHistory Model          │
│   └─ Query database                  │
└──────┬───────────────────────────────┘
       │
       │ 3. SELECT * FROM sales_invoice_history
       ▼
┌──────────────────────────────────────┐
│   MySQL Database                     │
│                                      │
│   sales_invoice_history table        │
│   ├─ id                              │
│   ├─ invoice_number                  │
│   ├─ modified_by                     │
│   ├─ description                     │
│   └─ created_at                      │
└──────┬───────────────────────────────┘
       │
       │ 4. Return history data
       ▼
┌──────────────────────────────────────┐
│   Frontend                           │
│                                      │
│   Display history:                   │
│   ┌────────────────────────────────┐ │
│   │ 👤 Buat Faktur Penjualan       │ │
│   │    SI.2026.04.00674            │ │
│   │    oleh Nur gudang admin       │ │
│   │ 📅 10 April 2026 14:15         │ │
│   └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## Sync Process Flow

```
┌──────────────┐
│   Admin      │
│   (User)     │
└──────┬───────┘
       │
       │ 1. Click "Sync" button
       ▼
┌──────────────────────────────────────┐
│   Frontend                           │
│                                      │
│   POST /api/sales-invoice-history/   │
│        sync                          │
│   {                                  │
│     startDate: "2026-03-01",         │
│     endDate: "2026-04-20"            │
│   }                                  │
└──────┬───────────────────────────────┘
       │
       │ 2. Sync request
       ▼
┌──────────────────────────────────────┐
│   Backend                            │
│                                      │
│   CustomerService.syncInvoiceHistory │
│   │                                  │
│   ├─ 3. GET /api/customer/list.do   │
│   │   ▼                              │
│   │   ┌──────────────────────────┐  │
│   │   │  Accurate Online API     │  │
│   │   │  Return: Customer list   │  │
│   │   └──────────────────────────┘  │
│   │                                  │
│   ├─ 4. For each customer:          │
│   │   └─ Find related sales orders  │
│   │                                  │
│   ├─ 5. GET /api/sales-order/       │
│   │        detail.do                │
│   │   ▼                              │
│   │   ┌──────────────────────────┐  │
│   │   │  Accurate Online API     │  │
│   │   │  Return: SO detail with  │  │
│   │   │  modifiedBy info         │  │
│   │   └──────────────────────────┘  │
│   │                                  │
│   └─ 6. Save to database            │
│      ▼                               │
│   SalesInvoiceHistory.create()      │
└──────┬───────────────────────────────┘
       │
       │ 7. INSERT INTO sales_invoice_history
       ▼
┌──────────────────────────────────────┐
│   MySQL Database                     │
│                                      │
│   New records created:               │
│   ├─ Invoice number                  │
│   ├─ Modified by (from Accurate)     │
│   ├─ Status                          │
│   └─ Timestamp                       │
└──────┬───────────────────────────────┘
       │
       │ 8. Return sync result
       ▼
┌──────────────────────────────────────┐
│   Frontend                           │
│                                      │
│   Show success message:              │
│   "Synced 45 records"                │
└──────────────────────────────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│  sales_orders                                               │
├─────────────────────────────────────────────────────────────┤
│  id (PK)                                                    │
│  so_id (Accurate ID)                                        │
│  nomor_so                                                   │
│  tanggal_so                                                 │
│  customer_id                                                │
│  nama_pelanggan                                             │
│  status                                                     │
│  total_amount                                               │
│  ...                                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1:N relationship
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  sales_invoice_history                                      │
├─────────────────────────────────────────────────────────────┤
│  id (PK)                                                    │
│  sales_order_id (FK) ───────────────────────────────────┐   │
│  so_id (Accurate ID)                                    │   │
│  invoice_number                                         │   │
│  invoice_date                                           │   │
│  action_type (created, updated, status_changed)         │   │
│  status                                                 │   │
│  modified_by ◄── From Accurate API                      │   │
│  modified_by_id                                         │   │
│  description                                            │   │
│  accurate_data (JSON) ◄── Full response from Accurate   │   │
│  created_at                                             │   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  v_sales_invoice_history (VIEW)                             │
├─────────────────────────────────────────────────────────────┤
│  Joins sales_invoice_history + sales_orders                 │
│  For easy querying with sales order details                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy (Frontend)

```
App.jsx
│
├─ DashboardLayout.jsx
│  │
│  └─ SalesOrdersPage.jsx
│     │
│     ├─ Search & Filter Components
│     │
│     ├─ Sales Orders Table
│     │  │
│     │  └─ For each row:
│     │     │
│     │     ├─ Order Number
│     │     ├─ Customer Name
│     │     ├─ Date
│     │     ├─ Amount
│     │     │
│     │     └─ Status Column
│     │        │
│     │        ├─ Status Badge
│     │        │
│     │        └─ SalesInvoiceHistory.jsx ◄── NEW!
│     │           │
│     │           ├─ Only shows if status = "Sebagian diproses"
│     │           │
│     │           ├─ Fetch history from API
│     │           │
│     │           └─ Display:
│     │              ├─ 👤 Modified by name
│     │              ├─ 📄 Invoice number
│     │              └─ 📅 Date/time
│     │
│     └─ Pagination
│
└─ Other pages...
```

---

## API Endpoints Structure

```
/api
│
├─ /auth
│  ├─ POST /login
│  └─ POST /logout
│
├─ /sales-orders
│  ├─ GET  /                    (list all)
│  ├─ GET  /:id                 (get by ID) ◄── Now includes history
│  ├─ POST /sync                (sync from Accurate)
│  └─ ...
│
└─ /sales-invoice-history       ◄── NEW!
   ├─ GET  /order/:orderId      (by internal order ID)
   ├─ GET  /so/:soId            (by Accurate SO ID)
   ├─ GET  /recent              (recent history)
   ├─ GET  /status/:status      (by status)
   └─ POST /sync                (sync from Accurate)
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Server                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Docker Compose                      │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Frontend    │  │   Backend    │  │    MySQL    │ │ │
│  │  │  (Nginx)     │  │  (Node.js)   │  │             │ │ │
│  │  │              │  │              │  │             │ │ │
│  │  │  Volume:     │  │  Volume:     │  │  Volume:    │ │ │
│  │  │  - /app      │  │  - /app      │  │  - /var/lib │ │ │
│  │  │              │  │  - /logs     │  │    /mysql   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │                                                         │ │
│  │  Network: iware-network                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Host Volumes                        │ │
│  │                                                         │ │
│  │  - ./backend:/app/backend                              │ │
│  │  - ./frontend/build:/usr/share/nginx/html              │ │
│  │  - ./mysql-data:/var/lib/mysql                         │ │
│  │  - ./logs:/app/logs                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Process Flow

```
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │
       │ 1. git push
       ▼
┌──────────────────┐
│  Git Repository  │
└──────┬───────────┘
       │
       │ 2. git pull
       ▼
┌─────────────────────────────────────────────────────────────┐
│  VPS Server                                                 │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Deployment Script (deploy.sh / deploy.bat)           ││
│  │                                                        ││
│  │  Step 1: Backup Database                              ││
│  │  └─ mysqldump → backup_YYYYMMDD.sql                   ││
│  │                                                        ││
│  │  Step 2: Pull Code                                    ││
│  │  └─ git pull origin main                              ││
│  │                                                        ││
│  │  Step 3: Database Migration                           ││
│  │  └─ Run add-sales-invoice-history.sql                 ││
│  │                                                        ││
│  │  Step 4: Rebuild Containers                           ││
│  │  ├─ docker-compose down                               ││
│  │  ├─ docker-compose build --no-cache                   ││
│  │  └─ docker-compose up -d                              ││
│  │                                                        ││
│  │  Step 5: Verification                                 ││
│  │  ├─ Check container status                            ││
│  │  ├─ Health check API                                  ││
│  │  └─ Check logs                                        ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
       │
       │ 3. Deployment complete
       ▼
┌──────────────────┐
│  Running App     │
│  with new        │
│  feature         │
└──────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS (SSL/TLS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firewall / VPS                         │
│                                                             │
│  Allowed Ports:                                             │
│  - 80 (HTTP → redirect to HTTPS)                            │
│  - 443 (HTTPS)                                              │
│  - 22 (SSH - restricted IP)                                 │
│                                                             │
│  Blocked:                                                   │
│  - 3306 (MySQL - internal only)                             │
│  - 5000 (Backend - internal only)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                    (Internal)                               │
│                                                             │
│  Frontend ←→ Backend ←→ MySQL                               │
│  (3000)      (5000)      (3306)                             │
│                                                             │
│  Authentication:                                            │
│  - JWT tokens                                               │
│  - Bcrypt password hashing                                  │
│  - Rate limiting                                            │
│                                                             │
│  Database:                                                  │
│  - User credentials in .env                                 │
│  - Not exposed to internet                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Frontend    │  │   Backend    │  │    MySQL     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │             │
│         │ Console logs    │ Winston logger   │ MySQL logs  │
│         ▼                 ▼                  ▼             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Log Files                         │  │
│  │                                                      │  │
│  │  - backend/logs/all-YYYY-MM-DD.log                  │  │
│  │  - backend/logs/error-YYYY-MM-DD.log                │  │
│  │  - backend/logs/accurate-YYYY-MM-DD.log             │  │
│  │  - backend/logs/http-YYYY-MM-DD.log                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Monitoring:                                                │
│  - docker stats (resource usage)                            │
│  - docker-compose logs (real-time logs)                     │
│  - Health check endpoint (/health)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Legend

```
┌─────────┐
│  Box    │  = Component / Container / System
└─────────┘

   │
   ▼         = Data flow / Process flow

  ◄──        = Data source / Reference

  ←→         = Bidirectional communication

  (PK)       = Primary Key
  (FK)       = Foreign Key
```

---

**Use these diagrams to understand the system architecture and data flow! 📊**
