"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_Service = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "Rohan1234";
class JWT_Service {
    static generate_JWT_Token(user) {
        const payload = {
            id: user === null || user === void 0 ? void 0 : user.id,
            email: user === null || user === void 0 ? void 0 : user.email,
        };
        const JWTtoken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        return JWTtoken;
    }
    static decodeToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
}
exports.JWT_Service = JWT_Service;
