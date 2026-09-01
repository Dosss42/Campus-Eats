import { MenuItem } from './menu-item.model';

export interface CartLine {
  item: MenuItem;
  quantity: number;
}