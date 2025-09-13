# Hospital Analytics & Reporting API Documentation

## Overview

This API provides comprehensive analytics and reporting capabilities for the hospital management system, including patient statistics, revenue analysis, room occupancy, and operational metrics.

## Authentication

All endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:5000/api/reports
```

## Endpoints

### 1. Dashboard Statistics

Get overview statistics for the dashboard.

**Endpoint:** `GET /dashboard`

**Query Parameters:**

- `period` (optional): "today", "week", "month", "year" (default: "today")
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "overview": {
        "totalPatients": 97,
        "activePatients": 45,
        "newRegistrations": 7,
        "appointments": 28,
        "discharges": 14
      },
      "revenue": {
        "total": 35238.0,
        "breakdown": {
          "roomCharges": 15000.0,
          "consultationFees": 12000.0,
          "procedureFees": 5000.0,
          "labCharges": 3238.0
        }
      },
      "rooms": {
        "total": 11,
        "available": 7,
        "occupied": 3,
        "occupancyRate": 27
      }
    }
  }
}
```

### 2. Daily Statistics

Get detailed statistics for a specific day.

**Endpoint:** `GET /daily`

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format (default: today)
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "date": "2024-01-15",
      "totalPatients": 97,
      "newRegistrations": 7,
      "appointments": 28,
      "discharges": 14,
      "revenue": 35238.0,
      "roomOccupancy": 27.27
    },
    "revenueBreakdown": {
      "roomCharges": 15000.0,
      "consultationFees": 12000.0,
      "procedureFees": 5000.0,
      "labCharges": 3238.0,
      "total": 35238.0
    }
  }
}
```

### 3. Weekly Statistics

Get aggregated statistics for a week.

**Endpoint:** `GET /weekly`

**Query Parameters:**

- `weekStart` (optional): Start date of the week in YYYY-MM-DD format
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "weekStart": "2024-01-15",
      "weekEnd": "2024-01-21",
      "totalPatients": 97,
      "newRegistrations": 15,
      "appointments": 85,
      "discharges": 12,
      "revenue": 125000.0,
      "averageOccupancy": 65.5,
      "peakDay": "2024-01-18"
    }
  }
}
```

### 4. Monthly Statistics

Get aggregated statistics for a month.

**Endpoint:** `GET /monthly`

**Query Parameters:**

- `month` (optional): Month number (1-12)
- `year` (optional): Year (default: current year)
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "month": "January",
      "year": 2024,
      "totalPatients": 450,
      "newRegistrations": 120,
      "appointments": 380,
      "discharges": 95,
      "revenue": 850000.0,
      "averageOccupancy": 72.5,
      "departmentBreakdown": [
        {
          "department": "Emergency",
          "patientCount": 45
        },
        {
          "department": "General Medicine",
          "patientCount": 35
        }
      ]
    }
  }
}
```

### 5. Yearly Statistics

Get aggregated statistics for a year.

**Endpoint:** `GET /yearly`

**Query Parameters:**

- `year` (optional): Year (default: current year)
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "year": 2024,
      "totalPatients": 5400,
      "newRegistrations": 1200,
      "appointments": 4800,
      "discharges": 1150,
      "revenue": 12500000.0,
      "monthlyTrends": [
        {
          "_id": { "month": 1, "year": 2024 },
          "newRegistrations": 120
        }
      ],
      "growthRate": 15.5
    }
  }
}
```

### 6. Custom Report

Generate a custom report for a specific date range.

**Endpoint:** `GET /custom`

**Query Parameters:**

- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `department` (optional): Filter by department name
- `reportType` (optional): "revenue", "occupancy", or "general"

**Response:**

```json
{
  "success": true,
  "data": {
    "report": {
      "period": {
        "startDate": "2024-01-01",
        "endDate": "2024-01-31",
        "days": 31
      },
      "totalPatients": 450,
      "newRegistrations": 120,
      "appointments": 380,
      "discharges": 95,
      "revenue": 850000.0
    },
    "reportType": "revenue"
  }
}
```

### 7. Comprehensive Analytics

