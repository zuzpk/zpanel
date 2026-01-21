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
exports.PushTokens = void 0;
const orm_1 = require("@zuzjs/orm");
let PushTokens = class PushTokens extends orm_1.BaseEntity {
    ID;
    uid;
    hash;
    endpoint;
    p256dh;
    auth;
    stamp;
    status;
};
exports.PushTokens = PushTokens;
__decorate([
    (0, orm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PushTokens.prototype, "ID", void 0);
__decorate([
    (0, orm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], PushTokens.prototype, "uid", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 255, default: "_" }),
    __metadata("design:type", String)
], PushTokens.prototype, "hash", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 455, default: "_" }),
    __metadata("design:type", String)
], PushTokens.prototype, "endpoint", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 455, default: "_" }),
    __metadata("design:type", String)
], PushTokens.prototype, "p256dh", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 455, default: "_" }),
    __metadata("design:type", String)
], PushTokens.prototype, "auth", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 30, default: "0" }),
    __metadata("design:type", String)
], PushTokens.prototype, "stamp", void 0);
__decorate([
    (0, orm_1.Column)({ type: "tinyint" }),
    __metadata("design:type", Number)
], PushTokens.prototype, "status", void 0);
exports.PushTokens = PushTokens = __decorate([
    (0, orm_1.Entity)({ name: "push_tokens" })
], PushTokens);
