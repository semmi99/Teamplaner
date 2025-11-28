import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Search, Trash2, Edit2, Settings, UserPlus, Save, X, GripVertical } from 'lucide-react';
import { Member, AttributeDefinition } from '../types';

export const Members: React.FC = () => {
  const { members, attributeDefs, user, addMember, updateMember, deleteMember, addAttributeDef, deleteAttributeDef, reorderAttributeDefs } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member>>({});
  const [draggedAttrIndex, setDraggedAttrIndex] = useState<number | null>(null);
  
  // State for new attribute form
  const [newAttrType, setNewAttrType] = useState<'text' | 'date' | 'select'>('text');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const canDelete = user?.role === 'ADMIN';

  // Filter Logic
  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    const basicMatch = m.firstName.toLowerCase().includes(term) || m.lastName.toLowerCase().includes(term);
    const attrMatch = Object.values(m.attributes).some(val => String(val).toLowerCase().includes(term));
    return basicMatch || attrMatch;
  });

  const handleSaveMember = () => {
    if (!editingMember.firstName || !editingMember.lastName) return;
    
    if (editingMember.id) {
      updateMember(editingMember.id, editingMember);
    } else {
      addMember(editingMember as Member);
    }
    setIsModalOpen(false);
    setEditingMember({});
  };

  const handleAttrChange = (key: string, value: string) => {
    setEditingMember(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value }
    }));
  };

  // DnD Handlers for Attributes
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedAttrIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedAttrIndex !== null && draggedAttrIndex !== index) {
      reorderAttributeDefs(draggedAttrIndex, index);
    }
    setDraggedAttrIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mitgliederverwaltung</h2>
          <p className="text-slate-500">Verwalten Sie Ihren Mitgliederstamm und Attribute.</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setIsAttrModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Attribute</span>
            </button>
          )}
          {canEdit && (
            <button 
              onClick={() => { setEditingMember({ attributes: {} }); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
            >
              <UserPlus size={18} />
              <span>Mitglied</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Suchen nach Namen, Position, Fähigkeit..." 
          className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Name</th>
              {attributeDefs.slice(0, 3).map(attr => (
                <th key={attr.id} className="px-6 py-4 font-semibold text-slate-600 hidden md:table-cell">{attr.name}</th>
              ))}
              <th className="px-6 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{member.firstName} {member.lastName}</div>
                </td>
                {attributeDefs.slice(0, 3).map(attr => (
                  <td key={attr.id} className="px-6 py-4 text-slate-600 hidden md:table-cell">
                    {member.attributes[attr.id] || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <button 
                        onClick={() => { setEditingMember(member); setIsModalOpen(true); }}
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => deleteMember(member.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                  Keine Mitglieder gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold">{editingMember.id ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-700" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vorname *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    value={editingMember.firstName || ''}
                    onChange={e => setEditingMember({...editingMember, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nachname *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    value={editingMember.lastName || ''}
                    onChange={e => setEditingMember({...editingMember, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Zusatzattribute</h4>
                <div className="grid gap-4">
                  {attributeDefs.map(attr => (
                    <div key={attr.id}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{attr.name}</label>
                      {attr.type === 'select' ? (
                        <select 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                          value={editingMember.attributes?.[attr.id] || ''}
                          onChange={e => handleAttrChange(attr.id, e.target.value)}
                        >
                          <option value="">Bitte wählen...</option>
                          {attr.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input 
                          type={attr.type === 'date' ? 'date' : 'text'}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          value={editingMember.attributes?.[attr.id] || ''}
                          onChange={e => handleAttrChange(attr.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Abbrechen</button>
              <button onClick={handleSaveMember} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm flex items-center gap-2">
                <Save size={18} /> Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Management Modal (Admin Only) */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold">Attribute konfigurieren</h3>
              <button onClick={() => setIsAttrModalOpen(false)}><X className="text-slate-400 hover:text-slate-700" /></button>
            </div>
            <div className="p-6">
              <div className="mb-2 text-sm text-slate-500 flex items-center gap-2 bg-blue-50 p-2 rounded text-blue-700">
                 <GripVertical size={16} /> 
                 <span>Reihenfolge per Drag & Drop ändern</span>
              </div>
              <div className="space-y-2 mb-6">
                {attributeDefs.map((attr, index) => (
                  <div 
                    key={attr.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border cursor-move hover:border-brand-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-slate-400" />
                      <div>
                        <span className="font-semibold">{attr.name}</span>
                        <span className="text-xs text-slate-500 ml-2 uppercase">({attr.type})</span>
                        {attr.type === 'select' && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {attr.options?.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteAttributeDef(attr.id)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Neues Attribut</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const type = newAttrType;
                  
                  // Handle options for Select type
                  let options: string[] | undefined;
                  if (type === 'select') {
                    const optionsStr = (form.elements.namedItem('options') as HTMLInputElement)?.value;
                    if (optionsStr) {
                      options = optionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    } else {
                      options = ['Option 1', 'Option 2']; // Fallback
                    }
                  }

                  if (name) {
                    addAttributeDef({ name, type, options });
                    form.reset();
                    setNewAttrType('text');
                  }
                }} className="space-y-3">
                  <div className="flex gap-2">
                    <input name="name" placeholder="Name (z.B. Trikotgröße)" className="flex-1 px-3 py-2 border rounded-lg" required />
                    <select 
                      name="type" 
                      className="px-3 py-2 border rounded-lg bg-white"
                      value={newAttrType}
                      onChange={(e) => setNewAttrType(e.target.value as any)}
                    >
                      <option value="text">Text</option>
                      <option value="date">Datum</option>
                      <option value="select">Auswahl</option>
                    </select>
                  </div>
                  
                  {newAttrType === 'select' && (
                    <input 
                      name="options" 
                      placeholder="Optionen (Komma getrennt, z.B. S, M, L, XL)" 
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" 
                      required
                    />
                  )}
                  
                  <button type="submit" className="w-full px-3 py-2 bg-brand-600 text-white rounded-lg flex justify-center items-center gap-2">
                    <Plus size={18} /> Attribut erstellen
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};