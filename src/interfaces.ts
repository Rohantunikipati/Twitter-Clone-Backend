export interface JWTUser {
  id: string;
  email: string;
}

export interface APPContext {
  user?: JWTUser;
}

export interface tweetPayloadType {
  content: string;
  imageUrl?: string;
}
