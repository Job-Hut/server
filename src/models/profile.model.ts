import mongoose from "mongoose";

export const profileSchema = new mongoose.Schema({
    location: {
      type: String,
    },
    experiences: [
      {
        jobTitle: {
          type: String,
          required: true
        },
        institute: {
          type: String,
          required: true
        },
        startDate: {
          type: Date, 
          required: true
        },
        endDate: {
          type: Date, 
        },
      },
    ],
    education: [
      {
        name: {
          type: String,
          required: true
        },
        institute: {
          type: String,
          required: true
        },
        startDate: {
          type: Date, 
          required: true
        },
        endDate: {
          type: Date, 
          required: true
        },
      },
    ],
    licenses: [
      {
        number: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        issuedBy: {
          type: String,
          required: true
        },
        issuedAt: {
          type: Date, 
          required: true
        },
        expiryDate: {
          type: Date, 
          required: true
        },
      },
    ],
  }, { timestamps: true });
  
  export const Profile = mongoose.model("Profile", profileSchema);