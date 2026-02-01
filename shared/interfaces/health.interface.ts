import { EHealthStatus } from "../enums/health.enum";

export interface IHealthStatus {
  status: EHealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: IDatabaseHealth;
    memory: IMemoryHealth;
    network: INetworkHealth;
  };
}

export interface IDatabaseHealth {
  status: EHealthStatus;
  mode: string;
  responseTime: number;
  lastChecked: Date;
  connectionsCount: number;
}

export interface IConnectionHealth {
  name: string;
  status: EHealthStatus;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export interface IMemoryHealth {
  status: EHealthStatus;
  used: number;
  total: number;
  percentage: number;
  free: number;
}

export interface INetworkHealth {
  status: EHealthStatus;
  latency: number;
  throughput: number;
  connections: number;
}
