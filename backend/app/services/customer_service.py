from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_customers(db: Session, search: str = None):
    """Get all customers with optional search."""
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%"))
        )
    return query.order_by(Customer.created_at.desc()).all()


def get_customer(db: Session, customer_id: int):
    """Get a single customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def create_customer(db: Session, customer_data: CustomerCreate):
    """Create a new customer with unique email validation."""
    # Check for duplicate email
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Customer with email '{customer_data.email}' already exists"
        )

    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, customer_data: CustomerUpdate):
    """Update an existing customer."""
    customer = get_customer(db, customer_id)
    update_data = customer_data.model_dump(exclude_unset=True)

    # If email is being updated, check for duplicates
    if "email" in update_data:
        existing = db.query(Customer).filter(
            Customer.email == update_data["email"],
            Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Customer with email '{update_data['email']}' already exists"
            )

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int):
    """Delete a customer by ID."""
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
