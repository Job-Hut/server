import { Readable } from "stream";

export const streamToBase64 = async (stream: Readable): Promise<string> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("base64");
};