Get detailed analytics across all categories.

**Endpoint:** `GET /analytics`

**Query Parameters:**

- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "analytics": {
      "patients": {
        "totalPatients": 450,
        "newRegistrations": 120,
        "activePatients": 85,
        "dischargedPatients": 95,
        "patientsByDepartment": [...],
        "patientsByType": [...]
      },
      "appointments": {
        "totalAppointments": 380,
        "completedAppointments": 320,
        "cancelledAppointments": 25,
        "scheduledAppointments": 35,
        "appointmentsByDepartment": [...],
        "appointmentsByStatus": [...]
      },
      "rooms": {
        "totalRooms": 11,
        "availableRooms": 3,
        "occupiedRooms": 6,
        "partiallyOccupiedRooms": 2,
        "occupancyRate": 72.73,
        "averageLengthOfStay": 4.5,
        "roomUtilizationByDepartment": [...]
      },
      "revenue": {
        "totalRevenue": 850000.00,
        "paidRevenue": 750000.00,
        "pendingRevenue": 100000.00,
        "revenueByCategory": [...],
        "averageRevenuePerPatient": 1888.89
      },
      "workflows": {
        "totalWorkflows": 120,
        "activeWorkflows": 25,
        "completedWorkflows": 95,
        "averageCompletionTime": 48.5,
        "stageAnalytics": [...],
        "bottlenecks": [...]
      }
    }
  }
}
```

### 8. KPI Summary

Get key performance indicators summary.

**Endpoint:** `GET /kpi`

**Query Parameters:**

- `period` (optional): "today", "week", "month", "year" (default: "month")
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "kpi": {
      "operational": {
        "totalPatients": 450,
        "patientSatisfaction": 4.2,
        "averageWaitTime": 45,
        "occupancyRate": 72.73,
        "staffUtilization": 78
      },
      "financial": {
        "totalRevenue": 850000.0,
        "revenuePerPatient": 1888.89,
        "growthRate": 15.5
      },
      "quality": {
        "patientSatisfaction": 4.2,
        "readmissionRate": 5.2,
        "treatmentSuccessRate": 94.8,
        "errorRate": 0.3
      }
    }
  }
}
```

### 9. Trend Analysis

Get trend analysis for specific metrics.

**Endpoint:** `GET /trends`

**Query Parameters:**

- `metric` (optional): "patients", "appointments", "revenue" (default: "patients")
- `period` (optional): "today", "week", "month", "year" (default: "month")
- `department` (optional): Filter by department name

**Response:**

```json
{
  "success": true,
  "data": {
    "metric": "patients",
    "period": "month",
    "trendData": [
      {
        "_id": "2024-01-01",
        "count": 15
      },
      {
        "_id": "2024-01-02",
        "count": 18
      }
    ],
    "summary": {
      "direction": "up",
      "percentage": 12.5,
      "firstValue": 15,
      "lastValue": 18,
      "dataPoints": 31
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing parameters, invalid dates)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

## Usage Examples

### Get Today's Dashboard Stats

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5000/api/reports/dashboard?period=today"
```

### Get Monthly Revenue Report

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5000/api/reports/custom?startDate=2024-01-01&endDate=2024-01-31&reportType=revenue"
```

### Get Emergency Department Statistics

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5000/api/reports/monthly?month=1&year=2024&department=Emergency"
```

## Data Sources

The analytics system aggregates data from:

- **Patients**: Registration data, demographics, status
- **Appointments**: Scheduling, completion, cancellations
- **Rooms**: Occupancy, utilization, assignments
- **Bills**: Revenue, payments, categories
- **Workflows**: Patient journey, stage completion times

## Performance Notes

- All endpoints use MongoDB aggregation pipelines for optimal performance
- Results are calculated in real-time (no caching currently implemented)
- Large date ranges may take longer to process
- Consider implementing pagination for very large datasets

## Future Enhancements

- Real-time analytics with WebSocket updates
- Cached results for frequently accessed reports
- Export functionality (PDF, Excel)
- Scheduled report generation
- Advanced predictive analytics
- Custom dashboard creation
