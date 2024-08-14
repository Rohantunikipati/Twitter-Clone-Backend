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
exports.resolvers = exports.mutations = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../../clients/prisma"));
const JWT_1 = require("../Services/JWT");
const userServce_1 = require("../Services/userServce");
const redis_1 = require("../../clients/redis");
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const googleToken = token;
        const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
        googleAuthUrl.searchParams.set("id_token", googleToken);
        const { data } = yield axios_1.default.get(googleAuthUrl.toString(), {
            responseType: "json",
        });
        const user = yield prisma_1.default.user.findUnique({ where: { email: data.email } });
        let createduser;
        if (!user) {
            createduser = yield prisma_1.default.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profilePic: data.picture,
                },
            });
        }
        const userInDb = yield prisma_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!userInDb) {
            throw new Error("User creation failed");
        }
        const user_token = JWT_1.JWT_Service.generate_JWT_Token(userInDb);
        return user_token;
    }),
    getCurrentUser: (parent, args, cntx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const id = (_b = cntx.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id)
            return null;
        const user = yield prisma_1.default.user.findUnique({ where: { id } });
        console.log(user);
        return user;
    }),
    getUserById: (_1, _c) => __awaiter(void 0, [_1, _c], void 0, function* (_, { id }) {
        const cachedUser = yield redis_1.Redisclient.get(`userId:${id}`);
        if (cachedUser)
            return JSON.parse(cachedUser);
        const userById = yield prisma_1.default.user.findUnique({ where: { id } });
        yield redis_1.Redisclient.set(`userId:${id}`, JSON.stringify(userById));
        return userById;
    }),
};
exports.mutations = {
    followUser: (_2, _d, ctx_1) => __awaiter(void 0, [_2, _d, ctx_1], void 0, function* (_, { to }, ctx) {
        if (!ctx.user)
            throw new Error("Un Authenticated");
        const from = ctx.user.id;
        return yield userServce_1.UserService.followUser(from, to);
    }),
    unfollowUser: (_3, _e, ctx_2) => __awaiter(void 0, [_3, _e, ctx_2], void 0, function* (_, { to }, ctx) {
        if (!ctx.user)
            throw new Error("Un Authenticated");
        const from = ctx.user.id;
        return yield userServce_1.UserService.unfollowUser(from, to);
    }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.default.tweet.findMany({
                where: {
                    authorId: parent.id
                }
            });
        }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const cachedFollowers = yield redis_1.Redisclient.get(`followers:${parent.id}`);
            if (cachedFollowers)
                return JSON.parse(cachedFollowers);
            const followers = yield prisma_1.default.follows.findMany({
                where: {
                    followingId: parent.id,
                },
                include: {
                    follower: true,
                },
            });
            const followersArray = followers.map(el => el.follower);
            yield redis_1.Redisclient.set(`followers:${parent.id}`, JSON.stringify(followersArray));
            return followersArray;
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const following = yield prisma_1.default.follows.findMany({
                where: {
                    followerId: parent.id,
                },
                include: {
                    following: true,
                },
            });
            return following.map(el => el.following);
        }),
    },
};
exports.resolvers = { queries, mutations: exports.mutations, extraResolvers };
