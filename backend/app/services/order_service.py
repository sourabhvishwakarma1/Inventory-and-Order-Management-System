from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderStatusUpdate


def get_orders(db: Session, status: str = None):
    """Get all orders with optional status filter."""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()


def get_order(db: Session, order_id: int):
    """Get a single order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _build_order_response(order: Order):
    """Build a response dict from an Order model with related data."""
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else None,
        "customer_email": order.customer.email if order.customer else None,
        "status": order.status.value if hasattr(order.status, 'value') else order.status,
        "total_amount": order.total_amount,
        "order_date": order.order_date,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "product_sku": item.product.sku if item.product else None,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def get_orders_with_details(db: Session, status: str = None):
    """Get all orders with customer and item details."""
    orders = get_orders(db, status)
    return [_build_order_response(order) for order in orders]


def get_order_with_details(db: Session, order_id: int):
    """Get a single order with full details."""
    order = get_order(db, order_id)
    return _build_order_response(order)


def create_order(db: Session, order_data: OrderCreate):
    """
    Create a new order with inventory validation and automatic stock reduction.

    Business Rules:
    1. Customer must exist
    2. All products must exist
    3. Stock must be sufficient for ALL items (checked atomically)
    4. Stock is reduced upon order creation
    5. Total is calculated from item prices * quantities
    """
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate all products and check stock availability
    insufficient_stock = []
    order_items_data = []
    total_amount = 0.0

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with ID {item.product_id} not found"
            )

        if product.stock_quantity < item.quantity:
            insufficient_stock.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "requested": item.quantity,
                "available": product.stock_quantity,
            })
        else:
            subtotal = product.price * item.quantity
            order_items_data.append({
                "product": product,
                "quantity": item.quantity,
                "unit_price": product.price,
                "subtotal": subtotal,
            })
            total_amount += subtotal

    # If any product has insufficient stock, reject the entire order
    if insufficient_stock:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Insufficient stock for one or more products",
                "insufficient_items": insufficient_stock,
            }
        )

    # Create the order
    order = Order(
        customer_id=order_data.customer_id,
        status=OrderStatus.PENDING,
        total_amount=round(total_amount, 2),
    )
    db.add(order)
    db.flush()  # Get the order ID without committing

    # Create order items and reduce stock
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )
        db.add(order_item)

        # Reduce stock
        item_data["product"].stock_quantity -= item_data["quantity"]

    db.commit()
    db.refresh(order)
    return _build_order_response(order)


def update_order_status(db: Session, order_id: int, status_data: OrderStatusUpdate):
    """
    Update order status. If cancelling, restore stock quantities.
    """
    order = get_order(db, order_id)
    old_status = order.status

    new_status = OrderStatus(status_data.status)

    # If cancelling an order that wasn't already cancelled, restore stock
    if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)
    return _build_order_response(order)


def delete_order(db: Session, order_id: int):
    """Delete an order and restore stock if not already cancelled."""
    order = get_order(db, order_id)

    # Restore stock if the order wasn't cancelled
    if order.status != OrderStatus.CANCELLED:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity

    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
