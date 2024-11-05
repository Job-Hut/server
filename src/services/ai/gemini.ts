import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../config/config";

export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export default model;
