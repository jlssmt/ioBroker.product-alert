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
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
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
        const promises = [];
        for (const item of this.config.items || []) {
            if (!item.productName || !item.url || (!item.unavailableKeyword && !item.priceQuerySelector))
                continue;
            promises.push(axios_1.default.get(item.url)
                .then(res => {
                if (res.status !== 200)
                    throw new Error('URL not available.');
                return res.data;
            })
                .then(data => this.handlePriceDetection(data, item))
                .then(data => this.handleAvailable(data, item))
                .catch(err => this.log.error(err)));
        }
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
    createAdapterStateIfNotExists(id, name, type) {
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
    handleAvailable(data, item) {
        if (!data || !item || !item.unavailableKeyword)
            throw new Error();
        return this.createAdapterStateIfNotExists(item.productName + '.available', 'available', 'boolean')
            .then(() => !data.toLowerCase().includes(item.unavailableKeyword.toLowerCase()))
            .then(res => this.setStateAsync(item.productName + '.available', res, true))
            .then(() => data);
    }
    handlePriceDetection(data, item) {
        if (!data || !item || !item.priceQuerySelector)
            throw new Error();
        const $ = cheerio.load(data);
        return this.createAdapterStateIfNotExists(`${item.productName}.current-price`, 'current price', 'string')
            .then(() => this.setState(`${item.productName}.current-price`, $(item.priceQuerySelector).first().text().replace(/[^(\d|,|.)]/g, ''), true))
            .then(() => data);
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