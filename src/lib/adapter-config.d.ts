// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
import { Item } from '../types/item.interface';

declare global {
    namespace ioBroker {
        interface AdapterConfig {
            items: Item[];
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};