import prisma from "../../clients/prisma";
import { Redisclient } from "../../clients/redis";

export class UserService {
  public static async followUser(from: string, to: string) {
    try {
      await prisma.follows.create({
        data: {
          followerId: from,
          followingId: to,
        },
      });
      await Redisclient.del(`followers:${to}`);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  public static async unfollowUser(from: string, to: string) {
    try {
      await prisma.follows.delete({
        where: {
          followerId_followingId: { followerId: from, followingId: to },
        },
      });
      await Redisclient.del(`followers:${to}`);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
