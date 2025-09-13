# 🚀 Real-Time Live Dashboard System

## 📋 Overview

A dedicated real-time dashboard service for hospital administrators that provides live data updates without impacting the main HTTP server performance. This system uses WebSocket connections, Redis caching, and MongoDB change streams for optimal real-time data delivery.

## 🎯 Key Features

- **Real-time Data Updates** - Live statistics without page refresh
- **Performance Isolation** - Separate service to protect main server
- **Redis Caching** - Fast data retrieval for frequent updates
- **MongoDB Change Streams** - Real-time database change detection
- **WebSocket Communication** - Bi-directional real-time communication
- **Admin Authentication** - Secure access control
- **Scalable Architecture** - Horizontal scaling support

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Client  │◄──►│  Live Dashboard │◄──►│   Redis Cache   │
│   (WebSocket)   │    │     Service     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │ (Change Streams)│
                       └─────────────────┘
```

## 📊 Real-Time Metrics

### **Core Dashboard Metrics:**

- Patient registrations (live count)
- Active appointments today
- Room occupancy status
- Revenue updates
- Emergency alerts
- Staff activity
- System health metrics

### **Update Frequencies:**

- **Critical Metrics**: Every 5 seconds
- **Standard Metrics**: Every 30 seconds
- **Historical Data**: Every 5 minutes
- **Reports**: Every 15 minutes

## 🔧 Technology Stack

- **WebSocket Server**: Socket.io
- **Caching**: Redis
- **Database**: MongoDB (Change Streams)
- **Authentication**: JWT tokens
- **Process Management**: PM2
- **Monitoring**: Custom health checks

## 📁 Project Structure

```
backend/liveDashboard/
├── src/
│   ├── server.ts              # Main WebSocket server
│   ├── services/
│   │   ├── dashboardService.ts    # Core dashboard logic
│   │   ├── redisService.ts        # Redis operations
│   │   ├── mongoService.ts        # MongoDB change streams
│   │   └── authService.ts         # Authentication
│   ├── controllers/
│   │   └── dashboardController.ts # WebSocket event handlers
│   ├── middleware/
│   │   └── authMiddleware.ts      # WebSocket auth
│   ├── types/
│   │   └── dashboard.ts           # TypeScript interfaces
│   └── utils/
│       ├── logger.ts              # Logging utility
│       └── metrics.ts             # Metrics calculation
├── config/
│   ├── redis.ts                   # Redis configuration
│   ├── mongodb.ts                 # MongoDB configuration
│   └── websocket.ts               # WebSocket configuration
├── tests/
│   └── dashboard.test.ts          # Unit tests
├── package.json
├── tsconfig.json
├── .env.example
└── ecosystem.config.js            # PM2 configuration
```

## 🚀 Getting Started

1. **Install Dependencies**
2. **Configure Redis & MongoDB**
3. **Set Environment Variables**
4. **Start the Service**
5. **Connect Admin Dashboard**

## 📈 Performance Benefits

- **Zero Impact** on main HTTP server
- **Sub-second Updates** for critical metrics
- **Efficient Caching** reduces database load
- **Horizontal Scaling** support
- **Resource Isolation** prevents conflicts

## 🔒 Security Features

- JWT token authentication
- Admin-only access control
- Rate limiting for connections
- Secure WebSocket connections (WSS)
- Input validation and sanitization

## 📊 Monitoring & Health

- Connection status monitoring
- Performance metrics tracking
- Error logging and alerting
- Resource usage monitoring
- Automatic reconnection handling
