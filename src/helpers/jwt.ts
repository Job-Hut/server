import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

type Payload = {
  id: string;
  username: string;
  email: string;
};

export const signToken = (payload: Payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
