import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const collectionSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  applications: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
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
