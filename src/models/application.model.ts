import mongoose from "mongoose";
import Collection from "./collection.model";
import User from "./user.model";

const taskSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    default: [],
  },
  jobTitle: { type: String, default: "" },
  description: { type: String, default: "" },
  organizationName: { type: String, default: "" },
  organizationAddress: { type: String, default: "" },
  organizationLogo: { type: String, default: "" },
  location: { type: String, default: "" },
  salary: { type: Number, default: 0 },
  type: { type: String, default: "" },
  tasks: { type: [taskSchema], default: [] },
  startDate: { type: Date, default: "" },
  endDate: { type: Date, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Application = mongoose.model("Application", applicationSchema);
export default Application;
