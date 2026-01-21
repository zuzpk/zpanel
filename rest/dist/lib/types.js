"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZuzAppStatus = exports.UserStatus = exports.UserType = void 0;
require("express");
var UserType;
(function (UserType) {
    UserType[UserType["Guest"] = 0] = "Guest";
    UserType[UserType["User"] = 1] = "User";
    UserType[UserType["Admin"] = 2] = "Admin";
})(UserType || (exports.UserType = UserType = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus[UserStatus["InActive"] = 0] = "InActive";
    UserStatus[UserStatus["Active"] = 1] = "Active";
    UserStatus[UserStatus["Banned"] = -1] = "Banned";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var ZuzAppStatus;
(function (ZuzAppStatus) {
    ZuzAppStatus["Running"] = "running";
    ZuzAppStatus["Stopped"] = "stopped";
    ZuzAppStatus["Failed"] = "failed";
    ZuzAppStatus["Restarting"] = "restarting";
    ZuzAppStatus["Unknown"] = "unknown";
})(ZuzAppStatus || (exports.ZuzAppStatus = ZuzAppStatus = {}));
