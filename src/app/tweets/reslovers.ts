import { Tweet } from "@prisma/client";
import prisma from "../../clients/prisma";
import { APPContext, tweetPayloadType } from "../../interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Redisclient } from "../../clients/redis";

const s3CLient = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA6GBMCNGZQO66EFJZ",
    secretAccessKey: "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",
  },
});

const Mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: tweetPayloadType },
    cxt: APPContext
  ) => {
    if (!cxt.user) throw new Error("Not Authenticated");
    const rateFalg = await Redisclient.get(`RateLimit${cxt.user.id}`);
    if (rateFalg) throw new Error("RateLimit Excided");
    const newTweet = await prisma.tweet.create({
      data: {
        content: payload.content,
        imageUrl: payload.imageUrl,
        author: { connect: { id: cxt.user.id } },
      },
    });
    await Redisclient.setex(
      `RateLimit${cxt.user.id}`,
      10,
      JSON.stringify(newTweet)
    );
    await Redisclient.del(`TweetsCreatedBy:${cxt.user.id}`);
    await Redisclient.del("ALL_Tweets");
    return newTweet;
  },
};

const Queries = {
  getAllTweets: async () => {
    const cachedTweets = await Redisclient.get("ALL_Tweets");
    if (cachedTweets) return JSON.parse(cachedTweets);

    const ALL_Tweets = await prisma.tweet.findMany({
      orderBy: { createdAt: "desc" },
    });

    await Redisclient.set("ALL_Tweets", JSON.stringify(ALL_Tweets));
    return ALL_Tweets;
  },
  getSignedUrlForTweet: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    cxt: APPContext
  ) => {
    if (!cxt.user) throw new Error("UnAuthneticated");
    const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageType))
      throw new Error("unsupported file type");

    const putObjectCommand = new PutObjectCommand({
      Bucket: "rohan-twitter-bucket",
      Key: `uploads/${
        cxt.user.id
      }/tweets/${imageName}-${Date.now()}.${imageType}`,
    });

    const signedUrl = await getSignedUrl(s3CLient, putObjectCommand);
    return signedUrl;
  },

  getAllTweetsByID: async (_: any, { id }: { id: string }) => {
    const cachedTweetsById = await Redisclient.get(`tweetsById:${id}`);
    if (cachedTweetsById) return JSON.parse(cachedTweetsById);
    const tweetsById = await prisma.tweet.findMany({
      where: {
        authorId: id,
      },
      orderBy: { createdAt: "desc" },
    });
    await Redisclient.set(`tweetsById:${id}`, JSON.stringify(tweetsById));
    return tweetsById;
  },
};

const extraResolvers = {
  Tweet: {
    author: async (parent: Tweet) => {
      return await prisma.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });
    },
  },
};

export const resolvers = { Mutations, extraResolvers, Queries };
