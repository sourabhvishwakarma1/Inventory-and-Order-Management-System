from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse
from app.services import order_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.get("")
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """Get all orders with customer and item details."""
    return order_service.get_orders_with_details(db, status=status)


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single order with full details."""
    return order_service.get_order_with_details(db, order_id)


@router.post("", status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order.
    
    Validates stock availability for all items before creating.
    Automatically reduces stock quantities upon creation.
    Returns 400 if any product has insufficient stock.
    """
    return order_service.create_order(db, order)


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int, status: OrderStatusUpdate, db: Session = Depends(get_db)
):
    """Update order status. Restores stock if order is cancelled."""
    return order_service.update_order_status(db, order_id, status)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete an order. Restores stock if order was not cancelled."""
    return order_service.delete_order(db, order_id)
