export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderLine {
  itemId: number;
  quantity: number;
  name: string;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  roomOrStall: string;
  notes: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  placedAt: string;
}

export interface NewOrder {
  customerName: string;
  roomOrStall: string;
  notes?: string;
  lines: {
    itemId: number;
    quantity: number;
  }[];
}