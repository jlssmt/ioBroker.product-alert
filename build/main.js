"use strict";
/*
 * Created with @iobroker/create-adapter v1.34.1
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const currency_to_float_1 = require("currency-to-float");
// Load your modules here, e.g.:
// import * as fs from "fs";
class ProductAlert extends utils.Adapter {
    constructor(options = {}) {
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
    async onReady() {
        var _a, _b;
        const promises = [];
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
        const browser = await puppeteer_extra_1.default.launch({ defaultViewport: { width: 4000, height: 2000 } });
        for (const item of this.config.items || []) {
            if (!item.productName || !item.url)
                continue;
            const page = await browser.newPage();
            await page.goto(item.url);
            await page.waitForTimeout(2000);
            const record = await page.evaluate(() => {
                return [...document.querySelectorAll('body *')]
                    .map(createRecordFromElement)
                    .filter(canBePrice)
                    .sort(sortNodes);
                function createRecordFromElement(element) {
                    if (!element || !element.textContent)
                        return {};
                    const text = element.textContent.trim();
                    const boundingBox = element.getBoundingClientRect();
                    return {
                        x: boundingBox.x,
                        y: boundingBox.y,
                        text,
                        fontSize: boundingBox.x && boundingBox.y && text.length <= 30 ? parseInt(getComputedStyle(element)['fontSize']) : 0,
                    };
                }
                function canBePrice(record) {
                    return record['y'] < 600
                        && !!record['fontSize']
                        && !!record['text'].match(/€/)
                        && !!record['text'].match(/\d+/);
                }
                function sortNodes(a, b) {
                    if (a['fontSize'] === b['fontSize']) {
                        if (a['y'] === b['y']) {
                            if (a['x'] < b['x'])
                                return -1;
                            return 1;
                        }
                        if (a['y'] < b['y'])
                            return -1;
                        return 1;
                    }
                    if (a['fontSize'] > b['fontSize'])
                        return -1;
                    return 1;
                }
            });
            await page.screenshot({ path: 'ss.png' });
            await this.extendAdapterObjectAsync(item.productName, item.productName, 'channel');
            await this.createAdapterStateIfNotExistsAsync(`${item.productName}.price`, 'product price', 'number');
            if ((_a = record[0]) === null || _a === void 0 ? void 0 : _a.text) {
                await this.setStateAsync(`${item.productName}.price`, (0, currency_to_float_1.parse)((_b = record[0]) === null || _b === void 0 ? void 0 : _b.text), true);
            }
            console.log(record);
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
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    createAdapterStateIfNotExistsAsync(id, name, type) {
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
    extendAdapterObjectAsync(id, name, type) {
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
    module.exports = (options) => new ProductAlert(options);
}
else {
    // otherwise start the instance directly
    (() => new ProductAlert())();
}
//# sourceMappingURL=main.js.map