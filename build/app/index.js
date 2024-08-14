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
exports.init = void 0;
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const JWT_1 = require("./Services/JWT");
const user_1 = require("./user");
const tweets_1 = require("./tweets");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        app.use(body_parser_1.default.json());
        app.use((0, cors_1.default)());
        const graphqlServer = new server_1.ApolloServer({
            typeDefs: `
        ${user_1.User.types}
        ${tweets_1.Tweet.types}
        type Query{
            ${user_1.User.quries}
            ${tweets_1.Tweet.queries}
        }
        type Mutation{
          ${tweets_1.Tweet.mutations}
          ${user_1.User.mutations}
        }
    `,
            resolvers: Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, user_1.User.resolvers.queries), tweets_1.Tweet.resolvers.Queries), Mutation: Object.assign(Object.assign({}, tweets_1.Tweet.resolvers.Mutations), user_1.User.resolvers.mutations) }, tweets_1.Tweet.resolvers.extraResolvers), user_1.User.resolvers.extraResolvers),
        });
        yield graphqlServer.start();
        app.use("/graphql", (0, express4_1.expressMiddleware)(graphqlServer, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req, res }) {
                return {
                    user: req.headers.authorization
                        ? JWT_1.JWT_Service.decodeToken(req.headers.authorization.split(" ")[1])
                        : undefined,
                };
            }),
        }));
        return app;
    });
}
exports.init = init;