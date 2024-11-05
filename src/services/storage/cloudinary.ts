import { v2 as cloudinary } from "cloudinary";
import { FileUpload } from "graphql-upload-ts";
import { streamToBase64 } from "../../helpers/encoder";
import config from "../../config/config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const upload = async (file: FileUpload): Promise<string> => {
  const { createReadStream, mimetype } = await file;
  const stream = createReadStream();
  const base64 = await streamToBase64(stream);
  const fileUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(fileUri, {
    folder: "jobhut/avatars",
  });

  return result.secure_url;
};
