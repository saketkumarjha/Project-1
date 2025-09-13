# Hospital Management System - Backend

## Overview

This is the backend API for the Hospital Patient Management System built with Node.js, Express, TypeScript, and MongoDB.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Development**: Nodemon for hot reloading

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route handlers and business logic
│   ├── middleware/      # Custom middleware (CORS, error handling)
│   ├── models/          # Mongoose models and schemas
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Main application entry point
├── dist/                # Compiled JavaScript output
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── nodemon.json         # Nodemon configuration
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://22mc3043_db_user:oeakiQYPRuQFMomS@project1.nmkxmgf.mongodb.net/?retryWrites=true&w=majority&appName=Project1
FRONTEND_URL=http://localhost:5173
```

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (placeholder)

## API Endpoints

### Health Check

- `GET /api/health` - Server health status

### Future Endpoints (to be implemented)

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/workflows` - List patient workflows
- `GET /api/rooms` - List rooms with patient assignments
- `GET /api/dashboard` - Dashboard statistics

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **MongoDB Setup:**
   The project is configured to use MongoDB Atlas cloud database. No local MongoDB installation required.

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

## Development

- The server runs on port 5000 by default
- Nodemon automatically restarts the server when files change
- TypeScript files are compiled on-the-fly during development
- CORS is configured to allow requests from the frontend (port 5173)

## Database

- Uses MongoDB with Mongoose ODM
- Connection configured in `src/config/database.ts`
- Models will be defined in `src/models/` directory
- Automatic connection retry and error handling

## Error Handling

- Global error handler middleware
- Structured error responses
- Development vs production error details
- 404 handler for undefined routes

## Next Steps

1. Implement database models (Patient, Appointment, Workflow, Room)
2. Create API routes and controllers
3. Add input validation and sanitization
4. Implement authentication and authorization
5. Add comprehensive error handling
6. Write unit and integration tests
