"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../../clients/prisma"));
const redis_1 = require("../../clients/redis");
class UserService {
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.follows.create({
                    data: {
                        followerId: from,
                        followingId: to,
                    },
                });
                yield redis_1.Redisclient.del(`followers:${to}`);
                return true;
            }
            catch (error) {
                console.log(error);
                return false;
            }
        });
    }
    static unfollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.follows.delete({
                    where: {
                        followerId_followingId: { followerId: from, followingId: to },
                    },
                });
                yield redis_1.Redisclient.del(`followers:${to}`);
                return true;
            }
            catch (error) {
                console.log(error);
                return false;
            }
        });
    }
}
exports.UserService = UserService;
