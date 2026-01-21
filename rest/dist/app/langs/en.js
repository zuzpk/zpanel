"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _account_js_1 = __importDefault(require("./_account.js"));
const _apps_js_1 = __importDefault(require("./_apps.js"));
const Lang = {
    youAreLost: `you are lost buddy.`,
    apiWrongMethod: `almost there :) try again with correct method.`,
    apiWrongAction: `almost there :) try again with correct action.`,
    serverBusy: `This is not you. this is us.`,
    unauthorized: `Well played!. You are not authorized for this action`,
    accessdenied: `It looks like you don’t have permission to be here.`,
    webPushWelcomeTitle: "Welcome aboard!",
    webPushWelcomeMessage: "You're all set! Get ready for real-time updates.",
    ..._account_js_1.default,
    ..._apps_js_1.default,
};
exports.default = Lang;
