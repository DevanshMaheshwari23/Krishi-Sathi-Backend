import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export const signToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret);
  return decoded as JwtPayload;
};
