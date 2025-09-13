import Redis from "ioredis";
import { RedisConfig } from "../src/types/dashboard";

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  clusterMode: false
};

export const createRedisConnection = (): Redis => {
  const redis = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
  });

  redis.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  return redis;
};