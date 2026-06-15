# InvenTrack — Complete Project Walkthrough & Interview Preparation

> **GitHub**: https://github.com/sourabhvishwakarma1/Inventory-and-Order-Management-System  
> **Live Frontend**: https://inventory-frontend-5o3b.onrender.com  
> **Live Backend**: https://inventory-backend-jrdk.onrender.com  
> **API Docs**: https://inventory-backend-jrdk.onrender.com/docs  
> **Docker Hub**: https://hub.docker.com/r/sourabhvishwakarma/inventory-backend

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Step-by-Step: How the Project Was Built](#3-step-by-step-how-the-project-was-built)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
6. [Docker & Containerization](#6-docker--containerization)
7. [Deployment](#7-deployment)
8. [Interview Questions & Answers](#8-interview-questions--answers)

---

## 1. Project Overview

**InvenTrack** is a full-stack **Inventory & Order Management System** that allows businesses to:

- **Manage Products** — Add, edit, delete products with auto-generated SKUs, pricing in ₹ (INR), and real-time stock tracking
- **Manage Customers** — CRUD operations with unique email enforcement
- **Place Orders** — Create multi-item orders with automatic stock validation and reduction
- **Track Inventory** — Dashboard with total revenue, low-stock alerts, order statistics

### Key Business Rules Implemented

| Rule | Implementation |
|:---|:---|
| Unique product SKUs | Database `UNIQUE` constraint + backend validation |
| Custom or Auto-generated SKU | User can enter a unique SKU, or leave blank → backend generates `PRD-001`, `PRD-002`, etc. |
| Unique customer emails | Database `UNIQUE` constraint + backend validation |
| Stock validation before order | All items checked atomically before any stock is reduced |
| Auto stock reduction | Stock decreases when order is placed |
| Stock restoration | Stock restores when order is cancelled or deleted |
| Insufficient stock rejection | Entire order rejected if ANY item has insufficient stock |

---

## 2. Architecture & Tech Stack

### System Architecture

```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │       │                     │
│   React Frontend    │──────▶│   FastAPI Backend    │──────▶│   PostgreSQL DB     │
│   (Vite + Nginx)    │ HTTP  │   (Python 3.11)     │  SQL  │   (v15 Alpine)      │
│                     │       │                     │       │                     │
│   Port: 3001 (80)   │       │   Port: 8001 (8000) │       │   Port: 5432        │
│                     │       │                     │       │                     │
└─────────────────────┘       └─────────────────────┘       └─────────────────────┘
        ▲                             ▲                             ▲
        │                             │                             │
        └─────────────────────────────┴─────────────────────────────┘
                            Docker Compose Network
```

### Tech Stack Breakdown

| Layer | Technology | Why This Choice |
|:---|:---|:---|
| **Backend Framework** | FastAPI | Async support, auto-generated Swagger docs, Pydantic validation |
| **ORM** | SQLAlchemy 2.0 | Mature, supports complex queries, model relationships |
| **Database** | PostgreSQL 15 | ACID compliance, ENUM types, robust for inventory |
| **Frontend Framework** | React 18 | Component-based, virtual DOM, huge ecosystem |
| **Build Tool** | Vite | 10x faster than webpack, native ESM support |
| **HTTP Client** | Axios | Interceptors, auto JSON parsing, error handling |
| **Containerization** | Docker + Compose | Reproducible environments, multi-service orchestration |
| **Frontend Server** | Nginx | Static file serving, gzip compression, SPA routing |
| **Validation** | Pydantic v2 | Type-safe request/response schemas |

### Project File Structure

```
Project/
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # Environment variables (Pydantic Settings)
│   │   │   └── database.py       # SQLAlchemy engine, session, Base
│   │   ├── models/
│   │   │   ├── product.py        # Product table definition
│   │   │   ├── customer.py       # Customer table definition
│   │   │   └── order.py          # Order + OrderItem tables, OrderStatus enum
│   │   ├── schemas/
│   │   │   ├── product.py        # ProductCreate, ProductUpdate, ProductResponse
│   │   │   ├── customer.py       # CustomerCreate, CustomerUpdate, CustomerResponse
│   │   │   └── order.py          # OrderCreate (with items), OrderResponse
│   │   ├── routers/
│   │   │   ├── products.py       # GET/POST/PUT/DELETE /api/products
│   │   │   ├── customers.py      # GET/POST/PUT/DELETE /api/customers
│   │   │   └── orders.py         # GET/POST/PUT/DELETE /api/orders
│   │   ├── services/
│   │   │   ├── product_service.py  # Auto-SKU generation, CRUD logic
│   │   │   ├── customer_service.py # Email uniqueness, CRUD logic
│   │   │   └── order_service.py    # Stock validation, atomic operations
│   │   ├── main.py               # FastAPI app, CORS, auto-seed
│   │   └── seed.py               # Sample data (Indian names, INR prices)
│   ├── Dockerfile                # Python 3.11 slim image
│   ├── requirements.txt          # Python dependencies
│   └── .python-version           # Pins Python 3.11 for Render
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios instance + API modules
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── Modal.jsx         # Reusable modal component
│   │   │   └── Toast.jsx         # Notification toast system
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Stats cards, revenue, recent orders
│   │   │   ├── Products.jsx      # Product table, create/edit/delete
│   │   │   ├── Customers.jsx     # Customer table, create/edit/delete
│   │   │   └── Orders.jsx        # Order table, create with items
│   │   ├── App.jsx               # React Router setup
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Complete dark theme design system
│   ├── Dockerfile                # Multi-stage build (Node → Nginx)
│   ├── nginx.conf                # SPA routing configuration
│   └── vite.config.js            # Vite configuration
│
├── docker-compose.yml            # Orchestrates db + backend + frontend
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template for .env
└── README.md                     # Project documentation
```

---

## 3. Step-by-Step: How the Project Was Built

### Step 1: Project Planning & Setup

**What was done:**
- Created the root project directory
- Planned the database schema (4 tables: products, customers, orders, order_items)
- Defined API endpoints following REST conventions
- Chose the tech stack (FastAPI + React + PostgreSQL + Docker)

**Key Decision:** Used a **Service Layer pattern** (routers → services → models) to separate HTTP concerns from business logic. This makes the code testable and maintainable.

---

### Step 2: Database Design

**4 Tables were designed:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   products   │     │  customers   │     │    orders     │     │ order_items  │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ name         │     │ customer_id  │────▶│ order_id     │──▶ orders.id
│ sku (UNIQUE) │     │ email (UNIQ) │     │ status (ENUM)│     │ product_id   │──▶ products.id
│ description  │     │ phone        │     │ total_amount │     │ quantity     │
│ price        │     │ address      │     │ order_date   │     │ unit_price   │
│ stock_qty    │     │ created_at   │     │ created_at   │     │ subtotal     │
│ category     │     │ updated_at   │     │ updated_at   │     └──────────────┘
│ created_at   │     └──────────────┘     └──────────────┘
│ updated_at   │
└──────────────┘
```

**Relationships:**
- `Order` → `Customer`: Many-to-One (each order belongs to one customer)
- `Order` → `OrderItem`: One-to-Many (each order can have multiple items)
- `OrderItem` → `Product`: Many-to-One (each item references a product)
- Cascade delete: Deleting an order deletes its order items

---

### Step 3: Backend — Core Setup

**File: `backend/app/core/config.py`**

```python
class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://...")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    APP_NAME: str = "Inventory & Order Management System"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
```

**Why Pydantic Settings?** It automatically reads from environment variables and `.env` files, with type validation. No hardcoded credentials.

**File: `backend/app/core/database.py`**

```python
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db        # Provide session to the request
    finally:
        db.close()      # Always close, even on errors
```

**Why `yield` in `get_db()`?** This is a FastAPI **dependency injection** pattern. The `yield` makes it a generator — FastAPI calls `next()` to get the session, and after the request completes, it runs the `finally` block to close it. This prevents **database connection leaks**.

---

### Step 4: Backend — Models (SQLAlchemy)

**Product Model** (`backend/app/models/product.py`):

```python
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)  # Indexed for fast lookups
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

**Key Design Choices:**
- `sku` has `unique=True` + `index=True` → enforced at DB level AND fast lookup
- `created_at` uses `lambda` (not `datetime.now()`) → prevents all rows getting the same timestamp (the lambda is called each time a new row is created)

**Order Model** (`backend/app/models/order.py`):

```python
class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
```

**Why `str, enum.Enum`?** Inheriting from both `str` and `Enum` makes the status value JSON-serializable. Without `str`, FastAPI would serialize it as `OrderStatus.PENDING` instead of `"pending"`.

**Why `cascade="all, delete-orphan"`?** When an order is deleted, its order items are automatically deleted too. Without this, you'd have orphaned rows in the `order_items` table.

---

### Step 5: Backend — Schemas (Pydantic)

```python
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)   # Optional = auto-generated
    price: float = Field(..., gt=0)                      # Must be > 0
    stock_quantity: int = Field(..., ge=0)                # Must be >= 0
```

**Why separate Create/Update/Response schemas?**
- `ProductCreate` — What the client sends when creating (SKU is optional)
- `ProductUpdate` — All fields optional (partial update)
- `ProductResponse` — Includes `id`, `created_at`, `updated_at` (server-generated fields)

This follows the **DTO (Data Transfer Object)** pattern — you never expose internal model details directly.

---

### Step 6: Backend — Services (Business Logic)

**Auto-SKU Generation** (`backend/app/services/product_service.py`):

```python
def _generate_sku(db: Session) -> str:
    last = db.query(Product).filter(Product.sku.like("PRD-%")).order_by(Product.sku.desc()).first()
    if last and last.sku.startswith("PRD-"):
        num = int(last.sku.split("-")[1]) + 1
    else:
        num = 1
    while True:
        sku = f"PRD-{num:03d}"     # Format: PRD-001, PRD-002, etc.
        existing = db.query(Product).filter(Product.sku == sku).first()
        if not existing:
            return sku
        num += 1
```

**How it works:**
1. Find the highest existing `PRD-XXX` SKU
2. Increment by 1
3. Check for collision (edge case safety)
4. Return the unique SKU

**Order Creation — Atomic Stock Management** (`backend/app/services/order_service.py`):

```python
def create_order(db, order_data):
    # Phase 1: VALIDATE all items (no changes yet)
    insufficient_stock = []
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock_quantity < item.quantity:
            insufficient_stock.append({...})
    
    # Phase 2: REJECT if ANY item fails
    if insufficient_stock:
        raise HTTPException(status_code=400, detail={...})
    
    # Phase 3: CREATE order and REDUCE stock (only if all valid)
    order = Order(customer_id=..., total_amount=...)
    db.add(order)
    db.flush()       # Get order.id without committing
    
    for item_data in order_items_data:
        item_data["product"].stock_quantity -= item_data["quantity"]
    
    db.commit()      # All-or-nothing transaction
```

**Why is this atomic?**
- All validation happens BEFORE any stock modification
- `db.flush()` assigns the order ID without committing
- `db.commit()` persists everything in ONE transaction
- If anything fails between flush and commit, SQLAlchemy rolls back automatically

---

### Step 7: Backend — Routers (API Endpoints)

```python
router = APIRouter(prefix="/api/products", tags=["Products"])

@router.post("", status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, product)
```

**Key patterns:**
- `APIRouter(prefix="/api/products")` — Groups related endpoints
- `Depends(get_db)` — Dependency injection for database session
- `status_code=201` — Proper HTTP status for resource creation
- Thin routers — Delegate to service layer for business logic

---

### Step 8: Frontend — React Setup

**API Client** (`frontend/src/api/client.js`):

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const productAPI = {
    getAll: (params = {}) => api.get('/api/products', { params }),
    create: (data) => api.post('/api/products', data),
    update: (id, data) => api.put(`/api/products/${id}`, data),
    delete: (id) => api.delete(`/api/products/${id}`),
};
```

**Why `import.meta.env.VITE_API_URL`?** Vite injects environment variables prefixed with `VITE_` at **build time**. This means the value is baked into the JavaScript bundle. That's why it must be set as a build arg in Docker, not a runtime env var.

**Component Architecture:**

```
App.jsx
├── Sidebar.jsx         (Navigation)
├── Toast.jsx           (Global notification context)
├── Modal.jsx           (Reusable modal wrapper)
└── Pages/
    ├── Dashboard.jsx   (Stats cards + recent orders)
    ├── Products.jsx    (Table + CRUD modals)
    ├── Customers.jsx   (Table + CRUD modals)
    └── Orders.jsx      (Table + Create modal with product selection)
```

---

### Step 9: Frontend — State Management Pattern

Each page follows the same pattern:

```javascript
export default function Products() {
    // 1. State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyProduct);
    const [modalOpen, setModalOpen] = useState(false);

    // 2. Data Loading
    useEffect(() => { loadProducts(); }, []);

    async function loadProducts() {
        setLoading(true);
        const res = await productAPI.getAll();
        setProducts(res.data);
        setLoading(false);
    }

    // 3. CRUD Operations
    async function handleSubmit(e) {
        e.preventDefault();
        if (editingProduct) {
            await productAPI.update(editingProduct.id, data);
        } else {
            await productAPI.create(data);
        }
        setModalOpen(false);
        loadProducts();     // Refresh list
    }

    // 4. Render (table + modal)
    return (<div>...</div>);
}
```

**Why this pattern?** No external state management (Redux/Zustand) needed — each page manages its own data. The API client handles HTTP, and `loadProducts()` refreshes the list after any mutation. Simple and effective for this scale.

---

### Step 10: Docker Containerization

**Backend Dockerfile:**

```dockerfile
FROM python:3.11-slim                # Lightweight Python image (~150MB vs ~900MB full)
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # --no-cache-dir reduces image size
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile (Multi-Stage Build):**

```dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                            # Deterministic install (uses lockfile)
COPY . .
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build                     # Output: /app/dist/

# Stage 2: Serve with Nginx
FROM nginx:alpine                     # Tiny image (~40MB)
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why multi-stage?**
- Stage 1 has Node.js + npm + all dev dependencies (~500MB)
- Stage 2 only has Nginx + the built static files (~40MB)
- Final image is **~90% smaller** — faster to push, pull, and deploy

**Docker Compose orchestration:**

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:                     # Backend waits for DB to be ready
      test: ["CMD-SHELL", "pg_isready -U postgres"]
    volumes:
      - postgres_data:/var/lib/postgresql/data    # Data persists across restarts

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/inventory_db
    depends_on:
      db:
        condition: service_healthy   # Only start after DB is healthy

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:8001    # Baked into JS at build time
    depends_on:
      - backend
```

**Key Docker Compose concepts:**
- `depends_on + service_healthy` → prevents "database not ready" errors
- Named volume `postgres_data` → database survives container restarts
- `docker-compose down` keeps data, `docker-compose down -v` wipes it
- Services communicate via container names (e.g., `db:5432`)

---

### Step 11: Deployment to Render

**Backend (Render Web Service):**
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- `.python-version` file pins Python 3.11 (Render defaults to 3.14 which breaks pydantic-core)
- Auto-seed: `main.py` calls `seed()` on startup if DB is empty

**Frontend (Render Static Site):**
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Publish directory: `dist`
- `VITE_API_URL` env var points to backend URL
- Rewrite rule `/* → /index.html` for SPA client-side routing

**Database (Render PostgreSQL):**
- Free tier, internal URL used by backend

---

## 4. Backend Deep Dive

### Request Flow

```
Client Request
    ↓
FastAPI Router (URL matching, parameter extraction)
    ↓
Pydantic Schema (request body validation)
    ↓
Service Layer (business logic, DB queries)
    ↓
SQLAlchemy Model (ORM ↔ Database)
    ↓
Pydantic Schema (response serialization)
    ↓
JSON Response
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,   # ["https://frontend.onrender.com"]
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, PUT, DELETE
    allow_headers=["*"],       # Content-Type, Authorization, etc.
)
```

**Why CORS?** The frontend (port 3001) and backend (port 8001) are on different origins. Browsers block cross-origin requests by default. CORS headers tell the browser "this origin is allowed".

### Error Handling

```python
# Insufficient stock → 400
raise HTTPException(status_code=400, detail={
    "message": "Insufficient stock for one or more products",
    "insufficient_items": [{"product_name": "...", "requested": 5, "available": 2}]
})

# Not found → 404
raise HTTPException(status_code=404, detail="Product not found")

# Duplicate SKU → 400
raise HTTPException(status_code=400, detail="Product with SKU 'XYZ' already exists")
```

---

## 5. Frontend Deep Dive

### Routing

```jsx
// App.jsx
<Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/products" element={<Products />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/orders" element={<Orders />} />
</Routes>
```

### Design System (CSS)

The entire UI uses a custom dark theme defined in `index.css`:
- CSS custom properties (variables) for consistent theming
- Glassmorphism effects (`backdrop-filter: blur`)
- Responsive grid layout
- Smooth animations and transitions
- No CSS framework — pure vanilla CSS

### Toast Notification System

```jsx
// Context-based toast system
const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);   // addToast function
}

// Usage in any component:
addToast('Product created successfully');         // Green success
addToast('Insufficient stock', 'error');          // Red error
```

---

## 6. Docker & Containerization

### Common Commands

```bash
# Start everything
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Stop (keep data)
docker-compose down

# Stop and wipe database
docker-compose down -v

# Rebuild single service
docker-compose up --build backend

# Enter a container
docker-compose exec backend bash
```

### How Services Communicate

```
Frontend Container (Nginx:80) ──[http://localhost:8001]──▶ Host Machine ──[port 8001→8000]──▶ Backend Container (Uvicorn:8000)
                                                                                                        │
Backend Container ──[postgresql://postgres:postgres@db:5432/inventory_db]──▶ DB Container (PostgreSQL:5432)
```

- Frontend → Backend: Through the **host machine** (port mapping 8001:8000)
- Backend → Database: Through **Docker's internal network** (using service name `db`)

---

## 7. Deployment

### Architecture on Render

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Static     │     │   Web Service    │     │   PostgreSQL    │
│  Site       │────▶│                  │────▶│                 │
│             │HTTP │                  │ SQL │                 │
│  React App  │     │  FastAPI + Uvi   │     │  Free Tier DB   │
│  (Always On)│     │  (Sleeps 15min)  │     │  (90-day limit) │
└─────────────┘     └──────────────────┘     └─────────────────┘
   Render CDN          Render Compute           Render DB
```

---

## 8. Interview Questions & Answers

### Architecture & Design

---

**Q1: Why did you choose FastAPI over Flask or Django?**

**A:** FastAPI was chosen for several reasons:
1. **Auto-generated API documentation** — Swagger UI at `/docs` comes free, which is great for testing and demonstration
2. **Pydantic integration** — Request validation is built-in. Invalid data is rejected with clear error messages before reaching business logic
3. **Dependency Injection** — The `Depends(get_db)` pattern makes database session management clean and testable
4. **Performance** — FastAPI is one of the fastest Python frameworks, built on Starlette and Uvicorn (ASGI)
5. **Type hints** — Python type annotations drive both validation and documentation

Flask would work too, but I'd need to manually add validation (marshmallow/cerberus), documentation (flask-restx), and dependency injection.

---

**Q2: Explain the Service Layer pattern you used. Why not put logic directly in routers?**

**A:** I used a three-layer architecture: **Routers → Services → Models**.

- **Routers** handle HTTP concerns (request parsing, response codes, URL mapping)
- **Services** contain business logic (stock validation, auto-SKU generation, atomic transactions)
- **Models** define the database schema

Benefits:
- **Testability** — I can unit-test `create_order()` by passing a mock `db` session, without spinning up an HTTP server
- **Reusability** — If I add a CLI tool or batch import, it can call the same service functions
- **Separation of concerns** — A router change (e.g., adding pagination) doesn't affect business logic

---

**Q3: How does your database session management work? What happens if a request fails mid-transaction?**

**A:** The `get_db()` function uses Python's `yield` as a generator:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db          # Session is used during request
    finally:
        db.close()        # Always closes, even on exceptions
```

FastAPI calls this as a dependency. If an exception occurs during the request:
1. The `finally` block still runs → connection is returned to the pool
2. Since `db.commit()` was never called, SQLAlchemy **automatically rolls back** the transaction
3. No partial data is saved to the database

This prevents both **connection leaks** and **data corruption**.

---

### Database & Data Integrity

---

**Q4: How do you ensure product SKUs are unique?**

**A:** Two layers of protection:

1. **Database level** — `Column(String(100), unique=True)` creates a UNIQUE constraint. Even if the application has a bug, the database will reject duplicates with an IntegrityError.

2. **Application level** — Before inserting, I query `db.query(Product).filter(Product.sku == sku).first()`. If found, I return a clear 400 error message instead of an ugly database error.

The database constraint is the ultimate safety net. The application check provides a better user experience.

---

**Q5: Explain how your auto-SKU generation works. What about race conditions?**

**A:** The auto-SKU system:
1. Queries the highest existing `PRD-XXX` SKU
2. Increments by 1 (e.g., `PRD-012` → `PRD-013`)
3. Verifies the generated SKU doesn't exist (collision check loop)
4. Returns the unique SKU

**Race condition risk:** If two requests simultaneously generate a SKU, both might try `PRD-013`. However, the database UNIQUE constraint will reject the second insert, and the error is caught and reported to the user.

For high-concurrency systems, I'd use a database sequence (`SERIAL` or `nextval()`) or a UUID-based SKU, but for this application scale, the current approach works well.

---

**Q6: Why did you use an ENUM for order status instead of a string field?**

**A:** Using `Enum(OrderStatus)`:

1. **Data integrity** — Only valid values (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`) can be stored. A typo like `"pendingg"` is rejected at the database level.
2. **Documentation** — The enum appears in Swagger docs, showing all valid options.
3. **Code safety** — `OrderStatus.CANCELLED` is checked with code completion, not magic strings like `"cancelled"`.

Tradeoff: Adding a new status requires a database migration (ALTER TYPE). For rapidly changing statuses, a string with application-level validation might be more flexible.

---

**Q7: How does your order creation handle stock atomically?**

**A:** The `create_order()` function uses a **two-phase approach**:

**Phase 1 — Validate (read-only):**
- Check customer exists
- Check ALL products exist
- Verify ALL products have sufficient stock
- If ANY product fails validation, reject the ENTIRE order

**Phase 2 — Execute (write):**
- Create the Order row (`db.flush()` to get the ID)
- Create OrderItem rows
- Reduce each product's `stock_quantity`
- `db.commit()` — all changes persist atomically

This is crucial because we don't want to reduce stock for Product A and then discover Product B is out of stock. The "validate everything first, then modify" pattern ensures consistency.

Everything happens in a single database transaction. If the server crashes between `flush()` and `commit()`, nothing is saved.

---

### Frontend

---

**Q8: Why did you use Axios instead of the native `fetch()` API?**

**A:** Axios provides several advantages:

1. **Base URL** — `axios.create({ baseURL: API_URL })` means I write `/api/products` instead of `http://localhost:8001/api/products` everywhere
2. **Automatic JSON** — Axios auto-serializes request bodies and parses responses. With `fetch()`, you manually call `JSON.stringify()` and `res.json()`
3. **Error handling** — Axios rejects on HTTP errors (4xx, 5xx). `fetch()` only rejects on network failures, so you have to manually check `res.ok`
4. **Interceptors** — Easy to add auth tokens or error logging globally (not used here, but important for scalability)

---

**Q9: How does the `VITE_API_URL` environment variable work across environments?**

**A:** Vite handles environment variables at **build time**, not runtime:

1. During `npm run build`, Vite replaces all `import.meta.env.VITE_API_URL` with the actual value
2. The output is static JavaScript — the URL is hardcoded in the bundle
3. Different environments need different builds:
   - **Docker**: Set via `ARG VITE_API_URL` in Dockerfile, passed from `docker-compose.yml`
   - **Render**: Set in the Static Site's environment variables before building
   - **Local dev**: Read from `frontend/.env` file

This is why changing the backend URL requires a **rebuild**, not just a restart.

---

**Q10: How does client-side routing work with Nginx?**

**A:** React Router handles routing in the browser (e.g., `/products`, `/orders`). But when a user directly navigates to `https://example.com/products`, Nginx needs to serve `index.html` — not look for a `/products` file.

The `nginx.conf` solves this:

```nginx
location / {
    try_files $uri $uri/ /index.html;   # Fallback to index.html for SPA
}
```

This means:
1. Try the exact file path (`/assets/index.js` → serve it)
2. Try it as a directory
3. If nothing matches → serve `index.html` → React Router takes over

Without this, refreshing on `/orders` would return a 404.

---

### Docker & DevOps

---

**Q11: Explain your multi-stage Docker build for the frontend.**

**A:** The frontend Dockerfile has two stages:

**Stage 1 (Build):** Uses `node:20-alpine` (~180MB). Installs npm dependencies, runs `npm run build`, outputs static files to `/app/dist/`.

**Stage 2 (Serve):** Uses `nginx:alpine` (~40MB). Copies ONLY the built files from Stage 1. No Node.js, no npm, no source code in the final image.

**Benefits:**
- **Security** — Source code and dev dependencies are not in the production image
- **Size** — Final image is ~40MB instead of ~500MB+
- **Speed** — Smaller image = faster pull from Docker Hub = faster deployment

---

**Q12: Why does the backend use `depends_on: condition: service_healthy` instead of just `depends_on`?**

**A:** Plain `depends_on` only waits for the container to **start**, not for the service inside to be **ready**. PostgreSQL takes a few seconds to initialize after the container starts.

With `condition: service_healthy`, Docker Compose waits for the healthcheck to pass:

```yaml
healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 5s
    retries: 5
```

Without this, the backend would try to connect to PostgreSQL before it's accepting connections, causing a crash on startup.

---

**Q13: What's the difference between `docker-compose down` and `docker-compose down -v`?**

**A:**
- `docker-compose down` — Stops and removes containers and networks. The named volume `postgres_data` is **preserved**. Your data survives.
- `docker-compose down -v` — Also removes **volumes**. The database is **wiped**. Next startup creates a fresh empty database.

This is important because the database data lives in a Docker volume (`postgres_data`), not inside the container. Containers are ephemeral, but volumes persist.

---

### Deployment

---

**Q14: Why did you need a `.python-version` file for Render?**

**A:** Render defaults to the latest Python (3.14.3 at the time), but `pydantic-core` doesn't have pre-built wheels for Python 3.14. It tried to compile from source using Rust, which failed due to Render's read-only filesystem.

The `.python-version` file with `3.11.12` tells Render to use Python 3.11, which has pre-built wheels for all our dependencies. This matches our Docker image (`python:3.11-slim`), ensuring consistency.

---

**Q15: How does auto-seeding work on Render where you can't access the Shell?**

**A:** Since Render's free tier doesn't provide Shell access, I added auto-seeding to `main.py`:

```python
try:
    from app.seed import seed
    seed()
except Exception as e:
    print(f"Auto-seed skipped: {e}")
```

The `seed()` function checks `if db.query(Product).count() > 0` first. If data exists, it skips. So:
- First deploy → empty database → seeds sample data
- Subsequent restarts → data exists → skips silently
- Errors (any) → caught and logged, doesn't crash the app

---

**Q16: Why is CORS configuration critical for deployment?**

**A:** In development, frontend (localhost:3001) and backend (localhost:8001) are different origins. In production, it's `inventory-frontend-5o3b.onrender.com` vs `inventory-backend-jrdk.onrender.com`.

Without CORS, the browser blocks all API requests with: `Access-Control-Allow-Origin` error.

The backend must explicitly allow the frontend's origin:
```python
CORS_ORIGINS=https://inventory-frontend-5o3b.onrender.com
```

Setting `CORS_ORIGINS=*` allows any origin (convenient for development, risky for production).

---

### Business Logic

---

**Q17: What happens when an order is cancelled? Walk through the code.**

**A:**

```python
def update_order_status(db, order_id, status_data):
    order = get_order(db, order_id)
    old_status = order.status
    new_status = OrderStatus(status_data.status)
    
    # Only restore stock when transitioning TO cancelled FROM a non-cancelled state
    if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity    # Restore stock
    
    order.status = new_status
    db.commit()
```

The `old_status != OrderStatus.CANCELLED` check prevents double-restoration. If someone accidentally cancels an already-cancelled order, stock won't be added twice.

---

**Q18: What happens if I try to order 10 items but only 3 are in stock?**

**A:** The order is **completely rejected** with a 400 error:

```json
{
    "detail": {
        "message": "Insufficient stock for one or more products",
        "insufficient_items": [
            {
                "product_name": "Wireless Mouse",
                "requested": 10,
                "available": 3
            }
        ]
    }
}
```

The key design decision: we reject the **entire** order, not just the insufficient item. This prevents partial orders that the customer didn't intend.

---

**Q19: How is total_amount calculated for an order?**

**A:** The total is calculated server-side, not sent by the client:

```python
for item in order_data.items:
    product = db.query(Product).filter(Product.id == item.product_id).first()
    subtotal = product.price * item.quantity    # Use CURRENT price from DB
    total_amount += subtotal
```

We use the **current price from the database**, not any price sent by the client. This prevents price manipulation attacks where a client could send `price: 0.01` for an expensive product.

Each `OrderItem` stores `unit_price` and `subtotal` at the time of purchase — so even if the product price changes later, the order history is preserved.

---

### Advanced / Scenario Questions

---

**Q20: How would you add authentication to this project?**

**A:** I'd add JWT (JSON Web Token) authentication:

1. **Backend**: Add `python-jose` and `passlib` to `requirements.txt`
2. **New model**: `User` with email, hashed_password, role
3. **New router**: `/api/auth/login` → returns JWT token, `/api/auth/register` → creates user
4. **Middleware**: Create a `get_current_user` dependency that validates the JWT from the `Authorization: Bearer <token>` header
5. **Protect routes**: Add `Depends(get_current_user)` to routes that need authentication
6. **Frontend**: Store JWT in localStorage, add to Axios interceptor for all requests

---

**Q21: The free Render backend sleeps after 15 minutes. How would you handle this in production?**

**A:** Several approaches:
1. **Upgrade to paid tier** — Always-on instances ($7/month)
2. **Health check pinger** — Use UptimeRobot or cron-job.org to ping `/api/health` every 14 minutes
3. **Loading state** — Show a "Waking up server..." spinner on the frontend while the first request is pending
4. **Serverless** — Move to AWS Lambda or Google Cloud Functions for automatic scaling

---

**Q22: How would you handle 1000 concurrent orders?**

**A:** Current design limitations and solutions:

1. **Database locking** — The current approach reads stock, validates, then updates. Under high concurrency, two requests could read the same stock value. Solution: Use `SELECT ... FOR UPDATE` (pessimistic locking) or optimistic locking with version numbers.

2. **Connection pooling** — SQLAlchemy's default pool handles ~5 concurrent connections. I'd increase `pool_size` and use PgBouncer for connection pooling.

3. **Queue-based processing** — Move order creation to a message queue (Redis + Celery). The API returns 202 Accepted, and a worker processes orders sequentially.

4. **Database-level constraints** — Add a CHECK constraint: `stock_quantity >= 0`. This makes the database the final arbiter, preventing negative stock even under race conditions.

---

**Q23: How would you add pagination to the products list?**

**A:**

Backend:
```python
@router.get("")
def list_products(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    total = db.query(Product).count()
    return {"items": products, "total": total, "skip": skip, "limit": limit}
```

Frontend:
```javascript
const [page, setPage] = useState(0);
const res = await productAPI.getAll({ skip: page * 20, limit: 20 });
```

---

**Q24: What's the difference between `npm install` and `npm ci`?**

**A:**
- `npm install` reads `package.json`, resolves version ranges, and may update `package-lock.json`
- `npm ci` reads `package-lock.json` exactly, installs exact versions, and deletes `node_modules` first

I used `npm ci` in the Dockerfile for **deterministic builds** — the same lockfile always produces the same `node_modules`. This prevents "works on my machine" issues where different versions get installed.

---

**Q25: If you had to redesign this from scratch, what would you change?**

**A:**
1. **TypeScript on frontend** — Type safety catches bugs at compile time, better IDE support
2. **Alembic migrations** — Currently using `create_all()` which can't handle schema changes. Alembic tracks incremental migrations
3. **Redis caching** — Cache dashboard stats (expensive query) with a 30-second TTL
4. **WebSocket for real-time** — Push stock updates to all connected clients when an order is placed
5. **Unit tests** — Add pytest for backend services and React Testing Library for frontend components
6. **Role-based access** — Admin vs. Staff roles with different permissions
7. **Decimal for prices** — `Float` has precision issues (e.g., 0.1 + 0.2 ≠ 0.3). Use `Numeric(10, 2)` in SQLAlchemy

---

*End of Document*
