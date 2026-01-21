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
exports.Users = exports.Gender = exports.Utype = void 0;
const orm_1 = require("@zuzjs/orm");
var Utype;
(function (Utype) {
    Utype["Admin"] = "admin";
    Utype["User"] = "user";
    Utype["Moderator"] = "moderator";
})(Utype || (exports.Utype = Utype = {}));
var Gender;
(function (Gender) {
    Gender["Unknown"] = "unknown";
    Gender["Male"] = "male";
    Gender["Female"] = "female";
})(Gender || (exports.Gender = Gender = {}));
let Users = class Users extends orm_1.BaseEntity {
    ID;
    token;
    ucode;
    utype;
    permissions;
    email;
    password;
    fullname;
    picture;
    gender;
    dob;
    reff;
    timezone;
    joined;
    signin;
    status;
};
exports.Users = Users;
__decorate([
    (0, orm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Users.prototype, "ID", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "token", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 20, default: "xxxxxx" }),
    __metadata("design:type", String)
], Users.prototype, "ucode", void 0);
__decorate([
    (0, orm_1.Column)({ type: "enum", enum: Utype, default: "user" }),
    __metadata("design:type", String)
], Users.prototype, "utype", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 355, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "permissions", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 155, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "email", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 155, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "password", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "fullname", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "no-dp.png" }),
    __metadata("design:type", String)
], Users.prototype, "picture", void 0);
__decorate([
    (0, orm_1.Column)({ type: "enum", enum: Gender, default: "unknown" }),
    __metadata("design:type", String)
], Users.prototype, "gender", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 10, default: "00-00-0000" }),
    __metadata("design:type", String)
], Users.prototype, "dob", void 0);
__decorate([
    (0, orm_1.Column)({ type: "int", nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Users.prototype, "reff", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "UTC" }),
    __metadata("design:type", String)
], Users.prototype, "timezone", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "joined", void 0);
__decorate([
    (0, orm_1.Column)({ type: "varchar", length: 100, default: "none" }),
    __metadata("design:type", String)
], Users.prototype, "signin", void 0);
__decorate([
    (0, orm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], Users.prototype, "status", void 0);
exports.Users = Users = __decorate([
    (0, orm_1.Entity)({ name: "users" })
], Users);
