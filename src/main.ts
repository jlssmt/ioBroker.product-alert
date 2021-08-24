/*
 * Created with @iobroker/create-adapter v1.34.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Item } from './types/item.interface';

// Load your modules here, e.g.:
// import * as fs from "fs";

class ProductAlert extends utils.Adapter {

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'product-alert',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        const promises: Promise<string | void>[] = []

        for (const item of this.config.items || []) {
            if (!item.productName || !item.url || (!item.unavailableKeyword && !item.priceQuerySelector)) continue;

            promises.push(
                axios.get(item.url)
                    .then(res => {
                        if (res.status !== 200) throw new Error('URL not available.');
                        return res.data;
                    })
                    .then(data => this.handlePriceDetection(data, item))
                    .then(data => this.handleAvailable(data, item))
                    .catch(err => this.log.error(err)),
            );

        }

        await Promise.all(promises)
            .catch(err => this.log.error(err));

        this.terminate ? this.terminate('All data handled, adapter stopped until next scheduled moment.') : process.exit();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    createAdapterStateIfNotExists(id: string, name: string, type: ioBroker.CommonType): ioBroker.SetObjectPromise {
        return this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: name,
                type: type,
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        });
    }

    handleAvailable(data: any, item: Item): Promise<string> {
        if (!data || !item || !item.unavailableKeyword) throw new Error();
        return this.createAdapterStateIfNotExists(item.productName + '.available', 'available', 'boolean')
            .then(() => !data.toLowerCase().includes(item.unavailableKeyword.toLowerCase()))
            .then(res => this.setStateAsync(item.productName + '.available', res, true))
            .then(() => data);
    }

    handlePriceDetection(data: any, item: Item): Promise<string> {
        if (!data || !item || !item.priceQuerySelector) throw new Error();
        const $ = cheerio.load(data);
        return this.createAdapterStateIfNotExists(`${item.productName}.current-price`, 'current price', 'string')
            .then(() => this.setState(`${item.productName}.current-price`, $(item.priceQuerySelector).first().text().replace(/[^(\d|,|.)]/g, ''), true))
            .then(() => data);
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new ProductAlert(options);
} else {
    // otherwise start the instance directly
    (() => new ProductAlert())();
}
