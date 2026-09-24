import { addIcons } from 'ionicons';
import {
  restaurantOutline,
  cartOutline,
  receiptOutline,
  addOutline,
  removeOutline,
  closeOutline,
  alertCircleOutline,
  checkmarkCircle,
  closeCircle,
  logInOutline,
  logOutOutline,
  fastFoodOutline,
  refreshOutline,
  starOutline,
  timeOutline,
  locationOutline,
  personCircle,
  personCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  optionsOutline,
  pricetagOutline,
  sunnyOutline,
  moonOutline,
} from 'ionicons/icons';

/**
 * Registers the icon set used across the app so <ion-icon name="..."> resolves
 * to a locally bundled SVG instead of fetching from a CDN at runtime.
 */
export function registerIcons(): void {
  addIcons({
    'restaurant-outline': restaurantOutline,
    'cart-outline': cartOutline,
    'receipt-outline': receiptOutline,
    'add-outline': addOutline,
    'remove-outline': removeOutline,
    'close-outline': closeOutline,
    'alert-circle-outline': alertCircleOutline,
    'checkmark-circle': checkmarkCircle,
    'close-circle': closeCircle,
    'log-in-outline': logInOutline,
    'log-out-outline': logOutOutline,
    'fast-food-outline': fastFoodOutline,
    'refresh-outline': refreshOutline,
    'star-outline': starOutline,
    'time-outline': timeOutline,
    'location-outline': locationOutline,
    'person-circle': personCircle,
    'person-circle-outline': personCircleOutline,
    'chevron-back-outline': chevronBackOutline,
    'chevron-forward-outline': chevronForwardOutline,
    'options-outline': optionsOutline,
    'pricetag-outline': pricetagOutline,
    'sunny-outline': sunnyOutline,
    'moon-outline': moonOutline,
  });
}
