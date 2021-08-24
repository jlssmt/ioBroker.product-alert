import { Vendor } from './vendor.enum';

export interface Item {
    productName: string;
    url: string;
    unavailableKeyword: string;
    priceQuerySelector: string;
    vendor: Vendor;
}
