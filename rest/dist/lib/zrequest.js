"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withZuzRequest = void 0;
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LANGS_DIR = path_1.default.join(__dirname, "..", "app", "langs");
const languages = {};
fs_1.default.readdirSync(LANGS_DIR).forEach((file) => {
    if (!file.startsWith(`_`) && file.endsWith(".js")) {
        const langCode = path_1.default.basename(file, path_1.default.extname(file));
        languages[langCode] = require(path_1.default.join(LANGS_DIR, file)).default;
    }
});
const withZuzRequest = async (req, res, next) => {
    const langCode = req.signedCookies.lang || config_1.DEFAULT_LANG;
    req.lang = languages[langCode] || languages[config_1.DEFAULT_LANG];
    next();
};
exports.withZuzRequest = withZuzRequest;
