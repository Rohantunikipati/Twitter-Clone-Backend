import { User } from "@prisma/client";
import JWT from "jsonwebtoken";
import { JWTUser } from "../../interfaces";

const JWT_SECRET = "Rohan1234";

export class JWT_Service {
  public static generate_JWT_Token(user: User) {
    const payload : JWTUser = {
      id: user?.id,
      email: user?.email,
    };
    const JWTtoken = JWT.sign(payload, JWT_SECRET);
    return JWTtoken;
  }

  public static decodeToken (token : string){
    return JWT.verify(token,JWT_SECRET) as JWTUser
  }
}
