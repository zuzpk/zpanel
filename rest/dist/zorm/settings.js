"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const orm_1 = require("@zuzjs/orm");
let Settings = class Settings extends orm_1.BaseEntity {
    okey;
    value;
    stamp;
};
exports.Settings = Settings;
__decorate([
    (0, orm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Settings.prototype, "okey", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 155, default: "__" }),
    __metadata("design:type", String)
], Settings.prototype, "value", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 20, default: "0" }),
    __metadata("design:type", String)
], Settings.prototype, "stamp", void 0);
exports.Settings = Settings = __decorate([
    (0, orm_1.Entity)({ name: "settings" })
], Settings);
