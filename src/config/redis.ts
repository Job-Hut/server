import Redis from "ioredis";
import config from "./config";

const redis = new Redis({
  host: config.redis.host,
  port: +config.redis.port,
}).on("error", (error) => {
  console.error(error);
}).on("connect", () => {
  console.log("Connected to Redis");
});

export default redis;
