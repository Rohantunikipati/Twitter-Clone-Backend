import axios from "axios";
import prisma from "../../clients/prisma";
import { JWT_Service } from "../Services/JWT";
import { User } from "@prisma/client";
import { APPContext } from "../../interfaces";
import { UserService } from "../Services/userServce";
import { Redisclient } from "../../clients/redis";

interface GoogleTokenType {
  iss: string;
  nbf: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  azp: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string;
  exp: string;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}

interface UserTypes {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  profilePic: string | null;
}

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleToken = token;

    const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleAuthUrl.searchParams.set("id_token", googleToken);
    const { data } = await axios.get<GoogleTokenType>(
      googleAuthUrl.toString(),
      {
        responseType: "json",
      }
    );
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    let createduser;
    if (!user) {
      createduser = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profilePic: data.picture,
        },
      });
    }
    const userInDb = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!userInDb) {
      throw new Error("User creation failed");
    }

    const user_token = JWT_Service.generate_JWT_Token(userInDb);
    return user_token;
  },

  getCurrentUser: async (parent: any, args: any, cntx: APPContext) => {
    const id = cntx.user?.id;
    if (!id) return null;

    const user = await prisma.user.findUnique({ where: { id } });
    console.log(user);
    return user;
  },
  getUserById: async (_: any, { id }: { id: string }) => {
    const cachedUser = await Redisclient.get(`userId:${id}`);
    if (cachedUser) return JSON.parse(cachedUser);
    const userById = await prisma.user.findUnique({ where: { id } });
    await Redisclient.set(`userId:${id}`, JSON.stringify(userById));
    return userById;
  },
};

export const mutations = {
  followUser: async (_: any, { to }: { to: string }, ctx: APPContext) => {
    if (!ctx.user) throw new Error("Un Authenticated");
    const from = ctx.user.id;
    return await UserService.followUser(from, to);
  },
  unfollowUser: async (_: any, { to }: { to: string }, ctx: APPContext) => {
    if (!ctx.user) throw new Error("Un Authenticated");
    const from = ctx.user.id;
    return await UserService.unfollowUser(from, to);
  },
};

const extraResolvers = {
  User: {
    tweets: async (parent: User) => {
      return await prisma.tweet.findMany({
        where:{
          authorId:parent.id
        }
      })
    },
    followers: async (parent: User) => {
      const cachedFollowers = await Redisclient.get(`followers:${parent.id}`);
      if (cachedFollowers) return JSON.parse(cachedFollowers);
      const followers = await prisma.follows.findMany({
        where: {
          followingId: parent.id,
        },
        include: {
          follower: true,
        },
      });
      const followersArray = followers.map(el => el.follower);
      await Redisclient.set(
        `followers:${parent.id}`,
        JSON.stringify(followersArray)
      );
      return followersArray;
    },
    following: async (parent: User) => {
      const following = await prisma.follows.findMany({
        where: {
          followerId: parent.id,
        },
        include: {
          following: true,
        },
      });
      return following.map(el => el.following);
    },
  },
};

export const resolvers = { queries, mutations, extraResolvers };
