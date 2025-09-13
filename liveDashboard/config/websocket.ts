import { ServerOptions } from "socket.io";
import { WebSocketConfig } from "../src/types/dashboard";

export const websocketConfig: WebSocketConfig = {
  corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
  maxConnections: parseInt(process.env.WEBSOCKET_MAX_CONNECTIONS || "100"),
  heartbeatInterval: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL || "25000"),
  timeout: parseInt(process.env.WEBSOCKET_TIMEOUT || "60000"),
};

export const socketIOOptions: Partial<ServerOptions> = {
  cors: {
    origin: websocketConfig.corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
};

// Basic namespaces for MVP
export const namespaceConfig = {
  dashboard: "/dashboard"
};