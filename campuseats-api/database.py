"""
SQLite storage for the CampusEats API.

Uses nothing but the Python standard library, so there is no extra package to
install and no database server to run. The whole database is a single file
(campuseats.db) sitting next to this one.

Instructors: point CAMPUSEATS_DB at another path to give each student a private
database file, or at ":memory:" to get the old throwaway behaviour back.

The three tables mirror the API's shapes exactly:

    menu_items    one row per dish, seeded once from SEED_MENU
    orders        one row per placed order
    order_lines   one row per line within an order, joined by order_id

Prices are stored on the order line as `unit_price` at the moment of ordering.
That is deliberate: if the canteen raises the price of adobo tomorrow, last
week's receipts must not change. This is a real modelling decision worth ten
minutes of class discussion.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DB_PATH = os.environ.get("CAMPUSEATS_DB", str(Path(__file__).parent / "campuseats.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS menu_items (
    id           INTEGER PRIMARY KEY,
    name         TEXT    NOT NULL,
    description  TEXT    NOT NULL,
    price        REAL    NOT NULL,
    category     TEXT    NOT NULL,
    available    INTEGER NOT NULL DEFAULT 1,
    prep_minutes INTEGER NOT NULL,
    rating       REAL    NOT NULL,
    emoji        TEXT    NOT NULL,
    image        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id             TEXT PRIMARY KEY,
    reference      TEXT NOT NULL UNIQUE,
    customer_name  TEXT NOT NULL,
    room_or_stall  TEXT NOT NULL,
    notes          TEXT NOT NULL DEFAULT '',
    total          REAL NOT NULL,
    status         TEXT NOT NULL,
    placed_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   TEXT    NOT NULL,
    item_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    quantity   INTEGER NOT NULL,
    unit_price REAL    NOT NULL,
    subtotal   REAL    NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at  ON orders(placed_at);
"""


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    """One connection per operation. Rows come back as dict-like objects."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init(seed_rows: list[tuple], *, force: bool = False) -> None:
    """
    Create the tables if they are missing, then seed the menu if it is empty.

    An existing database is left alone, so orders survive a restart. Pass
    force=True (or call POST /api/dev/reset) to wipe and start over.
    """
    with connect() as conn:
        conn.executescript(SCHEMA)

        if force:
            conn.execute("DELETE FROM order_lines")
            conn.execute("DELETE FROM orders")
            conn.execute("DELETE FROM menu_items")

        already_seeded = conn.execute("SELECT COUNT(*) FROM menu_items").fetchone()[0]
        if not already_seeded:
            conn.executemany(
                """INSERT INTO menu_items
                   (id, name, description, price, category, available,
                    prep_minutes, rating, emoji, image)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                seed_rows,
            )


def next_reference(conn: sqlite3.Connection) -> str:
    """
    Order references run CE-1042, CE-1043, … and must not restart when the
    server does, so the next one is derived from what is already stored.
    """
    row = conn.execute(
        "SELECT reference FROM orders ORDER BY CAST(SUBSTR(reference, 4) AS INTEGER) DESC LIMIT 1"
    ).fetchone()
    if not row:
        return "CE-1042"
    return f"CE-{int(row['reference'][3:]) + 1}"
