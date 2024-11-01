export type User = {
  _id: string;
  username: string;
  avatar: string;
  fullName: string;
  email: string;
  password: string;
};

export type Profile = {
  _id: string;
  bio: string;
  location: string;
  experiences: [Experience];
  education: [Education];
  licenses: [License];
  createdAt: Date;
  updatedAt: Date;
};

type Experience = {
  _id: string;
  jobTitle: string;
  institute: string;
  startDate: Date;
  endDate: Date;
};

type Education = {
  _id: string;
  name: string;
  institute: string;
  startDate: Date;
  endDate: Date;
};

type License = {
  _id: string;
  number: string;
  name: string;
  issuedBy: string;
  issuedAt: Date;
  expiryDate: Date;
};

export type RegisterInput = {
  username: string;
  avatar: string;
  fullName: string;
  email: string;
  password: string;
};

export type ExperienceInput = {
  jobTitle: string;
  institute: string;
  startDate: Date;
  endDate: Date;
};

export type EducationInput = {
  name: string;
  institute: string;
  startDate: Date;
  endDate?: Date;
};

export type LicenseInput = {
  number: string;
  name: string;
  issuedBy: string;
  issuedAt: Date;
  expiryDate?: Date;
};

export type Context = {
  authentication: () => Promise<User | null>;
};