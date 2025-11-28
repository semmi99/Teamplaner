export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  type: 'text' | 'date' | 'select';
  options?: string[]; // For select type
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  attributes: Record<string, string>; // Dynamic attributes keyed by AttributeDefinition.id
}

export interface EventGroup {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

export interface AppEvent {
  id: string;
  name: string;
  location: string;
  start: string; // ISO Date string
  end: string;   // ISO Date string
  groups: EventGroup[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}
