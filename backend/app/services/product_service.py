from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def _generate_sku(db: Session) -> str:
    """Auto-generate a unique SKU like PRD-001, PRD-002, etc."""
    # Find the highest existing PRD-XXX number
    last = db.query(Product).filter(
        Product.sku.like("PRD-%")
    ).order_by(Product.sku.desc()).first()

    if last and last.sku.startswith("PRD-"):
        try:
            num = int(last.sku.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1

    # Keep incrementing if collision (edge case)
    while True:
        sku = f"PRD-{num:03d}"
        existing = db.query(Product).filter(Product.sku == sku).first()
        if not existing:
            return sku
        num += 1


def get_products(db: Session, search: str = None, category: str = None):
    """Get all products with optional search and category filter."""
    query = db.query(Product)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    return query.order_by(Product.created_at.desc()).all()


def get_product(db: Session, product_id: int):
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(db: Session, product_data: ProductCreate):
    """Create a new product with unique SKU validation. Auto-generates SKU if not provided."""
    data = product_data.model_dump()

    # Auto-generate SKU if not provided
    if not data.get("sku"):
        data["sku"] = _generate_sku(db)
    else:
        # Check for duplicate SKU
        existing = db.query(Product).filter(Product.sku == data["sku"]).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Product with SKU '{data['sku']}' already exists"
            )

    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate):
    """Update an existing product."""
    product = get_product(db, product_id)
    update_data = product_data.model_dump(exclude_unset=True)

    # If SKU is being updated, check for duplicates
    if "sku" in update_data:
        existing = db.query(Product).filter(
            Product.sku == update_data["sku"],
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Product with SKU '{update_data['sku']}' already exists"
            )

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    """Delete a product by ID."""
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
