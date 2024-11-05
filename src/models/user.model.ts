import mongoose from "mongoose";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { Profile, profileSchema } from "./profile.model";
import {
  EducationInput,
  ExperienceInput,
  LicenseInput,
} from "../helpers/types";
import validatePassword from "../helpers/validatePassword";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
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
    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export async function register(
  username: string,
  avatar: string | undefined,
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

    avatar = avatar || ""; 

    validatePassword(password)

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already in use.");
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new Error("Username is already taken.");
    }

    const hashedPassword = hashPassword(password);

    const newUserProfile = new Profile({
      bio: "",
      location: "",
      jobPrefs: [],
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

type Input = {
  _id?: string;
} & (ExperienceInput | EducationInput | LicenseInput | { _id: string });


async function updateProfileField(userId: string, input: Input, field: string, action: string, requiredFields: string[]) {
  const userProfile = await User.findById(userId);
  if (!userProfile) throw new Error("User not found");

  if (input) {
    const missingFields = requiredFields.filter(field => !input[field]);
    if (missingFields.length > 0) {
      throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
    }

    switch (action) {
      case "add":
        userProfile.profile[field].push(input);
        break;
      case "update":
        await User.findOneAndUpdate(
          { _id: userId, [`profile.${field}._id`]: input._id },
          { $set: { [`profile.${field}.$`]: input } },
          { new: true }
        );
        break;
      case "delete":
        await User.findByIdAndUpdate(
          userId,
          { $pull: { [`profile.${field}`]: { _id: input._id } } },
          { new: true }
        );
        break;
      default:
        throw new Error("Invalid action");
    }
  }

  await userProfile.save().catch(error => {
    throw new Error("Failed to save user. Please try again later." + error.message);
  });

  const updatedUserProfile = await User.findById(userId).select(`profile`);

  return updatedUserProfile.profile;
}

export async function addExperience(input: ExperienceInput, userId: string) {
  return updateProfileField(userId, input, "experiences", "add", ["jobTitle", "institute", "startDate"]);
}

export async function updateExperience(experienceId: string, input: ExperienceInput, userId: string) {
  return updateProfileField(userId, { ...input, _id: experienceId }, "experiences", "update", ["jobTitle", "institute", "startDate"]);
}

export async function deleteExperience(experienceId: string, userId: string) {
  return updateProfileField(userId, { _id: experienceId }, "experiences", "delete", []);
}

export async function addEducation(input: EducationInput, userId: string) {
  return updateProfileField(userId, input, "education", "add", ["name", "institute", "startDate"]);
}

export async function updateEducation(educationId: string, input: EducationInput, userId: string) {
  return updateProfileField(userId, { ...input, _id: educationId }, "education", "update", ["name", "institute", "startDate"]);
}

export async function deleteEducation(educationId: string, userId: string) {
  return updateProfileField(userId, { _id: educationId }, "education", "delete", []);
}

export async function addLicense(input: LicenseInput, userId: string) {
  return updateProfileField(userId, input, "licenses", "add", ["number", "name", "issuedBy", "issuedAt"]);
}

export async function updateLicense(licenseId: string, input: LicenseInput, userId: string) {
  return updateProfileField(userId, { ...input, _id: licenseId }, "licenses", "update", ["number", "name", "issuedBy", "issuedAt"]);
}

export async function deleteLicense(licenseId: string, userId: string) {
  return updateProfileField(userId, { _id: licenseId }, "licenses", "delete", []);
}

export default User;