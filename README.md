# InvenTrack — Inventory & Order Management System

A full-stack application for managing products, customers, orders, and inventory tracking with automated stock management.

## Tech Stack

| Layer | Technology |
|:---|:---|
| **Backend** | FastAPI (Python 3.11) |
| **Database** | PostgreSQL 15 |
| **Frontend** | React 18 + Vite |
| **Containerization** | Docker + Docker Compose |

## Features

- **Product Management**: CRUD operations with auto-generated SKU, unique SKU validation, stock level tracking
- **Customer Management**: CRUD operations with unique email validation
- **Order Management**: Create orders with multiple items, automatic stock reduction
- **Inventory Tracking**: Real-time stock levels, low-stock alerts, stock restoration on order cancellation
- **Dashboard**: Overview statistics, revenue tracking (₹ INR), recent orders
- **Premium Dark UI**: Responsive design with glassmorphism, animations, and modern aesthetics

## Business Rules

- Product SKUs are auto-generated (e.g., PRD-001, PRD-002) or can be manually specified
- Product SKUs must be unique
- Customer emails must be unique
- Orders cannot be created when product stock is insufficient
- Stock is automatically reduced when orders are placed
- Stock is restored when orders are cancelled or deleted

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start all services**
   ```bash
   docker-compose up --build -d
   ```

4. **Seed the database** (optional, for sample data)
   ```bash
   docker-compose exec backend python -m app.seed
   ```

5. **Access the application**

   | Service | URL |
   |:---|:---|
   | Frontend | http://localhost:3001 |
   | Backend API | http://localhost:8001 |
   | API Docs (Swagger) | http://localhost:8001/docs |

6. **Stop all services**
   ```bash
   docker-compose down       # keeps database data
   docker-compose down -v    # removes database data too
   ```

### Local Development (without Docker)

You need **Python 3.11+**, **Node.js 18+**, and **PostgreSQL** installed locally.

#### Database
```bash
psql -U postgres
CREATE DATABASE inventory_db;
\q
```

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate         # On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Set environment variable
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db

# Run the server
uvicorn app.main:app --reload --port 8001

# Seed sample data (in a separate terminal)
python -m app.seed
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server starts on http://localhost:5173 and reads `VITE_API_URL` from `frontend/.env`.

## API Endpoints

### Products
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/products` | List all products (supports `?search=` query) |
| GET | `/api/products/{id}` | Get product by ID |
| POST | `/api/products` | Create a new product (SKU auto-generated if omitted) |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |

### Customers
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/customers` | List all customers (supports `?search=` query) |
| GET | `/api/customers/{id}` | Get customer by ID |
| POST | `/api/customers` | Create a new customer |
| PUT | `/api/customers/{id}` | Update a customer |
| DELETE | `/api/customers/{id}` | Delete a customer |

### Orders
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/orders` | List all orders (supports `?status=` filter) |
| GET | `/api/orders/{id}` | Get order with items detail |
| POST | `/api/orders` | Create order (auto-reduces stock) |
| PUT | `/api/orders/{id}/status` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order (restores stock if not cancelled) |

### Dashboard
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/dashboard/stats` | Dashboard statistics (totals, revenue, low stock count) |

### Health
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/health` | Health check |

## Environment Variables

| Variable | Description | Default |
|:---|:---|:---|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | Database name | `inventory_db` |
| `DATABASE_URL` | Full database connection string | `postgresql://postgres:postgres@db:5432/inventory_db` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3001` |
| `DEBUG` | Enable debug mode | `true` |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:8001` |

## Project Structure

```
Project/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database setup
│   │   ├── models/         # SQLAlchemy models (Product, Customer, Order, OrderItem)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic (stock management, validation)
│   │   ├── main.py         # FastAPI app entry point
│   │   └── seed.py         # Sample data seeder (Indian names, INR prices)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client
│   │   ├── components/     # Reusable UI (Sidebar, Modal, Toast)
│   │   ├── pages/          # Page components (Dashboard, Products, Customers, Orders)
│   │   ├── App.jsx         # Main app with routing
│   │   └── index.css       # Complete design system (dark theme)
│   ├── Dockerfile          # Multi-stage build (Node → Nginx)
│   └── nginx.conf          # SPA routing + gzip + caching
├── docker-compose.yml      # PostgreSQL + Backend + Frontend
├── .env                    # Environment variables (not committed)
├── .env.example            # Template for .env
└── README.md
```

## Deployment

### Backend + Database (Render)
1. Create a **PostgreSQL** database on Render (Free tier)
2. Create a **Web Service** on Render
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   - `DATABASE_URL` → Internal Database URL from step 1
   - `CORS_ORIGINS` → Your Vercel frontend URL
   - `DEBUG` → `false`
4. Seed data via the Shell tab: `python -m app.seed`

### Frontend (Vercel)
1. Import your GitHub repository on Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` → Your Render backend URL
4. Deploy

> **Note:** Render free tier services sleep after 15 minutes of inactivity. First request after idle takes ~30 seconds.
