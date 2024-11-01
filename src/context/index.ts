import { verifyToken } from "../helpers/jwt";
import User from "../models/user.model";

export const createContext = async ({ req }) => {
  return {
    authentication: async () => {
      const authorization = req.headers.authorization;
      if (!authorization) throw new Error("You have to login first!");
      const token = authorization.split(" ")[1];
      if (!token) throw new Error("Invalid Token");
      const decoded = verifyToken(token);
      const user = await User.findById(decoded._id);
      return user;
    },
  };
};
