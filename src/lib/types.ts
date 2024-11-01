import { ObjectId } from "mongoose";

export interface License {
  _id: ObjectId;
  name: string;
  institute: string;
  issuedAt: Date;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  _id: ObjectId;
  degree: string;
  fieldOfStudy: string;
  institute: string;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  _id: ObjectId;
  jobTitle: string;
  organization: string;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  bio: string;
  location: string;
  experiences: Experience[];
  educations: Education[];
  licenses: License[];
}

export interface User {
  _id: ObjectId;
  username: string;
  avatar: string;
  fullName: string;
  email: string;
  password: string;
  profile: Profile;
  collections: Collection | ObjectId[];
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reply {
  _id: ObjectId;
  authorId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Thread {
  _id: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId;
  replies: Reply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: ObjectId;
  senderId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  _id: ObjectId;
  name: string;
  description: string;
  public: boolean;
  ownerId: ObjectId;
  sharedWith: User | ObjectId[];
  applications: Application | ObjectId[];
  threads: Thread[];
  chat: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  _id: ObjectId;
  ownerId: ObjectId;
  collectionId: ObjectId;
  jobTitle: string;
  description: string;
  organizationName: string;
  organizationAddress: string;
  organizationLogo: string;
  location: string;
  salary: number;
  type: string;
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: ObjectId;
  title: string;
  description: string;
  completed: boolean;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobVacancy {
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  description: string;
  since: string;
  salary?: string;
  source: string;
}
