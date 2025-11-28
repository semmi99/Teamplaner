import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Calendar, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { AppEvent } from '../types';

interface EventsProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export const Events: React.FC<EventsProps> = ({ onNavigate }) => {
  const { events, user, addEvent, deleteEvent } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AppEvent>>({});

  const canEdit = user?.role !== 'VIEWER';

  const handleCreate = () => {
    if (newEvent.name && newEvent.start && newEvent.end) {
      addEvent(newEvent as AppEvent);
      setIsModalOpen(false);
      setNewEvent({});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Veranstaltungen</h2>
          <p className="text-slate-500">Planen und organisieren Sie Ihre Events.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Neues Event</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">{event.name}</h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-brand-500" />
                  <span className="text-sm">{formatDateTime(event.start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-500" />
                  <span className="text-sm">Bis {formatDateTime(event.end)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {event.groups.map(g => (
                  <span key={g.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {g.name}: {g.memberIds.length}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-between items-center rounded-b-xl">
              <button 
                onClick={() => onNavigate('planner', event.id)}
                className="text-brand-600 font-semibold hover:text-brand-700 text-sm"
              >
                Planung öffnen &rarr;
              </button>
              {canEdit && (
                <button 
                  onClick={() => deleteEvent(event.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">Veranstaltung erstellen</h3>
            <input 
              placeholder="Name" 
              className="w-full px-3 py-2 border rounded-lg"
              onChange={e => setNewEvent({...newEvent, name: e.target.value})}
            />
            <input 
              placeholder="Ort" 
              className="w-full px-3 py-2 border rounded-lg"
              onChange={e => setNewEvent({...newEvent, location: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Start</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={e => setNewEvent({...newEvent, start: new Date(e.target.value).toISOString()})}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Ende</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={e => setNewEvent({...newEvent, end: new Date(e.target.value).toISOString()})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Abbrechen</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
