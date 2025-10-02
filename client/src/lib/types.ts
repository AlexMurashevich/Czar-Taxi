export interface DashboardStats {
  totalParticipants: number;
  dailyHours: number;
  goalPercentage: number;
  alerts: number;
}

export interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  dailyTargetHours: string;
  monthlyUnitTarget: string;
  status: 'planned' | 'active' | 'closed';
}

export interface User {
  id: number;
  phone: string;
  fullName?: string;
  status: string;
  tgUserId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  role: string;
  personalTotal: string;
  teamTotal: string;
  total: string;
  target: string;
  targetPercent: string;
  rankInGroup?: number;
  sotnikRank?: number;
  user: User;
}

export interface ImportRecord {
  id: number;
  fileName: string;
  uploadedAt: string;
  rowsCount: number;
  status: 'processed' | 'failed' | 'processing' | 'partial';
  errorsJson?: string;
}

export interface FraudAlert {
  id: string;
  userId: number;
  phone: string;
  type: 'high_hours' | 'anomaly_spike' | 'zero_streak';
  message: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  data: any;
}

export interface HierarchyNode {
  assignment: any;
  user: User;
  stats?: any;
  subordinates?: number;
  centurions?: HierarchyNode[];
}

export interface Waitlist {
  id: number;
  phone: string;
  fullName?: string;
  addedAt: string;
  status?: string;
}
