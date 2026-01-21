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
exports.UsersSess = exports.Status = exports.Isadmin = void 0;
const orm_1 = require("@zuzjs/orm");
var Isadmin;
(function (Isadmin) {
    Isadmin["Yes"] = "yes";
    Isadmin["No"] = "no";
})(Isadmin || (exports.Isadmin = Isadmin = {}));
var Status;
(function (Status) {
    Status["Yes"] = "yes";
    Status["No"] = "no";
})(Status || (exports.Status = Status = {}));
let UsersSess = class UsersSess extends orm_1.BaseEntity {
    ID;
    uid;
    token;
    expiry;
    uinfo;
    isadmin;
    status;
};
exports.UsersSess = UsersSess;
__decorate([
    (0, orm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UsersSess.prototype, "ID", void 0);
__decorate([
    (0, orm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], UsersSess.prototype, "uid", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 455, default: "none" }),
    __metadata("design:type", String)
], UsersSess.prototype, "token", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 50, default: "0" }),
    __metadata("design:type", String)
], UsersSess.prototype, "expiry", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 255, default: "none" }),
    __metadata("design:type", String)
], UsersSess.prototype, "uinfo", void 0);
__decorate([
    (0, orm_1.Column)({ type: "enum", enum: Isadmin, default: "no" }),
    __metadata("design:type", String)
], UsersSess.prototype, "isadmin", void 0);
__decorate([
    (0, orm_1.Column)({ type: "enum", enum: Status, default: "yes" }),
    __metadata("design:type", String)
], UsersSess.prototype, "status", void 0);
exports.UsersSess = UsersSess = __decorate([
    (0, orm_1.Entity)({ name: "users_sess" })
], UsersSess);
