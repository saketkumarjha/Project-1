// Core Dashboard Types
export interface DashboardMetrics {
  critical: CriticalMetrics;
  standard: StandardMetrics;
  historical: HistoricalMetrics;
  timestamp: number;
}

export interface CriticalMetrics {
  patientCount: {
    total: number;
    active: number;
    newToday: number;
    emergency: number;
  };
  roomOccupancy: {
    total: number;
    occupied: number;
    available: number;
    partiallyOccupied: number;
    occupancyRate: number;
  };
  emergencyAlerts: Alert[];
  systemHealth: SystemHealth;
}

export interface StandardMetrics {
  appointments: {
    today: number;
    completed: number;
    cancelled: number;
    upcoming: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
  };
  staffActivity: StaffActivity[];
  departmentStats: DepartmentStats[];
}

export interface HistoricalMetrics {
  hourlyStats: HourlyStats[];
  dailyTrends: DailyTrend[];
  weeklyComparison: WeeklyComparison;
  monthlyGrowth: MonthlyGrowth;
}

// Alert System
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  department?: string;
  patientId?: string;
  roomId?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export enum AlertType {
  EMERGENCY = "emergency",
  CAPACITY = "capacity",
  SYSTEM = "system",
  REVENUE = "revenue",
  STAFF = "staff",
  EQUIPMENT = "equipment",
}

export enum AlertSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

// System Health
export interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  services: ServiceHealth[];
  performance: PerformanceMetrics;
  lastCheck: number;
}

export interface ServiceHealth {
  name: string;
  status: "up" | "down" | "degraded";
  responseTime: number;
  lastCheck: number;
  errorRate: number;
}

export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  averageResponseTime: number;
}

// Staff Activity
export interface StaffActivity {
  staffId: string;
  name: string;
  department: string;
  status: "active" | "busy" | "break" | "offline";
  currentTask?: string;
  lastActivity: number;
  patientsHandled: number;
  shift: "morning" | "evening" | "night";
}

// Department Statistics
export interface DepartmentStats {
  department: string;
  patientCount: number;
  staffCount: number;
  roomUtilization: number;
  averageWaitTime: number;
  revenue: number;
  alerts: number;
}

// Time-based Statistics
export interface HourlyStats {
  hour: number;
  patientRegistrations: number;
  appointments: number;
  discharges: number;
  revenue: number;
  alerts: number;
}

export interface DailyTrend {
  date: string;
  patientCount: number;
  revenue: number;
  occupancyRate: number;
  satisfaction: number;
}

export interface WeeklyComparison {
  currentWeek: WeeklyStats;
  previousWeek: WeeklyStats;
  growthRate: number;
}

export interface WeeklyStats {
  patients: number;
  revenue: number;
  appointments: number;
  occupancyRate: number;
}

export interface MonthlyGrowth {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  yearOverYear: number;
}

export interface MonthlyStats {
  patients: number;
  revenue: number;
  appointments: number;
  averageOccupancy: number;
}

// WebSocket Events
export interface ClientEvents {
  authenticate: (token: string) => void;
  subscribe_metrics: (metrics: MetricSubscription[]) => void;
  unsubscribe_metrics: (metrics: string[]) => void;
  request_snapshot: () => void;
  request_historical: (timeRange: TimeRange) => void;
  acknowledge_alert: (alertId: string) => void;
  request_department_details: (department: string) => void;
}

export interface ServerEvents {
  authenticated: (success: boolean, user?: AdminUser) => void;
  auth_error: (error: string) => void;
  dashboard_update: (data: DashboardUpdate) => void;
  metrics_snapshot: (snapshot: DashboardMetrics) => void;
  historical_data: (data: HistoricalMetrics) => void;
  alert_created: (alert: Alert) => void;
  alert_updated: (alert: Alert) => void;
  connection_status: (status: ConnectionStatus) => void;
  error: (error: ErrorMessage) => void;
  department_details: (data: DepartmentDetails) => void;
}

// Subscription Management
export interface MetricSubscription {
  type: MetricType;
  department?: string;
  updateInterval: number;
  priority: "high" | "medium" | "low";
}

