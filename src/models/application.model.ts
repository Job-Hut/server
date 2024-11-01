import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, default: null },
  description: { type: String, default: null },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  collectionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  jobTitle: { type: String, default: null },
  description: { type: String, default: null },
  organizationName: { type: String, default: null },
  organizationAddress: { type: String, default: null },
  organizationLogo: { type: String, default: null },
  location: { type: String, default: null },
  salary: { type: Number, default: null },
  type: { type: String, default: null },
  tasks: [taskSchema],
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Application = mongoose.model("Application", applicationSchema);
export default Application;
