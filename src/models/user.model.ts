import mongoose from "mongoose";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { Profile, profileSchema } from "./profile.model";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      type: profileSchema,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

type User = {
  username: string;
  avatar: string;
  fullName: string;
  email: string;
  password: string;
};

export async function register(
  username: string,
  avatar: string,
  fullName: string,
  email: string,
  password: string,
) {
  try {
    const isEmailValid = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    if (!isEmailValid(email)) {
      throw new Error("Invalid email format.");
    }

    if (!fullName || !username || !email || !password) {
      throw new Error("All fields are required.");
    }

    // todo default fallback image
    if (!avatar) {
      avatar = "";
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("Email already in use.");
    }

    const hashedPassword = hashPassword(password);

    const newUserProfile = new Profile({
      location: "",
      experiences: [],
      education: [],
      licenses: [],
    });

    const newUser = new User({
      username,
      avatar,
      fullName,
      email,
      password: hashedPassword,
      profile: newUserProfile,
    });

    await newUser.save();

    return newUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid Email/Password");
  const isPasswordValid = comparePassword(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid Email/Password");
  return user;
}

export default User;