export enum MetricType {
  PATIENT_COUNT = "patient_count",
  ROOM_OCCUPANCY = "room_occupancy",
  APPOINTMENTS = "appointments",
  REVENUE = "revenue",
  ALERTS = "alerts",
  STAFF_ACTIVITY = "staff_activity",
  SYSTEM_HEALTH = "system_health",
}

// Data Updates
export interface DashboardUpdate {
  type: UpdateType;
  data: any;
  timestamp: number;
  department?: string;
  priority: "high" | "medium" | "low";
}

export enum UpdateType {
  PATIENT_REGISTERED = "patient_registered",
  PATIENT_DISCHARGED = "patient_discharged",
  APPOINTMENT_SCHEDULED = "appointment_scheduled",
  APPOINTMENT_COMPLETED = "appointment_completed",
  ROOM_STATUS_CHANGED = "room_status_changed",
  REVENUE_UPDATED = "revenue_updated",
  ALERT_CREATED = "alert_created",
  STAFF_STATUS_CHANGED = "staff_status_changed",
  SYSTEM_HEALTH_CHANGED = "system_health_changed",
}

// Time Range
export interface TimeRange {
  start: number;
  end: number;
  granularity: "hour" | "day" | "week" | "month";
}

// Connection Management
export interface ConnectionStatus {
  connected: boolean;
  connectionId: string;
  connectedAt: number;
  lastPing: number;
  subscriptions: MetricSubscription[];
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: "super_admin" | "admin" | "viewer";
  permissions: string[];
  department?: string;
}

// Error Handling
export interface ErrorMessage {
  code: string;
  message: string;
  timestamp: number;
  details?: any;
}

// Department Details
export interface DepartmentDetails {
  department: string;
  overview: DepartmentOverview;
  patients: PatientSummary[];
  rooms: RoomSummary[];
  staff: StaffSummary[];
  alerts: Alert[];
}

export interface DepartmentOverview {
  totalPatients: number;
  activeStaff: number;
  roomUtilization: number;
  todayRevenue: number;
  averageWaitTime: number;
  satisfaction: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  uhid: string;
  status: string;
  admittedAt: number;
  room?: string;
  priority: "high" | "medium" | "low";
}

export interface RoomSummary {
  id: string;
  roomNumber: string;
  status: "available" | "occupied" | "partially-occupied" | "maintenance";
  occupancy: number;
  maxOccupancy: number;
  patients: string[];
}

export interface StaffSummary {
  id: string;
  name: string;
  role: string;
  status: "active" | "busy" | "break" | "offline";
  currentPatients: number;
  shift: string;
}

// Cache Keys
export enum CacheKeys {
  CRITICAL_METRICS = "critical_metrics",
  STANDARD_METRICS = "standard_metrics",
  HISTORICAL_METRICS = "historical_metrics",
  DEPARTMENT_STATS = "department_stats",
  STAFF_ACTIVITY = "staff_activity",
  SYSTEM_HEALTH = "system_health",
  ALERTS = "alerts",
}

// MongoDB Change Stream Events
export interface ChangeStreamEvent {
  operationType: "insert" | "update" | "delete" | "replace";
  fullDocument?: any;
  documentKey: { _id: any };
  updateDescription?: {
    updatedFields: any;
    removedFields: string[];
  };
  ns: {
    db: string;
    coll: string;
  };
  clusterTime: any;
}

// Configuration Types
export interface DashboardConfig {
  server: ServerConfig;
  redis: RedisConfig;
  mongodb: MongoConfig;
  websocket: WebSocketConfig;
  cache: CacheConfig;
  monitoring: MonitoringConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  environment: "development" | "production" | "staging";
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  clusterMode: boolean;
}

export interface MongoConfig {
  uri: string;
  options: any;
}

export interface WebSocketConfig {
  corsOrigin: string;
  maxConnections: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface CacheConfig {
  ttl: {
    critical: number;
    standard: number;
    historical: number;
  };
  prefix: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  performanceMonitoring: boolean;
}
