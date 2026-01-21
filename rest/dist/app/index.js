"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploader = void 0;
exports.Cog = Cog;
const lib_1 = require("../lib");
const zorm_1 = __importStar(require("../zorm"));
const core_1 = require("@zuzjs/core");
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, `../../storage/cache`));
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originlname).toLowerCase();
        cb(null, `${Date.now()}-${(0, uuid_1.v4)()}${ext}`);
    }
});
async function Cog(okey, defaultValue) {
    let query = zorm_1.default.find(zorm_1.Settings);
    if ((0, core_1._)(okey).isArray()) {
        okey.forEach((ok, i) => {
            console.log(`-`, ok);
            if (i == 0)
                query.where({ okey: ok });
            else
                query.or({ okey: ok });
        });
    }
    else
        query.where({ okey: okey });
    const _value = (val) => {
        return [`1`, `0`].includes(val) ?
            (val == `1`)
            : val.includes(process.env.SEPERATOR) ? (0, lib_1.withoutSeperator)(val) : val;
    };
    const get = await query;
    if (get.hasRows) {
        if (get.rows && get.rows.length > 1) {
            const vals = {};
            get.rows.forEach((r) => {
                vals[r.okey] = _value(r.value);
            });
            return vals;
        }
        else
            return _value(get.row.value);
    }
    else if (typeof okey === `string` && defaultValue && !(0, core_1._)(okey).isArray()) {
        await zorm_1.default.create(zorm_1.Settings).with({
            okey,
            value: `boolean` === typeof defaultValue ? String(defaultValue == true ? 1 : 0) : String(defaultValue)
        });
        return defaultValue;
    }
}
exports.uploader = (0, multer_1.default)({ storage });
