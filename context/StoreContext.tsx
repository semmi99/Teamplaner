import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, AppEvent, AttributeDefinition, User, Role, AuditLog } from '../types';
import { generateId } from '../utils/helpers';

interface StoreContextType {
  // Auth
  user: User | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  
  // Members
  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  
  // Attributes
  attributeDefs: AttributeDefinition[];
  addAttributeDef: (def: Omit<AttributeDefinition, 'id'>) => void;
  deleteAttributeDef: (id: string) => void;
  reorderAttributeDefs: (oldIndex: number, newIndex: number) => void;
  
  // Events
  events: AppEvent[];
  addEvent: (event: Omit<AppEvent, 'id' | 'groups'>) => void;
  updateEvent: (id: string, updates: Partial<AppEvent>) => void;
  deleteEvent: (id: string) => void;
  assignMemberToGroup: (eventId: string, groupId: string, memberId: string) => void;
  removeMemberFromGroup: (eventId: string, groupId: string, memberId: string) => void;
  updateGroup: (eventId: string, groupId: string, name: string) => void;
  
  // Audit
  logs: AuditLog[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_ATTRS: AttributeDefinition[] = [
  { id: 'pos', name: 'Position', type: 'select', options: ['Torwart', 'Verteidiger', 'Mittelfeld', 'Sturm', 'Trainer'] },
  { id: 'dob', name: 'Geburtsdatum', type: 'date' },
  { id: 'skill', name: 'Level', type: 'select', options: ['Anfänger', 'Fortgeschritten', 'Profi'] }
];

const INITIAL_MEMBERS: Member[] = [
  { id: '1', firstName: 'Max', lastName: 'Mustermann', attributes: { pos: 'Sturm', skill: 'Profi' } },
  { id: '2', firstName: 'Julia', lastName: 'Müller', attributes: { pos: 'Verteidiger', skill: 'Fortgeschritten' } },
  { id: '3', firstName: 'Tim', lastName: 'Werner', attributes: { pos: 'Torwart', skill: 'Anfänger' } },
];

const INITIAL_EVENTS: AppEvent[] = [
  { 
    id: 'e1', 
    name: 'Training A-Kader', 
    location: 'Sportplatz Nord', 
    start: new Date(Date.now() + 86400000).toISOString(), 
    end: new Date(Date.now() + 90000000).toISOString(), 
    groups: [
      { id: 'g1', name: 'Team Rot', color: 'bg-red-100 border-red-300', memberIds: [] },
      { id: 'g2', name: 'Team Blau', color: 'bg-blue-100 border-blue-300', memberIds: [] }
    ]
  }
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [attributeDefs, setAttributeDefs] = useState<AttributeDefinition[]>(INITIAL_ATTRS);
  const [events, setEvents] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('pm_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    // In a real app, we would fetch data here. We keep the mock data for now if LS is empty.
  }, []);

  const addLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      user: user?.email || 'System',
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const login = (email: string, role: Role) => {
    const newUser: User = { id: generateId(), name: email.split('@')[0], email, role };
    setUser(newUser);
    localStorage.setItem('pm_user', JSON.stringify(newUser));
    addLog('LOGIN', `User ${email} logged in as ${role}`);
  };

  const logout = () => {
    addLog('LOGOUT', `User ${user?.email} logged out`);
    setUser(null);
    localStorage.removeItem('pm_user');
  };

  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember = { ...member, id: generateId() };
    setMembers(prev => [...prev, newMember]);
    addLog('MEMBER_CREATE', `Created member ${member.firstName} ${member.lastName}`);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    addLog('MEMBER_UPDATE', `Updated member ${id}`);
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    // Also remove from all events
    setEvents(prev => prev.map(evt => ({
      ...evt,
      groups: evt.groups.map(grp => ({
        ...grp,
        memberIds: grp.memberIds.filter(mid => mid !== id)
      }))
    })));
    addLog('MEMBER_DELETE', `Deleted member ${id}`);
  };

  const addAttributeDef = (def: Omit<AttributeDefinition, 'id'>) => {
    setAttributeDefs(prev => [...prev, { ...def, id: generateId() }]);
    addLog('ATTR_CREATE', `Created attribute ${def.name}`);
  };

  const deleteAttributeDef = (id: string) => {
    setAttributeDefs(prev => prev.filter(a => a.id !== id));
    addLog('ATTR_DELETE', `Deleted attribute ${id}`);
  };

  const reorderAttributeDefs = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    setAttributeDefs(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
  };

  const addEvent = (event: Omit<AppEvent, 'id' | 'groups'>) => {
    const newEvent: AppEvent = {
      ...event,
      id: generateId(),
      groups: [
        { id: generateId(), name: 'Standard Gruppe', color: 'bg-slate-100 border-slate-300', memberIds: [] }
      ]
    };
    setEvents(prev => [...prev, newEvent]);
    addLog('EVENT_CREATE', `Created event ${event.name}`);
  };

  const updateEvent = (id: string, updates: Partial<AppEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addLog('EVENT_UPDATE', `Updated event ${id}`);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    addLog('EVENT_DELETE', `Deleted event ${id}`);
  };

  const updateGroup = (eventId: string, groupId: string, name: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        groups: evt.groups.map(g => g.id === groupId ? { ...g, name } : g)
      };
    }));
  };

  const assignMemberToGroup = (eventId: string, groupId: string, memberId: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id !== eventId) return evt;
      
      // Remove from other groups in this event first (exclusive assignment per event)
      const cleanGroups = evt.groups.map(g => ({
        ...g,
        memberIds: g.memberIds.filter(mid => mid !== memberId)
      }));

      return {
        ...evt,
        groups: cleanGroups.map(g => 
          g.id === groupId ? { ...g, memberIds: [...g.memberIds, memberId] } : g
        )
      };
    }));
    // Note: Logging every drag drop might spam, keeping it silent or debug only
  };

  const removeMemberFromGroup = (eventId: string, groupId: string, memberId: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        groups: evt.groups.map(g => 
          g.id === groupId ? { ...g, memberIds: g.memberIds.filter(mid => mid !== memberId) } : g
        )
      };
    }));
  };

  return (
    <StoreContext.Provider value={{
      user, login, logout,
      members, addMember, updateMember, deleteMember,
      attributeDefs, addAttributeDef, deleteAttributeDef, reorderAttributeDefs,
      events, addEvent, updateEvent, deleteEvent, assignMemberToGroup, removeMemberFromGroup, updateGroup,
      logs
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};