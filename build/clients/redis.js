"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redisclient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.Redisclient = new ioredis_1.default("rediss://default:Aa_VAAIncDFiNWI2OTIzMjllMjQ0OGM5ODEzMjA4ZDUzNmQxY2ExY3AxNDUwMTM@tidy-raptor-45013.upstash.io:6379");
