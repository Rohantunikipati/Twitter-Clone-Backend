import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import { JWT_Service } from "./Services/JWT";

import { User } from "./user";
import { Tweet } from "./tweets";

export async function init() {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());
  const graphqlServer = new ApolloServer({
    typeDefs: `
        ${User.types}
        ${Tweet.types}
        type Query{
            ${User.quries}
            ${Tweet.queries}
        }
        type Mutation{
          ${Tweet.mutations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.Queries,
      },
      Mutation: {
        ...Tweet.resolvers.Mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    },
  });
  await graphqlServer.start();
  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWT_Service.decodeToken(req.headers.authorization.split(" ")[1])
            : undefined,
        };
      },
    })
  );

  return app;
}
