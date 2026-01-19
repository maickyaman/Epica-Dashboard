
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Receipt, Users, PlusCircle, TrendingUp, TrendingDown, 
  Wallet, Menu, X, Calendar, Layers, Plus, Lock, LogOut, Settings, 
  FileSpreadsheet, Upload, Edit2, Trash2, CreditCard, Zap, Cloud, CloudCheck, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, 
  query, orderBy, setDoc 
} from 'firebase/firestore';
// Fix: Consolidating firebase/auth imports to a single line to ensure correct member resolution
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// Import Google Gemini API
import { GoogleGenAI } from "@google/genai";

import { 
  Transaction, TransactionType, SourceType, Participant, Stats, Edition 
} from './types';
import { STAFF_MEMBERS } from './constants';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
  apiKey: "IL_TUO_API_KEY",
  authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
  projectId: "IL_TUO_PROGETTO",
  storageBucket: "IL_TUO_PROGETTO.appspot.com",
  messagingSenderId: "IL_TUO_SENDER_ID",
  appId: "IL_TUO_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Utilities ---
const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Componenti UI Riutilizzabili ---

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
    {icon} <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color, currency = true }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <div className={`p-3 w-fit rounded-xl mb-4 ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 truncate">{currency ? `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : value}</h3>
    </div>
  </div>
);

