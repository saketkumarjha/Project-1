import 'express-session';

declare module 'express-session' {
  interface SessionData {
    views: number;
    userId?: string;
    userRole?: string;
    // Add other session properties as needed
  }
}