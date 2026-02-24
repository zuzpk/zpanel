import { CancelTokenSource, AxiosRequestConfig, AxiosProgressEvent } from 'axios';
export { CancelTokenSource, AxiosProgressEvent as UploadProgressEvent } from 'axios';

type dynamic = {
    [x: string]: any;
};
interface FormatNumberParams {
    number: number | string;
    locale?: string;
    style?: `decimal` | `currency` | `percent`;
    decimal?: number;
    forceDecimal?: boolean;
    currency?: {
        code: string;
        style: `symbol` | `code` | `name`;
        symbol?: string;
    };
}
declare enum SORT {
    Asc = "ASC",
    Desc = "DESC"
}
type sortOptions = {
    direction?: SORT;
    caseSensitive?: boolean;
};
interface EventListener {
    fun: (...args: any[]) => void;
    context?: any;
    id: symbol;
}

interface Event {
    event: String | Symbol;
    listeners: Array<EventListener>;
}
declare class Events {
    _events: Event[];
    constructor();
    /**
     * Registers an event listener.
     * @param event The name of the event.
     * @param fun The callback function.
     * @param context Optional context (this) for the callback.
     * @returns A function to unsubscribe this specific listener.
     */
    on(event: String | Symbol, fun: (...args: any[]) => void, context?: any): () => void;
    /**
     * Removes event listeners matching a specific event and function.
     * Note: This removes *all* listeners for the event that use the exact same function reference.
     * It's often more reliable to use the unsubscribe function returned by 'on'.
     * @param event The name of the event.
     * @param fun The callback function to remove.
     */
    off(event: String | Symbol, fun: (...args: any[]) => void): void;
    /**
     * Emits an event, calling all registered listeners.
     * @param event The name of the event.
     * @param args Arguments to pass to the listeners.
     */
    emit(event: String | Symbol, ...args: any[]): void;
    /**
     * Removes all listeners for a specific event.
     * @param event The name of the event.
     */
    removeAllListeners(event: String | Symbol): void;
}

declare class withGlobals {
    _: any;
    constructor(value: any);
    isIP(): boolean;
    isIPv4(): boolean;
    isIPv6(): boolean;
    isTypeof(v: any): boolean;
    isFunction(): boolean;
    isArray(): boolean;
    isNull(): boolean;
    isString(): boolean;
    isNumber(): boolean;
    isObject(): boolean;
    isEmpty(): boolean;
    isEmail(): boolean;
    isUrl(): boolean;
    toLowerCase(): this;
    /**
     * Performs a deep equality check for arrays and objects, otherwise a strict equality check.
     * @param v The value to compare against.
     * @returns {boolean} True if the values are equal, false otherwise.
     */
    equals(v: any): boolean;
    private isObjectValue;
    ucfirst(): this;
    formatString(v: string | number, ...vv: (string | number)[]): this;
    camelCase(): this;
    /**
     * Sorts the keys of the internal object in ascending or descending order.
     * If the internal value is not an object, it remains unchanged.
     * @param order The sort order: 'asc' for ascending (default), 'desc' for descending.
     * @returns {this} The current instance for chaining.
     */
    sort(order?: 'asc' | 'desc'): this;
    value(): any;
    valueOf(): any;
    toString(): string;
    [Symbol.toPrimitive](hint: string): string | number | boolean;
}
declare const _: <T>(value: T) => withGlobals;

declare const __SALT: string;

declare const numberInRange: (min: number, max: number) => number;
declare const toHash: (n: number, len?: number, SALT?: string | null) => string;
declare const fromHash: (str: string, SALT?: string | null) => number;
declare const MD5: (str: string) => string;
declare const uuid: (len: number) => string;
declare const ucfirst: (o: any) => string;
declare const urldecode: (str: string) => string;
declare const urlencode: (str: string) => string;
declare const pluralize: (word: string, count: number) => string;
declare const isHexColor: (color: string) => boolean;
declare const isRgbaColor: (color: string) => boolean;
declare const isHslColor: (color: string) => boolean;
declare const isColorName: (color: string) => boolean;
declare const isColor: (color: string) => boolean;
declare const hexToRgba: (hex: string, alpha?: number) => string;
declare const removeDuplicates: <T>(array: T[]) => T[];
declare const getCancelToken: () => CancelTokenSource;
declare const withCredentials: (include: boolean) => boolean;
declare const withPost: <T>(uri: string, data: any, // 'dynamic' usually maps to 'any' or 'Record<string, any>'
timeout?: number, ignoreKind?: boolean, headers?: AxiosRequestConfig["headers"], onProgress?: (ev: AxiosProgressEvent) => void) => Promise<T>;
declare const withGet: <T>(uri: string, timeout?: number, ignoreKind?: boolean, headers?: AxiosRequestConfig["headers"]) => Promise<T>;
declare const withTime: (fun: (...args: any[]) => any) => {
    result: any;
    executionTime: number;
};
declare const time: (stamp?: number, format?: string) => string;
declare const timeSince: (stamp: number) => string;
declare const arrayRand: (arr: any[]) => any;
declare const formatNumber: ({ number, locale, style, decimal, forceDecimal, currency }: FormatNumberParams) => string;
declare const formatSize: (bytes: number | string) => string;
declare const copyToClipboard: (text: string) => Promise<unknown>;
declare const natsort: (options?: sortOptions) => (a: string | number, b: string | number) => number;
declare const camelCase: (str: string, ucf?: boolean) => string;
declare const camelCaseToDash: (str: string) => string;
declare const clamp: (value: number, min: number, max: number) => number;
declare const slugify: (text: string, separator?: string) => string;
declare const sleep: (ms: number) => Promise<any>;
declare const enumToKeys: <T extends Record<string, any>>(obj: T) => Array<keyof T>;
declare const exists: (path: string) => Promise<boolean>;
declare const urlBase64ToUint8Array: (base64String: string) => Uint8Array;
declare const checkPasswordStrength: (password: string) => {
    score: number;
    result: string;
    suggestion: string[];
};

export { _ as "_", type EventListener, type FormatNumberParams, MD5, Events as PubSub, SORT, __SALT, arrayRand, camelCase, camelCaseToDash, checkPasswordStrength, clamp, copyToClipboard, type dynamic, enumToKeys, exists, formatNumber, formatSize, fromHash, getCancelToken, hexToRgba, isColor, isColorName, isHexColor, isHslColor, isRgbaColor, natsort, numberInRange, pluralize, removeDuplicates, sleep, slugify, type sortOptions, time, timeSince, toHash, ucfirst, urlBase64ToUint8Array, urldecode, urlencode, uuid, withCredentials, withGet, withPost, withTime };
