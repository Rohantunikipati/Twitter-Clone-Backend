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
exports.resolvers = void 0;
const prisma_1 = __importDefault(require("../../clients/prisma"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const redis_1 = require("../../clients/redis");
const s3CLient = new client_s3_1.S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIA6GBMCNGZQO66EFJZ",
        secretAccessKey: "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",
    },
});
const Mutations = {
    createTweet: (parent_1, _a, cxt_1) => __awaiter(void 0, [parent_1, _a, cxt_1], void 0, function* (parent, { payload }, cxt) {
        if (!cxt.user)
            throw new Error("Not Authenticated");
        const rateFalg = yield redis_1.Redisclient.get(`RateLimit${cxt.user.id}`);
        if (rateFalg)
            throw new Error("RateLimit Excided");
        const newTweet = yield prisma_1.default.tweet.create({
            data: {
                content: payload.content,
                imageUrl: payload.imageUrl,
                author: { connect: { id: cxt.user.id } },
            },
        });
        yield redis_1.Redisclient.setex(`RateLimit${cxt.user.id}`, 10, JSON.stringify(newTweet));
        yield redis_1.Redisclient.del(`TweetsCreatedBy:${cxt.user.id}`);
        yield redis_1.Redisclient.del("ALL_Tweets");
        return newTweet;
    }),
};
const Queries = {
    getAllTweets: () => __awaiter(void 0, void 0, void 0, function* () {
        const cachedTweets = yield redis_1.Redisclient.get("ALL_Tweets");
        if (cachedTweets)
            return JSON.parse(cachedTweets);
        const ALL_Tweets = yield prisma_1.default.tweet.findMany({
            orderBy: { createdAt: "desc" },
        });
        yield redis_1.Redisclient.set("ALL_Tweets", JSON.stringify(ALL_Tweets));
        return ALL_Tweets;
    }),
    getSignedUrlForTweet: (parent_2, _b, cxt_2) => __awaiter(void 0, [parent_2, _b, cxt_2], void 0, function* (parent, { imageType, imageName }, cxt) {
        if (!cxt.user)
            throw new Error("UnAuthneticated");
        const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(imageType))
            throw new Error("unsupported file type");
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: "rohan-twitter-bucket",
            Key: `uploads/${cxt.user.id}/tweets/${imageName}-${Date.now()}.${imageType}`,
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3CLient, putObjectCommand);
        return signedUrl;
    }),
    getAllTweetsByID: (_1, _c) => __awaiter(void 0, [_1, _c], void 0, function* (_, { id }) {
        const cachedTweetsById = yield redis_1.Redisclient.get(`tweetsById:${id}`);
        if (cachedTweetsById)
            return JSON.parse(cachedTweetsById);
        const tweetsById = yield prisma_1.default.tweet.findMany({
            where: {
                authorId: id,
            },
            orderBy: { createdAt: "desc" },
        });
        yield redis_1.Redisclient.set(`tweetsById:${id}`, JSON.stringify(tweetsById));
        return tweetsById;
    }),
};
const extraResolvers = {
    Tweet: {
        author: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.default.user.findUnique({
                where: {
                    id: parent.authorId,
                },
            });
        }),
    },
};
exports.resolvers = { Mutations, extraResolvers, Queries };
