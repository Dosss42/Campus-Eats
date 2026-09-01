"""
CampusEats API — teaching backend for the Ionic + Angular build activity.

Run it:
    pip install "fastapi[standard]" uvicorn
    uvicorn main:app --reload --port 8000

Then open http://localhost:8000/docs for interactive documentation.

Design notes for instructors
----------------------------
* Data is stored in SQLite, in a single file (campuseats.db) created on first
  run. Orders survive a restart. There is nothing to install and no server to
  configure -- sqlite3 ships with Python.
* Set CAMPUSEATS_DB to change the file path, or to ":memory:" for a throwaway
  database that empties on every restart.
* POST /api/dev/reset wipes everything and re-seeds the 15 dishes, which is the
  fastest way to start a class from a known state.
* CORS is wide open so `ionic serve` (http://localhost:8100) can call it.
* Every endpoint accepts ?delay= and ?fail= so students can *see* loading
  states, skeletons, retries and error toasts without unplugging the wifi.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import database

# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create the tables and seed the menu before the first request arrives."""
    database.init(SEED_ROWS)
    yield


app = FastAPI(
    lifespan=lifespan,
    title="CampusEats API",
    version="1.0.0",
    description=(
        "A small, dependency-free food-ordering API used by the Ionic + Angular "
        "course project. Data is persisted in a local SQLite file. Every endpoint "
        "supports `?delay=` and `?fail=` so you can demonstrate loading and error "
        "states on demand."
    ),
    contact={"name": "CampusEats teaching API"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev only — never ship this
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Schemas  (these mirror the TypeScript interfaces students write)
# --------------------------------------------------------------------------

Category = Literal["rice", "noodles", "snacks", "drinks", "desserts"]
OrderStatus = Literal["pending", "preparing", "ready", "delivered", "cancelled"]


class MenuItem(BaseModel):
    id: int = Field(examples=[1])
    name: str = Field(examples=["Chicken Adobo Rice Bowl"])
    description: str
    price: float = Field(description="Price in PHP", examples=[89.0])
    category: Category
    available: bool = True
    prepMinutes: int = Field(description="Typical preparation time", examples=[12])
    rating: float = Field(ge=0, le=5, examples=[4.6])
    emoji: str = Field(description="Cheap stand-in for an image", examples=["🍚"])
    image: str = Field(description="Absolute URL to a photo")


class OrderLine(BaseModel):
    itemId: int
    quantity: int = Field(gt=0, le=50, examples=[2])


class OrderCreate(BaseModel):
    customerName: str = Field(min_length=1, max_length=60, examples=["Ana Cruz"])
    roomOrStall: str = Field(min_length=1, max_length=60, examples=["IT Building 204"])
    notes: str = ""
    lines: list[OrderLine] = Field(min_length=1)


class OrderLineOut(OrderLine):
    name: str
    unitPrice: float
    subtotal: float


class Order(BaseModel):
    id: str
    reference: str = Field(examples=["CE-1042"])
    customerName: str
    roomOrStall: str
    notes: str
    lines: list[OrderLineOut]
    total: float
    status: OrderStatus
    placedAt: str = Field(description="ISO-8601 UTC timestamp")


class LoginRequest(BaseModel):
    email: str = Field(examples=["student@campus.edu"])
    password: str = Field(examples=["ionic123"])


class User(BaseModel):
    id: int
    name: str
    email: str
    role: Literal["student", "staff"]


class LoginResponse(BaseModel):
    token: str
    user: User


class ApiError(BaseModel):
    detail: str


# --------------------------------------------------------------------------
# Seed data
# --------------------------------------------------------------------------

def _photo(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/480/320"


SEED_MENU: list[MenuItem] = [
    MenuItem(id=1, name="Chicken Adobo Rice Bowl", description="Slow-braised chicken adobo over garlic rice.",
             price=89.0, category="rice", prepMinutes=12, rating=4.7, emoji="🍚", image=_photo("adobo")),
    MenuItem(id=2, name="Pork Sisig Rice Bowl", description="Sizzling pork sisig with egg and calamansi.",
             price=99.0, category="rice", prepMinutes=14, rating=4.8, emoji="🍛", image=_photo("sisig")),
    MenuItem(id=3, name="Beef Tapa Silog", description="Cured beef tapa, garlic rice and a fried egg.",
             price=105.0, category="rice", prepMinutes=15, rating=4.5, emoji="🥩", image=_photo("tapsilog")),
    MenuItem(id=4, name="Pancit Canton", description="Stir-fried noodles with vegetables and shrimp.",
             price=75.0, category="noodles", prepMinutes=10, rating=4.3, emoji="🍜", image=_photo("pancit")),
    MenuItem(id=5, name="Beef Mami", description="Hot noodle soup with slow-cooked beef.",
             price=85.0, category="noodles", prepMinutes=11, rating=4.4, emoji="🍲", image=_photo("mami")),
    MenuItem(id=6, name="Spaghetti Filipino Style", description="Sweet-style spaghetti with hotdog slices.",
             price=70.0, category="noodles", available=False, prepMinutes=9, rating=4.1, emoji="🍝", image=_photo("spag")),
    MenuItem(id=7, name="Cheese Sticks (6 pcs)", description="Crispy rolls with a molten cheese centre.",
             price=45.0, category="snacks", prepMinutes=6, rating=4.6, emoji="🧀", image=_photo("cheesesticks")),
    MenuItem(id=8, name="Fishball Skewer", description="Street-style fishballs with sweet-spicy sauce.",
             price=30.0, category="snacks", prepMinutes=5, rating=4.2, emoji="🍢", image=_photo("fishball")),
    MenuItem(id=9, name="Turon (2 pcs)", description="Caramelised banana spring rolls.",
             price=35.0, category="snacks", prepMinutes=7, rating=4.5, emoji="🍌", image=_photo("turon")),
    MenuItem(id=10, name="Iced Sweet Tea", description="House-brewed tea over ice.",
             price=40.0, category="drinks", prepMinutes=3, rating=4.0, emoji="🧋", image=_photo("icedtea")),
    MenuItem(id=11, name="Calamansi Juice", description="Fresh calamansi, lightly sweetened.",
             price=35.0, category="drinks", prepMinutes=3, rating=4.4, emoji="🍋", image=_photo("calamansi")),
    MenuItem(id=12, name="Iced Barako Coffee", description="Strong Batangas barako over milk and ice.",
             price=60.0, category="drinks", prepMinutes=4, rating=4.7, emoji="☕", image=_photo("barako")),
    MenuItem(id=13, name="Halo-Halo", description="Shaved ice, beans, leche flan and ube.",
             price=95.0, category="desserts", prepMinutes=8, rating=4.9, emoji="🍧", image=_photo("halohalo")),
    MenuItem(id=14, name="Leche Flan Slice", description="Classic steamed caramel custard.",
             price=55.0, category="desserts", prepMinutes=4, rating=4.6, emoji="🍮", image=_photo("flan")),
    MenuItem(id=15, name="Ube Cheesecake", description="No-bake ube cheesecake with graham crust.",
             price=85.0, category="desserts", prepMinutes=5, rating=4.8, emoji="🍰", image=_photo("ube")),
]

USERS = [
    {"id": 1, "name": "Ana Cruz", "email": "student@campus.edu", "password": "ionic123", "role": "student"},
    {"id": 2, "name": "Mr. Dela Peña", "email": "staff@campus.edu", "password": "ionic123", "role": "staff"},
]

SEED_ROWS = [
    (i.id, i.name, i.description, i.price, i.category, int(i.available),
     i.prepMinutes, i.rating, i.emoji, i.image)
    for i in SEED_MENU
]


# --------------------------------------------------------------------------
# Row -> model translation
#
# The database stores snake_case columns; the API speaks camelCase, because
# that is what the Angular interfaces expect. Keeping the translation in one
# place means the JSON contract never drifts from the schema.
# --------------------------------------------------------------------------

def row_to_menu_item(row: sqlite3.Row) -> MenuItem:
    return MenuItem(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        price=row["price"],
        category=row["category"],
        available=bool(row["available"]),
        prepMinutes=row["prep_minutes"],
        rating=row["rating"],
        emoji=row["emoji"],
        image=row["image"],
    )


def row_to_order(conn: sqlite3.Connection, row: sqlite3.Row) -> Order:
    lines = conn.execute(
        "SELECT * FROM order_lines WHERE order_id = ? ORDER BY id", (row["id"],)
    ).fetchall()
    return Order(
        id=row["id"],
        reference=row["reference"],
        customerName=row["customer_name"],
        roomOrStall=row["room_or_stall"],
        notes=row["notes"],
        lines=[
            OrderLineOut(
                itemId=line["item_id"],
                quantity=line["quantity"],
                name=line["name"],
                unitPrice=line["unit_price"],
                subtotal=line["subtotal"],
            )
            for line in lines
        ],
        total=row["total"],
        status=row["status"],
        placedAt=row["placed_at"],
    )


# --------------------------------------------------------------------------
# Shared query parameters: ?delay= and ?fail=
# --------------------------------------------------------------------------

async def simulate(
    delay: Annotated[int, Query(ge=0, le=10000, description="Artificial delay in milliseconds.")] = 0,
    fail: Annotated[bool, Query(description="Force a 500 response, for testing error states.")] = False,
) -> None:
    if delay:
        await asyncio.sleep(delay / 1000)
    if fail:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Simulated server failure. Show your error state and a retry button.",
        )


Simulated = Annotated[None, Depends(simulate)]


def require_token(authorization: Annotated[str | None, Header()] = None) -> User:
    """Deliberately naive auth — good enough to demonstrate a route guard."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token.")
    token = authorization.removeprefix("Bearer ").strip()
    for record in USERS:
        if token == f"demo-token-{record['id']}":
            return User(**{k: record[k] for k in ("id", "name", "email", "role")})
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------

@app.get("/health", tags=["system"], summary="Is the server awake?")
async def health() -> dict[str, str]:
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.post("/api/dev/reset", tags=["system"], summary="Wipe the database and re-seed the menu")
async def dev_reset() -> dict[str, str]:
    database.init(SEED_ROWS, force=True)
    return {"status": "reset"}


# --------------------------------------------------------------------------
# Menu
# --------------------------------------------------------------------------

@app.get("/api/categories", tags=["menu"], summary="List the menu categories")
async def list_categories(_: Simulated) -> list[str]:
    return ["rice", "noodles", "snacks", "drinks", "desserts"]


@app.get("/api/menu", tags=["menu"], summary="List menu items")
async def list_menu(
    _: Simulated,
    category: Annotated[Category | None, Query(description="Filter to one category.")] = None,
    search: Annotated[str | None, Query(description="Case-insensitive name/description match.")] = None,
    availableOnly: Annotated[bool, Query(description="Hide sold-out items.")] = False,
) -> list[MenuItem]:
    sql = "SELECT * FROM menu_items WHERE 1 = 1"
    params: list = []

    if category:
        sql += " AND category = ?"
        params.append(category)
    if search:
        sql += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)"
        needle = f"%{search.lower()}%"
        params += [needle, needle]
    if availableOnly:
        sql += " AND available = 1"

    sql += " ORDER BY id"

    with database.connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [row_to_menu_item(r) for r in rows]


@app.get(
    "/api/menu/{item_id}",
    tags=["menu"],
    summary="Get one menu item",
    responses={404: {"model": ApiError, "description": "No item with that id"}},
)
async def get_menu_item(item_id: int, _: Simulated) -> MenuItem:
    with database.connect() as conn:
        row = conn.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No menu item with id {item_id}.")
    return row_to_menu_item(row)


# --------------------------------------------------------------------------
# Orders
# --------------------------------------------------------------------------

@app.get("/api/orders", tags=["orders"], summary="List placed orders (newest first)")
async def list_orders(
    _: Simulated,
    orderStatus: Annotated[OrderStatus | None, Query(description="Filter by status.")] = None,
) -> list[Order]:
    sql = "SELECT * FROM orders"
    params: list = []
    if orderStatus:
        sql += " WHERE status = ?"
        params.append(orderStatus)
    sql += " ORDER BY placed_at DESC"

    with database.connect() as conn:
        rows = conn.execute(sql, params).fetchall()
        return [row_to_order(conn, r) for r in rows]


@app.get(
    "/api/orders/{order_id}",
    tags=["orders"],
    summary="Get one order",
    responses={404: {"model": ApiError, "description": "No order with that id"}},
)
async def get_order(order_id: str, _: Simulated) -> Order:
    with database.connect() as conn:
        row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No order with id {order_id}.")
        return row_to_order(conn, row)


@app.post(
    "/api/orders",
    tags=["orders"],
    status_code=status.HTTP_201_CREATED,
    summary="Place an order",
    responses={400: {"model": ApiError, "description": "Unknown or unavailable item"}},
)
async def create_order(payload: OrderCreate, _: Simulated) -> Order:
    with database.connect() as conn:
        lines: list[OrderLineOut] = []

        for line in payload.lines:
            row = conn.execute(
                "SELECT * FROM menu_items WHERE id = ?", (line.itemId,)
            ).fetchone()
            if not row:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown menu item {line.itemId}.")
            if not row["available"]:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"'{row['name']}' is sold out.")
            lines.append(
                OrderLineOut(
                    itemId=row["id"],
                    quantity=line.quantity,
                    name=row["name"],
                    # The price is copied onto the line, not referenced. A later
                    # price change must not rewrite an order already placed.
                    unitPrice=row["price"],
                    subtotal=round(row["price"] * line.quantity, 2),
                )
            )

        order = Order(
            id=str(uuid.uuid4()),
            reference=database.next_reference(conn),
            customerName=payload.customerName,
            roomOrStall=payload.roomOrStall,
            notes=payload.notes,
            lines=lines,
            total=round(sum(l.subtotal for l in lines), 2),
            status="pending",
            placedAt=datetime.now(timezone.utc).isoformat(),
        )

        conn.execute(
            """INSERT INTO orders
               (id, reference, customer_name, room_or_stall, notes, total, status, placed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (order.id, order.reference, order.customerName, order.roomOrStall,
             order.notes, order.total, order.status, order.placedAt),
        )
        conn.executemany(
            """INSERT INTO order_lines
               (order_id, item_id, name, quantity, unit_price, subtotal)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [(order.id, l.itemId, l.name, l.quantity, l.unitPrice, l.subtotal) for l in lines],
        )

    return order


class StatusPatch(BaseModel):
    status: OrderStatus


@app.patch(
    "/api/orders/{order_id}",
    tags=["orders"],
    summary="Update an order's status",
    responses={404: {"model": ApiError, "description": "No order with that id"}},
)
async def update_order(order_id: str, patch: StatusPatch, _: Simulated) -> Order:
    with database.connect() as conn:
        changed = conn.execute(
            "UPDATE orders SET status = ? WHERE id = ?", (patch.status, order_id)
        ).rowcount
        if not changed:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No order with id {order_id}.")
        row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        return row_to_order(conn, row)


@app.delete(
    "/api/orders/{order_id}",
    tags=["orders"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel and remove an order",
    responses={404: {"model": ApiError, "description": "No order with that id"}},
)
async def delete_order(order_id: str, _: Simulated) -> None:
    with database.connect() as conn:
        # order_lines has ON DELETE CASCADE, so the lines go with the order.
        deleted = conn.execute("DELETE FROM orders WHERE id = ?", (order_id,)).rowcount
        if not deleted:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No order with id {order_id}.")


# --------------------------------------------------------------------------
# Auth  (used by the route guard in Part 2)
# --------------------------------------------------------------------------

@app.post(
    "/api/auth/login",
    tags=["auth"],
    summary="Exchange an email and password for a token",
    responses={401: {"model": ApiError, "description": "Wrong email or password"}},
)
async def login(payload: LoginRequest, _: Simulated) -> LoginResponse:
    for record in USERS:
        if record["email"] == payload.email and record["password"] == payload.password:
            user = User(**{k: record[k] for k in ("id", "name", "email", "role")})
            return LoginResponse(token=f"demo-token-{record['id']}", user=user)
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong email or password.")


@app.get(
    "/api/auth/me",
    tags=["auth"],
    summary="Who is this token?",
    responses={401: {"model": ApiError, "description": "Missing or invalid token"}},
)
async def me(user: Annotated[User, Depends(require_token)]) -> User:
    return user
