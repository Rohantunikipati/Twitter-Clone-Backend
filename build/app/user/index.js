"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const types_1 = require("./types");
const queries_1 = require("./queries");
const reslovers_1 = require("./reslovers");
const mutation_1 = require("./mutation");
exports.User = { types: types_1.types, quries: queries_1.quries, resolvers: reslovers_1.resolvers, mutations: mutation_1.mutations };
