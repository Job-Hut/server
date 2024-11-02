import mongoose from "mongoose";
import Application from "./application.model";
import User from "./user.model";

const replySchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const collectionSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  public: { type: Boolean, default: false },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  applications: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
    default: [],
  },
  threads: {
    type: [threadSchema],
    default: [],
  },
  chat: {
    type: [chatSchema],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
