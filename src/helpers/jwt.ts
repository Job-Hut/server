import jwt from "jsonwebtoken";
import config from "../config/config";

type Payload = {
  _id: string;
  username: string;
  email: string;
};

export const signToken = (payload: Payload) => {
  return jwt.sign(payload, config.app.secret);
};

export const verifyToken = (token: string) => {
  const decoded = jwt.verify(token, config.app.secret);
  return decoded as Payload;
};
