import mongoose from "mongoose";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { Profile, profileSchema } from "./profile.model";
import {
  EducationInput,
  ExperienceInput,
  LicenseInput,
} from "../helpers/types";

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
      bio: "",
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

export async function addExperience(input: ExperienceInput, userId: string) {
  const userProfile = await User.findById(userId);
  if (!userProfile) throw new Error("User not found");

  if (input) {
    const { jobTitle, institute, startDate, endDate } = input;
    if (jobTitle && institute && startDate) {
      userProfile.profile.experiences.push({
        jobTitle,
        institute,
        startDate,
        endDate,
      });
    }
  }

  await userProfile.save();
  return userProfile.profile;
}

export async function updateExperience(
  experienceId: string,
  input: ExperienceInput,
  userId: string,
) {
  await User.findOneAndUpdate(
    { _id: userId, "profile.experiences._id": experienceId },
    { $set: { "profile.experiences.$": input } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export async function deleteExperience(experienceId: string, userId: string) {
  await User.findByIdAndUpdate(
    userId,
    { $pull: { "profile.experiences": { _id: experienceId } } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export async function addEducation(input: EducationInput, userId: string) {
  const userProfile = await User.findById(userId);
  if (!userProfile) throw new Error("User not found");

  if (input) {
    const { name, institute, startDate, endDate } = input;
    if (name && institute && startDate) {
      userProfile.profile.education.push({
        name,
        institute,
        startDate,
        endDate,
      });
    }
  }

  await userProfile.save();
  return userProfile.profile;
}

export async function updateEducation(
  educationId: string,
  input: EducationInput,
  userId: string,
) {
  await User.findOneAndUpdate(
    { _id: userId, "profile.education._id": educationId },
    { $set: { "profile.education.$": input } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export async function deleteEducation(educationId: string, userId: string) {
  await User.findByIdAndUpdate(
    userId,
    { $pull: { "profile.education": { _id: educationId } } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export async function addLicense(input: LicenseInput, userId: string) {
  const userProfile = await User.findById(userId);
  if (!userProfile) throw new Error("User not found");

  if (input) {
    const { number, name, issuedBy, issuedAt, expiryDate } = input;
    if (number && name && issuedBy && issuedAt) {
      userProfile.profile.licenses.push({
        number,
        name,
        issuedBy,
        issuedAt,
        expiryDate,
      });
    }
  }

  await userProfile.save();
  return userProfile.profile;
}

export async function updateLicense(
  licenseId: string,
  input: LicenseInput,
  userId: string,
) {
  await User.findOneAndUpdate(
    { _id: userId, "profile.license._id": licenseId },
    { $set: { "profile.license.$": input } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export async function deleteLicense(licenseId: string, userId: string) {
  await User.findByIdAndUpdate(
    userId,
    { $pull: { "profile.license": { _id: licenseId } } },
    { new: true },
  );
  const updatedUser = await User.findById(userId).select("profile");
  return updatedUser?.profile;
}

export default User;