// AI Assistant Component
const AIAssistant = ({ stats }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questi dati per l'evento "Epica Camonica":
        Entrate: €${stats.totalIncome}
        Uscite: €${stats.totalExpense}
        Saldo: €${stats.netBalance}
        Partecipanti: ${stats.participantsCount}
        E-bike: ${stats.totalEbikes}
        Fornisci un breve commento strategico in italiano sull'andamento dell'evento.`
      });
      setAnalysis(response.text || "Nessuna analisi disponibile.");
    } catch (e) {
      setAnalysis("Errore durante l'analisi AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-600 to-emerald-600 p-8 rounded-3xl text-white shadow-xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Zap size={24} /></div>
        <h3 className="text-xl font-bold">Assistente Epica AI</h3>
      </div>
      {analysis ? (
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm text-sm leading-relaxed mb-4">
          {analysis}
        </div>
      ) : (
        <p className="text-white/70 text-sm mb-4">Ottieni una panoramica strategica dei tuoi dati finanziari grazie all'intelligenza artificiale di Gemini.</p>
      )}
      <button 
        onClick={analyze} 
        disabled={loading}
        className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Analisi in corso..." : (analysis ? "Aggiorna Analisi" : "Analizza con Gemini")}
      </button>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'participants' | 'editions' | 'settings'>('dashboard');
  
  const [editions, setEditions] = useState<Edition[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const [selectedEditionId, setSelectedEditionId] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddEditionModalOpen, setIsAddEditionModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);

    const unsubEditions = onSnapshot(collection(db, 'editions'), (snapshot) => {
      setEditions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Edition)));
    });

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)));
    });

    const unsubParticipants = onSnapshot(collection(db, 'participants'), (snapshot) => {
      setParticipants(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Participant)));
      setIsSyncing(false);
    });

    return () => {
      unsubEditions();
      unsubTransactions();
      unsubParticipants();
    };
  }, [user]);

  const stats = useMemo(() => {
    const fT = selectedEditionId === 'all' ? transactions : transactions.filter(t => t.editionId === selectedEditionId);
    const fP = selectedEditionId === 'all' ? participants : participants.filter(p => p.editionId === selectedEditionId);
    
    const income = fT.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = fT.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const endu = fT.filter(t => t.source === SourceType.ENDU && t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const cash = fT.filter(t => t.source === SourceType.CASH && t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const ebikes = fP.filter(p => p.ebike).length;

    return { totalIncome: income, totalExpense: expense, netBalance: income - expense, enduIncome: endu, cashIncome: cash, totalEbikes: ebikes, participantsCount: fP.length };
  }, [transactions, participants, selectedEditionId]);

  if (isAuthLoading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold tracking-widest uppercase text-[10px] opacity-50">Epica Camonica Cloud</p>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Modal Participant */}
      {isParticipantModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingParticipant ? 'Modifica Iscritto' : 'Nuovo Iscritto'}</h3>
              <button onClick={() => setIsParticipantModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <ParticipantForm 
              participant={editingParticipant} 
              onSave={async (p) => {
                const { id, ...data } = p;
                if (id.startsWith('new-')) await addDoc(collection(db, 'participants'), data);
                else await updateDoc(doc(db, 'participants', id), data);
                setIsParticipantModalOpen(false);
              }} 
              editionId={selectedEditionId === 'all' ? (editions[0]?.id || '2025') : selectedEditionId}
            />
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white"><TrendingUp size={24} /></div>
            <h1 className="text-xl font-bold">Epica Cloud</h1>
          </div>
          <nav className="space-y-1 flex-1">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={<Receipt size={20} />} label="Bilancio" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
            <SidebarItem icon={<Users size={20} />} label="Iscritti" active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} />
            <SidebarItem icon={<Layers size={20} />} label="Edizioni" active={activeTab === 'editions'} onClick={() => setActiveTab('editions')} />
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4 px-2">
              {isSyncing ? <Cloud size={16} className="text-blue-500 loading-pulse" /> : <CloudCheck size={16} className="text-green-500" />}
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isSyncing ? 'Sincronizzazione...' : 'Dati Salvati'}</span>
            </div>
            <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
              <LogOut size={20} /> Esci
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab !== 'settings' && (
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-slate-400" />
                <select value={selectedEditionId} onChange={(e) => setSelectedEditionId(e.target.value)} className="bg-transparent text-slate-900 text-sm font-bold focus:outline-none cursor-pointer">
                  <option value="all">🌍 Riepilogo Storico</option>
                  {editions.map(e => <option key={e.id} value={e.id}>📅 {e.name}</option>)}
                </select>
              </div>
              <button onClick={() => setIsAddEditionModalOpen(true)} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2">
                <Plus size={18} /> Nuova Edizione
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardView stats={stats} transactions={selectedEditionId === 'all' ? transactions : transactions.filter(t => t.editionId === selectedEditionId)} onExport={() => downloadCSV(transactions, 'Report_Epica')} />}
          {activeTab === 'transactions' && <TransactionsView transactions={selectedEditionId === 'all' ? transactions : transactions.filter(t => t.editionId === selectedEditionId)} editions={editions} currentEdition={selectedEditionId} />}
          {activeTab === 'participants' && <ParticipantsView participants={selectedEditionId === 'all' ? participants : participants.filter(p => p.editionId === selectedEditionId)} onEdit={(p) => { setEditingParticipant(p); setIsParticipantModalOpen(true); }} onAdd={() => { setEditingParticipant(null); setIsParticipantModalOpen(true); }} onDelete={async (id) => { if(window.confirm("Eliminare?")) await deleteDoc(doc(db, 'participants', id)); }} />}
          {activeTab === 'editions' && <EditionsView editions={editions} onAdd={async (e) => await setDoc(doc(db, 'editions', e.id), e)} />}
        </div>
      </main>

      {isAddEditionModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Crea Edizione</h3>
            <EditionForm onAdd={(e) => { setDoc(doc(db, 'editions', e.id), e); setIsAddEditionModalOpen(false); }} onCancel={() => setIsAddEditionModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

// --- View Components ---

const DashboardView = ({ stats, transactions, onExport }) => {
  const chartData = [
    { name: 'Entrate', val: stats.totalIncome, fill: '#059669' },
    { name: 'Uscite', val: stats.totalExpense, fill: '#e11d48' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panoramica</h2>
          <p className="text-slate-400 text-sm">Resoconto finanziario e logistico.</p>
        </div>
        <button onClick={onExport} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"><FileSpreadsheet size={18} /> Esporta</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Tot. Entrate" value={stats.totalIncome} icon={<TrendingUp size={24} />} color="bg-green-50 text-green-600" />
        <StatCard title="Tot. Uscite" value={stats.totalExpense} icon={<TrendingDown size={24} />} color="bg-red-50 text-red-600" />
        <StatCard title="Saldo Netto" value={stats.netBalance} icon={<Wallet size={24} />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Partecipanti" value={stats.participantsCount} icon={<Users size={24} />} color="bg-slate-100 text-slate-600" currency={false} />
        <StatCard title="E-Bike" value={stats.totalEbikes} icon={<Zap size={24} />} color="bg-yellow-50 text-yellow-600" currency={false} />
      </div>

      <AIAssistant stats={stats} />

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-8">Flusso Finanziario</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="val" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const TransactionsView = ({ transactions, editions, currentEdition }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: TransactionType.INCOME, date: new Date().toISOString().split('T')[0], editionId: currentEdition === 'all' ? (editions[0]?.id || '') : currentEdition });

  const add = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    await addDoc(collection(db, 'transactions'), { ...form, amount: parseFloat(form.amount), source: SourceType.CASH, person: STAFF_MEMBERS[0] });
    setShowForm(false);
    setForm({...form, description: '', amount: ''});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registro Movimenti</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-transform hover:scale-105">+ Movimento</button>
      </div>
      {showForm && (
        <form onSubmit={add} className="bg-white p-6 rounded-3xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4">
          <input type="text" placeholder="Descrizione" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          <input type="number" step="0.01" placeholder="Importo" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value as TransactionType})} className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500">
             <option value={TransactionType.INCOME}>Entrata</option>
             <option value={TransactionType.EXPENSE}>Uscita</option>
          </select>
          <button type="submit" className="bg-slate-900 text-white font-bold rounded-xl">Salva</button>
        </form>
      )}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
            <tr><th className="p-4">Data</th><th className="p-4">Descrizione</th><th className="p-4 text-right">Importo</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="text-sm group hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-400">{new Date(t.date).toLocaleDateString('it-IT')}</td>
                <td className="p-4 font-bold">{t.description}</td>
                <td className={`p-4 text-right font-black ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'} € {t.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 w-10">
                  <button onClick={async () => await deleteDoc(doc(db, 'transactions', t.id))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ParticipantsView = ({ participants, onEdit, onAdd, onDelete }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Anagrafica Iscritti</h2>
      <button onClick={onAdd} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-transform hover:scale-105">+ Iscritto</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {participants.map(p => (
        <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 group relative shadow-sm hover:border-green-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-lg">{p.nome[0]}{p.cognome[0]}</div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(p)} className="p-2 text-slate-300 hover:text-blue-500"><Edit2 size={16} /></button>
              <button onClick={() => onDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
          <h4 className="font-bold text-lg leading-tight">{p.nome} {p.cognome}</h4>
          <p className="text-xs text-slate-400 mb-4">{p.citta || 'Città non specificata'}</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {p.ebike && <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md flex items-center gap-1"><Zap size={10}/> E-BIKE</span>}
            {p.pranzo && <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-md">PRANZO</span>}
            {p.notteHotel && <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-md">HOTEL</span>}
          </div>
          <div className="pt-4 border-t border-slate-50 text-[10px] font-bold text-green-600">PAGATO: € {p.pagato.toFixed(2)}</div>
        </div>
      ))}
    </div>
  </div>
);

const ParticipantForm = ({ participant, onSave, editionId }) => {
  const [form, setForm] = useState(participant || { nome: '', cognome: '', citta: '', cellulare: '', taglia: 'M', tappaPullman: 'pisogne - ponte di legno', pranzo: false, notteHotel: false, ebike: false, pagato: 0, note: '', id: 'new-' + Date.now() });
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({...form, editionId}); }} className="grid grid-cols-2 gap-4">
      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label><input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none" /></div>
      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Cognome</label><input required value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none" /></div>
      <div className="col-span-2 flex gap-4 py-4 border-y border-slate-50 my-2">
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={form.ebike} onChange={e => setForm({...form, ebike: e.target.checked})} className="w-4 h-4 accent-yellow-500" /> E-BIKE</label>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={form.pranzo} onChange={e => setForm({...form, pranzo: e.target.checked})} className="w-4 h-4 accent-green-600" /> PRANZO</label>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={form.notteHotel} onChange={e => setForm({...form, notteHotel: e.target.checked})} className="w-4 h-4 accent-purple-600" /> HOTEL</label>
      </div>
      <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Importo Pagato (€)</label><input type="number" step="0.01" value={form.pagato} onChange={e => setForm({...form, pagato: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 rounded-xl font-bold" /></div>
      <button type="submit" className="col-span-2 bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg transition-transform hover:scale-[1.02] mt-4">Salva nel Cloud</button>
    </form>
  );
};

const EditionsView = ({ editions, onAdd }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Eventi Registrati</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {editions.map(e => (
        <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center group shadow-sm hover:border-green-300 transition-all">
          <div><p className="text-[10px] font-black text-slate-300 uppercase">{e.year}</p><h4 className="font-bold text-xl">{e.name}</h4></div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all"><Calendar size={24} /></div>
        </div>
      ))}
    </div>
  </div>
);

const EditionForm = ({ onAdd, onCancel }) => {
  const [year, setYear] = useState('');
  const [name, setName] = useState('');
  return (
    <div className="space-y-4">
      <input placeholder="Anno (es: 2026)" value={year} onChange={e => setYear(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" />
      <input placeholder="Nome Edizione" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 p-4 text-slate-400 font-bold">Annulla</button>
        <button onClick={() => onAdd({id: year, year, name})} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg">Crea</button>
      </div>
    </div>
  );
};

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Errore: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl space-y-8 animate-in zoom-in-95">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 text-green-700 rounded-3xl flex items-center justify-center mx-auto mb-6"><Lock size={40} /></div>
          <h2 className="text-3xl font-bold tracking-tight">Epica Cloud</h2>
          <p className="text-slate-400 text-sm mt-2">Accedi alla piattaforma protetta dell'evento.</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" required />
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-xl hover:bg-green-700 transition-all flex items-center justify-center">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest">{isLogin ? 'Crea un nuovo account' : 'Hai già un account? Accedi'}</button>
      </div>
    </div>
  );
};

export default App;
