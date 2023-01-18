import Redis from "ioredis";
import { config } from "./config";

export const redis = config.REDIS_HOST
    ? new Redis({
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          ...(config.REDIS_PASSWORD && { password: config.REDIS_PASSWORD }),
          connectTimeout: 500,
          maxRetriesPerRequest: 1,
          keyPrefix: "metahkg:",
      })
    : null;
