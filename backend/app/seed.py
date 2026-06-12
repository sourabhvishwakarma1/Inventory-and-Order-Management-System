"""
Seed script to populate the database with sample data.
Run with: python -m app.seed
"""
from app.core.database import SessionLocal, engine, Base
from app.models.product import Product
from app.models.customer import Customer

# Import order models to ensure tables are created
from app.models.order import Order, OrderItem  # noqa: F401


def seed():
    """Populate the database with sample data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if data already exists
        if db.query(Product).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # Sample products (prices in INR)
        products = [
            Product(name="Wireless Bluetooth Headphones", sku="WBH-001", description="Premium noise-cancelling wireless headphones with 30-hour battery life", price=6499.00, stock_quantity=150, category="Electronics"),
            Product(name="USB-C Hub Adapter", sku="UCH-002", description="7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader", price=2899.00, stock_quantity=200, category="Electronics"),
            Product(name="Ergonomic Office Chair", sku="EOC-003", description="Adjustable lumbar support office chair with mesh back", price=18999.00, stock_quantity=45, category="Furniture"),
            Product(name="Mechanical Keyboard", sku="MKB-004", description="RGB mechanical keyboard with Cherry MX Blue switches", price=7499.00, stock_quantity=120, category="Electronics"),
            Product(name="Standing Desk Converter", sku="SDC-005", description="Height-adjustable standing desk converter with dual monitor support", price=14999.00, stock_quantity=30, category="Furniture"),
            Product(name="Laptop Backpack", sku="LBP-006", description="Water-resistant laptop backpack with USB charging port", price=3799.00, stock_quantity=300, category="Accessories"),
            Product(name="Wireless Mouse", sku="WMS-007", description="Ergonomic wireless mouse with programmable buttons", price=2499.00, stock_quantity=250, category="Electronics"),
            Product(name="Monitor Stand Riser", sku="MSR-008", description="Bamboo monitor stand with storage drawer", price=3299.00, stock_quantity=80, category="Furniture"),
            Product(name="Cable Management Kit", sku="CMK-009", description="Complete cable management solution with clips and sleeves", price=1599.00, stock_quantity=500, category="Accessories"),
            Product(name="Webcam HD 1080p", sku="WCM-010", description="Full HD webcam with built-in microphone and auto-focus", price=4999.00, stock_quantity=8, category="Electronics"),
            Product(name="Desk Lamp LED", sku="DLL-011", description="Adjustable LED desk lamp with USB charging port", price=2699.00, stock_quantity=5, category="Accessories"),
            Product(name="Notebook Journal", sku="NBJ-012", description="Premium leather-bound notebook with 200 pages", price=1249.00, stock_quantity=0, category="Stationery"),
        ]

        # Sample customers (Indian names and details)
        customers = [
            Customer(name="Aarav Sharma", email="aarav.sharma@email.com", phone="+91-98765-43210", address="42, MG Road, Bengaluru, Karnataka 560001"),
            Customer(name="Priya Patel", email="priya.patel@email.com", phone="+91-87654-32109", address="15, Linking Road, Mumbai, Maharashtra 400050"),
            Customer(name="Rohan Gupta", email="rohan.gupta@email.com", phone="+91-76543-21098", address="78, Connaught Place, New Delhi, Delhi 110001"),
            Customer(name="Ananya Reddy", email="ananya.reddy@email.com", phone="+91-65432-10987", address="23, Jubilee Hills, Hyderabad, Telangana 500033"),
            Customer(name="Vikram Singh", email="vikram.singh@email.com", phone="+91-54321-09876", address="56, Civil Lines, Jaipur, Rajasthan 302006"),
        ]

        db.add_all(products)
        db.add_all(customers)
        db.commit()

        print(f"Seeded {len(products)} products and {len(customers)} customers.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
