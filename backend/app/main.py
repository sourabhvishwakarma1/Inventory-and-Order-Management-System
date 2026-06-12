from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import products, customers, orders

# Import all models so they are registered with Base.metadata
from app.models import product, customer, order  # noqa: F401

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database with sample data if empty
try:
    from app.seed import seed
    seed()
except Exception as e:
    print(f"Auto-seed skipped: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    description="API for managing products, customers, orders, and inventory tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.get("/", tags=["Health"])
def root():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/dashboard/stats", tags=["Dashboard"])
def dashboard_stats():
    """Get dashboard statistics."""
    from app.core.database import SessionLocal
    from app.models.product import Product
    from app.models.customer import Customer
    from app.models.order import Order, OrderStatus

    db = SessionLocal()
    try:
        total_products = db.query(Product).count()
        total_customers = db.query(Customer).count()
        total_orders = db.query(Order).count()
        pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
        low_stock_products = db.query(Product).filter(Product.stock_quantity <= 10).count()

        # Calculate total revenue from non-cancelled orders
        from sqlalchemy import func
        revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.status != OrderStatus.CANCELLED
        ).scalar()

        return {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "low_stock_products": low_stock_products,
            "total_revenue": round(float(revenue), 2),
        }
    finally:
        db.close()
