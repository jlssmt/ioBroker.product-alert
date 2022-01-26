/*
 * Created with @iobroker/create-adapter v1.34.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Record } from './types/record.interface';

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
        const promises: Promise<string | void>[] = [];

        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });

        for (const item of this.config.items || []) {
            if (!item.productName || !item.url) continue;

            const page = await browser.newPage();
            await page.goto(item.url);
            await page.waitForTimeout(2000);

            const record = await page.evaluate(() => {
                return [...document.querySelectorAll('body *')]
                    .map(createRecordFromElement)
                    .filter(canBePrice)
                    .sort(sortNodes);

                function createRecordFromElement(element: Element): Record {
                    if (!element || !element.textContent) return {} as Record;
                    const text = element.textContent.trim();
                    const boundingBox = element.getBoundingClientRect();

                    return {
                        x: boundingBox.x,
                        y: boundingBox.y,
                        text,
                        fontSize: boundingBox.x && boundingBox.y && text.length <= 30 ? parseInt(getComputedStyle(element)['fontSize']) : 0,
                    };
                }

                function canBePrice(record: Record): boolean {
                    return record['y'] < 600
                        && !!record['fontSize']
                        && !!record['text'].match(/€/)
                        && !!record['text'].match(/\d+/);
                }

                function sortNodes(a: Record, b: Record): number {
                    if (a['fontSize'] === b['fontSize']) {
                        if (a['y'] === b['y']) {
                            if (a['x'] < b['x']) return -1;
                            return 1;
                        }
                        if (a['y'] < b['y']) return -1;
                        return 1;
                    }
                    if (a['fontSize'] > b['fontSize']) return -1;
                    return 1;
                }
            });

            await this.extendAdapterObjectAsync(item.productName, item.productName, 'channel');
            await this.createAdapterStateIfNotExistsAsync(`${item.productName}.price`, 'product price', 'number');
            await this.setStateAsync(`${item.productName}.price`, record[0].text);
            console.log(record[0].text);
            await page.close();

        }
        await browser.close();

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

    private createAdapterStateIfNotExistsAsync(id: string, name: string, type: ioBroker.CommonType): ioBroker.SetObjectPromise {
        return this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: name,
                type: type,
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
    }

    private extendAdapterObjectAsync(id: string, name: string, type: 'channel' | 'folder'): ioBroker.SetObjectPromise {
        return this.extendObjectAsync(id, {
            type: type,
            common: {
                name: name,
            },
            native: {},
        });
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new ProductAlert(options);
} else {
    // otherwise start the instance directly
    (() => new ProductAlert())();
}
