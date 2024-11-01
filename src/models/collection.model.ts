import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  collectionId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  organization: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  type: { type: String, required: true },
  tasks: [taskSchema],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
  name: { type: String, required: true },
  description: { type: String, required: true },
  public: { type: Boolean, required: true },
  ownerId: { type: String, required: true },
  sharedWith: { type: [String], required: true },
  applications: [applicationSchema],
  threads: [threadSchema],
  chat: [chatSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
