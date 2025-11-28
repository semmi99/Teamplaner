import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, Plus, AlertTriangle, Printer, Search, Filter, Edit2, Check, X, FileDown, Calendar, MapPin, Loader2, Download } from 'lucide-react';
import { doDatesOverlap, formatDateTime, formatDate } from '../utils/helpers';
import { AppEvent } from '../types';

interface EventPlannerProps {
  eventId: string;
  onBack: () => void;
}

export const EventPlanner: React.FC<EventPlannerProps> = ({ eventId, onBack }) => {
  const { events, members, attributeDefs, user, assignMemberToGroup, removeMemberFromGroup, updateEvent, updateGroup } = useStore();
  
  const event = events.find(e => e.id === eventId);
  
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<{key: string, value: string} | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  
  // Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printAttributes, setPrintAttributes] = useState<string[]>([]);
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Initialize print container and default attributes
  useEffect(() => {
    const el = document.getElementById('print-mount');
    if (el) setPrintContainer(el);
    
    // Set default attributes if empty
    if (attributeDefs && attributeDefs.length > 0 && printAttributes.length === 0) {
      setPrintAttributes(attributeDefs.slice(0, 3).map(a => a.id));
    }
  }, [attributeDefs]);

  // Cleanup helper to ensure we return to app view
  const cleanupPrintState = () => {
    document.body.classList.remove('is-printing');
  };

  // Clean up print class on unmount or after print events
  useEffect(() => {
    window.addEventListener('afterprint', cleanupPrintState);
    return () => {
      window.removeEventListener('afterprint', cleanupPrintState);
      cleanupPrintState(); // Force cleanup on unmount
    };
  }, []);

  // Option A: Browser Print Dialog
  const handlePrint = () => {
    document.body.classList.add('is-printing');
    setTimeout(() => {
      window.print();
      cleanupPrintState();
    }, 100);
  };

  // Option B: Direct PDF Download via html2pdf
  const handleDirectDownload = async () => {
    if (!event) return;
    setIsGeneratingPdf(true);
    
    // 1. Make content visible for the library
    document.body.classList.add('is-printing');
    
    // Wait for render
    await new Promise(r => setTimeout(r, 500));

    const element = document.getElementById('print-mount');
    if (element) {
        try {
            const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_Plan.pdf`;
            const opt = {
                margin: [10, 10, 10, 10], // top, left, bottom, right (mm)
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            // @ts-ignore
            if (window.html2pdf) {
                // @ts-ignore
                await window.html2pdf().set(opt).from(element).save();
            } else {
                alert("PDF Generator wird geladen... Bitte versuchen Sie es in 2 Sekunden erneut.");
            }
        } catch (e) {
            console.error("PDF Gen Error:", e);
            alert('Fehler beim Generieren des PDFs. Bitte nutzen Sie die Druck-Option.');
        }
    }

    // Cleanup
    setIsGeneratingPdf(false);
    cleanupPrintState();
    // Keep modal open or close it? Let's close it on success
    setIsPrintModalOpen(false);
  };

  // Helper to close modal and ensure print state is cleared
  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
    cleanupPrintState();
  };

  // Group Management
  const addGroup = () => {
    if (!event) return;
    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Gruppe ${event.groups.length + 1}`,
      color: 'bg-slate-100 border-slate-300',
      memberIds: []
    };
    updateEvent(event.id, { groups: [...event.groups, newGroup] });
  };

  const startEditingGroup = (id: string, currentName: string) => {
    if (user?.role === 'VIEWER') return;
    setEditingGroupId(id);
    setEditGroupName(currentName);
  };

  const saveGroupRename = (groupId: string) => {
    if (event && editGroupName.trim()) {
      updateGroup(event.id, groupId, editGroupName.trim());
    }
    setEditingGroupId(null);
  };

  // Filtering Logic
  const filteredMembers = useMemo(() => {
    if (!event) return [];
    
    // Get all assigned member IDs in THIS event
    const assignedIds = new Set(event.groups.flatMap(g => g.memberIds));
    
    return members.filter(m => {
      // Exclude already assigned in THIS event
      if (assignedIds.has(m.id)) return false;

      // Text Search
      const term = searchTerm.toLowerCase();
      const textMatch = 
        m.firstName.toLowerCase().includes(term) || 
        m.lastName.toLowerCase().includes(term) ||
        Object.values(m.attributes).some(v => String(v).toLowerCase().includes(term));
      
      if (!textMatch) return false;

      // Attribute Filter
      if (activeFilter) {
        if (m.attributes[activeFilter.key] !== activeFilter.value) return false;
      }

      return true;
    });
  }, [members, event, searchTerm, activeFilter]);

  // Conflict Detection
  const checkConflict = (memberId: string): AppEvent | undefined => {
    if (!event) return undefined;
    return events.find(e => 
      e.id !== event.id && // Not current event
      doDatesOverlap(event.start, event.end, e.start, e.end) && // Time overlaps
      e.groups.some(g => g.memberIds.includes(memberId)) // Member assigned
    );
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, memberId: string) => {
    if (user?.role === 'VIEWER') {
        e.preventDefault();
        return;
    }
    setDraggedMemberId(memberId);
    e.dataTransfer.setData('memberId', memberId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('memberId');
    if (memberId && event) {
      // Conflict Check on Drop
      const conflict = checkConflict(memberId);
      if (conflict) {
         if (!window.confirm(`ZEITKONFLIKT!\n\nDieses Mitglied ist bereits in "${conflict.name}" (${formatDateTime(conflict.start)}) eingeteilt.\n\nMöchten Sie das Mitglied trotzdem zuweisen?`)) {
          setDraggedMemberId(null);
          return;
        }
      }
      assignMemberToGroup(event.id, groupId, memberId);
    }
    setDraggedMemberId(null);
  };

  if (!event) return <div>Event nicht gefunden</div>;

  const canEdit = user?.role !== 'VIEWER';

  // --- PRINT CONTENT ---
  // We define the JSX directly here to ensure stability in the portal
  const printContent = (
    <div className="w-full bg-white text-black p-8 font-sans relative">
      {/* 
        EMERGENCY EXIT BUTTON 
        Visible only on screen when "stuck" in print view, hidden on actual print 
      */}
      <div className="fixed top-6 right-6 z-[9999] print:hidden" data-html2canvas-ignore>
        <button 
          onClick={cleanupPrintState}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2 transition-all"
        >
          <X size={20} />
          <span>Vorschau schließen</span>
        </button>
      </div>

      {/* Print Header */}
      <div className="mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{event.name}</h1>
            <div className="flex gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(event.start)}, {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} Uhr</span>
              </div>
              <div className="flex items-center gap-2">
                 <MapPin size={16} />
                 <span>{event.location}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-slate-900">{event.groups.reduce((acc, g) => acc + g.memberIds.length, 0)}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Teilnehmer</div>
          </div>
        </div>
      </div>
      
      {/* Groups Layout - One per page via break-after-page */}
      <div className="print-layout">
        {event.groups.map((group, index) => (
          <div 
             key={group.id} 
             className={`print-group-card rounded-lg overflow-hidden bg-white mb-6 ${index < event.groups.length - 1 ? 'break-after-page' : ''}`}
          >
            <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex justify-between items-center break-inside-avoid">
               <h3 className="font-bold text-slate-800">{group.name}</h3>
               <span className="text-xs font-mono bg-white border px-1.5 rounded">{group.memberIds.length}</span>
            </div>
            
            {group.memberIds.length > 0 ? (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">Name</th>
                    {printAttributes.map(attrId => {
                       const attr = attributeDefs.find(a => a.id === attrId);
                       return attr ? <th key={attr.id} className="text-left px-2 py-2 font-semibold text-slate-600">{attr.name}</th> : null;
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.memberIds.map((mid) => {
                    const m = members.find(mem => mem.id === mid);
                    if (!m) return null;
                    return (
                      <tr key={m.id} className="break-inside-avoid">
                        <td className="px-3 py-2 font-medium text-slate-900">{m.firstName} {m.lastName}</td>
                        {printAttributes.map(attrId => (
                           <td key={attrId} className="px-2 py-2 text-slate-600 break-words max-w-[150px]">
                             {m.attributes[attrId] || '–'}
                           </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                Keine Teilnehmer.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
          <span>Erstellt mit PlanMaster Pro</span>
          <span>Gedruckt am {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE')} Uhr</span>
      </div>
    </div>
  );

  return (
    <>
      {/* RENDER PRINT VIEW INTO PORTAL ALWAYS */}
      {/* We use React Portal to render the print view outside the main app flow */}
      {printContainer && createPortal(printContent, printContainer)}

      {/* APPLICATION UI */}
      <div className="h-[calc(100vh-100px)] flex flex-col relative no-print">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{event.name}</h1>
              <p className="text-sm text-slate-500">
                {formatDateTime(event.start)} - {formatDateTime(event.end)} • {event.location}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-all hover:border-brand-300"
            >
              <FileDown size={18} />
              <span className="hidden sm:inline">Exportieren / PDF</span>
            </button>
          </div>
        </div>

        {/* Main Split View */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* Left: Unassigned Members Sidebar */}
          <div className="w-1/3 min-w-[300px] bg-white rounded-xl shadow-sm border flex flex-col">
            <div className="p-4 border-b space-y-3 bg-slate-50 rounded-t-xl">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Filter size={18} />
                Verfügbare Mitglieder
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Suchen..." 
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-brand-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Attribute Filter Select Dropdown */}
              <div>
                <select 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  value={activeFilter ? JSON.stringify(activeFilter) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActiveFilter(val ? JSON.parse(val) : null);
                  }}
                >
                   <option value="">Alle anzeigen (Kein Filter)</option>
                   {attributeDefs.filter(a => a.type === 'select').map(attr => (
                      <optgroup key={attr.id} label={attr.name}>
                        {attr.options?.map(opt => (
                          <option key={`${attr.id}-${opt}`} value={JSON.stringify({key: attr.id, value: opt})}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                   ))}
                </select>
              </div>

            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              {filteredMembers.map(member => {
                const conflict = checkConflict(member.id);
                return (
                  <div
                    key={member.id}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, member.id)}
                    className={`
                      p-3 bg-white rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-400 transition-all relative group
                      ${conflict ? 'border-orange-200 bg-orange-50' : ''}
                      ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-slate-800">{member.firstName} {member.lastName}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {/* Display attributes in correct order */}
                          {attributeDefs.slice(0, 3).map(attr => {
                            const val = member.attributes[attr.id];
                            if (!val) return null;
                            return (
                              <span key={attr.id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {attr.name}: {val}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {conflict && (
                        <div className="text-orange-500 tooltip cursor-help" title={`Achtung: Zeitüberschneidung mit "${conflict.name}"`}>
                          <AlertTriangle size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Groups / Board */}
          <div className="flex-1 bg-slate-100 rounded-xl p-4 overflow-x-auto flex gap-4 border-inner shadow-inner">
            {event.groups.map(group => (
              <div 
                key={group.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, group.id)}
                className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg border shadow-sm max-h-full"
              >
                <div className={`p-3 border-b rounded-t-lg ${group.color.split(' ')[0]} bg-opacity-20`}>
                  <div className="flex justify-between items-center mb-1">
                    {editingGroupId === group.id ? (
                      <div className="flex items-center gap-1 w-full">
                        <input 
                          autoFocus
                          className="flex-1 px-2 py-1 text-sm border rounded shadow-sm"
                          value={editGroupName}
                          onChange={e => setEditGroupName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveGroupRename(group.id)}
                        />
                        <button onClick={() => saveGroupRename(group.id)} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={14}/></button>
                        <button onClick={() => setEditingGroupId(null)} className="p-1 text-red-600 hover:bg-red-100 rounded"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full group/header">
                         <h3 
                          className="font-bold text-slate-700 truncate cursor-pointer hover:underline decoration-slate-400"
                          onClick={() => canEdit && startEditingGroup(group.id, group.name)}
                         >
                           {group.name}
                         </h3>
                         {canEdit && <Edit2 size={12} className="opacity-0 group-hover/header:opacity-100 text-slate-400" />}
                      </div>
                    )}
                    <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-slate-600 font-mono">
                      {group.memberIds.length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                  {group.memberIds.map(mid => {
                    const m = members.find(mem => mem.id === mid);
                    if (!m) return null;
                    const conflict = checkConflict(m.id);
                    return (
                      <div key={m.id} className={`p-2 bg-white border rounded shadow-sm text-sm group relative hover:border-brand-300 ${conflict ? 'border-orange-300 bg-orange-50' : ''}`}>
                        <div className="flex justify-between">
                           <div className="font-medium">{m.firstName} {m.lastName}</div>
                           {conflict && <AlertTriangle size={12} className="text-orange-500" title="Zeitkonflikt" />}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                           {/* Display attributes in group card */}
                           {attributeDefs.slice(0, 2).map(attr => (
                             <span key={attr.id} className="mr-2">
                               {m.attributes[attr.id]}
                             </span>
                           ))}
                        </div>
                        {canEdit && (
                          <button 
                            onClick={() => removeMemberFromGroup(event.id, group.id, m.id)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {group.memberIds.length === 0 && (
                     <div className="h-full flex items-center justify-center text-slate-300 text-sm italic py-8">
                       Hierher ziehen
                     </div>
                  )}
                </div>
              </div>
            ))}
            
            {canEdit && (
              <button 
                onClick={addGroup}
                className="w-12 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand-500 hover:border-brand-300 transition-colors"
              >
                <Plus />
              </button>
            )}
          </div>
        </div>

        {/* Print Options Modal */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Export Optionen</h3>
                <button onClick={handleClosePrintModal}><X className="text-slate-400 hover:text-slate-700" /></button>
              </div>
              
              <div className="space-y-4 mb-6">
                 <p className="text-sm font-semibold text-slate-700">1. Attribute auswählen:</p>
                 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded bg-slate-50">
                    {attributeDefs.map(attr => (
                      <label key={attr.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full text-xs cursor-pointer hover:border-brand-400 transition-all select-none">
                        <input 
                          type="checkbox" 
                          checked={printAttributes.includes(attr.id)}
                          onChange={(e) => {
                            if (e.target.checked) setPrintAttributes(prev => [...prev, attr.id]);
                            else setPrintAttributes(prev => prev.filter(id => id !== attr.id));
                          }}
                          className="text-brand-600 rounded focus:ring-brand-500"
                        />
                        <span>{attr.name}</span>
                      </label>
                    ))}
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                 <p className="text-sm font-semibold text-slate-700">2. Format wählen:</p>
                 
                 <button onClick={handlePrint} className="w-full px-4 py-3 bg-white border-2 border-slate-200 hover:border-brand-500 text-slate-700 rounded-lg flex items-center justify-between group transition-all">
                    <span className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-full text-slate-500 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                           <Printer size={20} />
                        </div>
                        <span className="font-medium">Drucken (Browser Dialog)</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-brand-500">Beste Qualität</span>
                 </button>
                 
                 <button 
                   onClick={handleDirectDownload} 
                   disabled={isGeneratingPdf} 
                   className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-between shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    <span className="flex items-center gap-3">
                         <div className="p-2 bg-brand-700/50 rounded-full">
                           {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </div>
                        <span className="font-medium">{isGeneratingPdf ? 'Generiere PDF...' : 'Als PDF Datei herunterladen'}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-200">Direkt</span>
                 </button>
              </div>

              <div className="mt-4 text-center">
                <button onClick={handleClosePrintModal} className="text-sm text-slate-400 hover:text-slate-600 underline">Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};