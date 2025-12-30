
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MemoryRouter, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import { 
  Plus, 
  ChevronLeft, 
  Check, 
  X, 
  Fingerprint, 
  LayoutDashboard, 
  BarChart3, 
  BookOpen, 
  Bell, 
  Timer, 
  MapPin, 
  Clock, 
  Layers, 
  BrainCircuit, 
  Quote,
  Flame,
  Target,
  ArrowRight,
  Filter,
  Sparkles,
  Zap,
  RotateCcw,
  Trash2,
  Trophy,
  Bot,
  Loader2
} from 'lucide-react';
import { Habit, HabitLog } from './types';
import { getHabitAdvice, getSystemAudit } from './services/geminiService';
import { ATOMIC_TIPS } from './constants';

/** 
 * --- PERSISTENCE HELPERS ---
 */
const saveToLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const getFromLocal = (key: string) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
};

/**
 * --- COMMON COMPONENTS ---
 */

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111118]/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/') ? 'text-[#4b40ed]' : 'text-[#9e9db9] hover:text-[#4b40ed]'}`}>
          <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Hoy</span>
        </Link>
        <Link to="/stats" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/stats') ? 'text-[#4b40ed]' : 'text-[#9e9db9] hover:text-[#4b40ed]'}`}>
          <BarChart3 size={24} strokeWidth={isActive('/stats') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Progreso</span>
        </Link>
        <Link to="/philosophy" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/philosophy') ? 'text-[#4b40ed]' : 'text-[#9e9db9] hover:text-[#4b40ed]'}`}>
          <BookOpen size={24} strokeWidth={isActive('/philosophy') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Método</span>
        </Link>
      </div>
    </nav>
  );
};

const HabitCard = ({ habit, completed, onToggle, onDelete, streak }: { 
  habit: Habit, 
  completed: boolean, 
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  streak: number 
}) => {
  return (
    <div className="group relative flex items-center gap-4 bg-white dark:bg-[#1e1d2b] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-[#4b40ed]/50 transition-all duration-200 shadow-sm">
      <label className="relative flex items-center justify-center cursor-pointer p-1">
        <input 
          className="peer sr-only" 
          type="checkbox" 
          checked={completed} 
          onChange={() => onToggle(habit.id)}
        />
        <div className={`h-8 w-8 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
          completed 
          ? 'bg-[#4b40ed] border-[#4b40ed] scale-110 shadow-lg shadow-[#4b40ed]/30' 
          : 'border-gray-300 dark:border-gray-600'
        }`}>
          <Check size={18} className={`text-white transition-opacity duration-200 ${completed ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
        </div>
      </label>
      
      <div className={`flex flex-1 flex-col transition-all duration-300 ${completed ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-start">
          <p className={`text-gray-900 dark:text-white text-base font-bold leading-tight group-hover:text-[#4b40ed] transition-colors ${completed ? 'line-through' : ''}`}>
            {habit.name}
          </p>
          <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-lg">
             <Flame size={12} className="text-orange-500" />
             <span className="text-[10px] font-black text-orange-600">{streak}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {habit.stackingHabit && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">
              <Layers size={10} className="text-[#9e9db9]" />
              <p className="text-[#9e9db9] text-[10px] font-medium truncate max-w-[120px]">D: {habit.stackingHabit}</p>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
            <Fingerprint size={10} className="text-purple-400" />
            <p className="text-[10px] text-purple-400 font-bold truncate max-w-[100px]">{habit.identity}</p>
          </div>
        </div>
      </div>

      <button onClick={() => onDelete(habit.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-all shrink-0">
        <Trash2 size={16} />
      </button>
    </div>
  );
};

/**
 * --- SCREEN 1: DASHBOARD ---
 */
const Dashboard = ({ habits, logs, onToggle, onDelete, advice, onCloseAdvice }: any) => {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter((h: Habit) => logs.some((l: HabitLog) => l.habitId === h.id && l.date === today && l.completed)).length;
  const progress = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  const calculateStreak = (habitId: string) => {
    let streak = 0;
    const habitLogs = logs
      .filter((l: HabitLog) => l.habitId === habitId && l.completed)
      .sort((a: HabitLog, b: HabitLog) => b.date.localeCompare(a.date));
    
    if (habitLogs.length === 0) return 0;
    
    let checkDate = new Date();
    checkDate.setHours(0,0,0,0);
    
    for (const log of habitLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0,0,0,0);
      const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (86400000));
      
      if (diffDays <= 1) {
        streak++;
        checkDate = logDate;
      } else break;
    }
    return streak;
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-[#f6f6f8] dark:bg-[#121121] pb-24">
      <header className="sticky top-0 z-20 flex items-center bg-[#f6f6f8]/95 dark:bg-[#121121]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="bg-[#4b40ed]/20 rounded-full size-10 flex items-center justify-center border-2 border-[#4b40ed]/50 overflow-hidden">
               <Trophy size={20} className="text-[#4b40ed]" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#121121] rounded-full"></div>
          </div>
          <div>
            <h2 className="text-xs font-medium text-[#9e9db9]">Hoy es un gran día,</h2>
            <h3 className="text-base font-bold leading-tight text-gray-900 dark:text-white">James Clear AI</h3>
          </div>
        </div>
        <button className="flex items-center justify-center rounded-full size-10 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-[#1e1d2b] transition-colors border border-transparent dark:border-gray-800">
          <Bell size={20} />
        </button>
      </header>

      <section className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint size={18} className="text-[#4b40ed]" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#9e9db9]">Identidad Actual</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
          Estoy <br/><span className="text-[#4b40ed]">diseñando mi sistema.</span>
        </h1>
        
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#1e1d2b] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#4b40ed]/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-end mb-3 relative z-10">
            <div>
              <p className="text-gray-900 dark:text-white text-lg font-bold">Progreso Diario</p>
              <p className="text-[#9e9db9] text-sm mt-1">El interés compuesto de hoy</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#4b40ed]">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="relative h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="absolute h-full bg-gradient-to-r from-[#4b40ed] to-purple-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${progress}%`}}></div>
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-[#9e9db9]">
            <span>{completedToday} completados</span>
            <span>{habits.length - completedToday} pendientes</span>
          </div>
        </div>
      </section>

      {advice && (
        <div className="mx-6 mt-4 p-5 rounded-3xl bg-indigo-50 dark:bg-[#4b40ed]/10 border border-[#4b40ed]/20 relative animate-in fade-in slide-in-from-top duration-500">
          <button onClick={onCloseAdvice} className="absolute top-3 right-3 text-[#4b40ed]/50 hover:text-[#4b40ed]">
            <X size={16} />
          </button>
          <div className="flex gap-3">
            <Sparkles size={20} className="text-[#4b40ed] shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-[#4b40ed] uppercase mb-1">Consejo de IA</p>
              <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                {advice}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 px-6 py-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Átomos del día</h3>
      </div>

      <section className="flex flex-col gap-3 px-6 pb-4">
        {habits.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Zap size={40} className="mx-auto mb-2 text-[#9e9db9]" />
            <p className="text-sm italic">Tu sistema está vacío. Crea tu primer átomo.</p>
          </div>
        ) : habits.map((h: Habit) => (
          <HabitCard 
            key={h.id}
            habit={h}
            completed={logs.some((l: HabitLog) => l.habitId === h.id && l.date === today && l.completed)}
            onToggle={onToggle}
            onDelete={onDelete}
            streak={calculateStreak(h.id)}
          />
        ))}
      </section>

      <div className="fixed bottom-24 right-6 z-30">
        <Link to="/create" className="group flex items-center justify-center gap-2 bg-[#4b40ed] hover:bg-[#4b40ed]/90 text-white rounded-full h-14 pl-5 pr-6 shadow-[0_8px_30px_rgb(75,64,237,0.4)] transition-all hover:scale-105 active:scale-95">
          <Plus size={24} strokeWidth={3} />
          <span className="font-bold text-base">Crear Hábito</span>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
};

/**
 * --- SCREEN 2: CREATE HABIT ---
 */
const CreateHabit = ({ onAdd }: { onAdd: (h: any) => void }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identity: '',
    stacking: '',
    cue: '',
    twoMin: ''
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.identity) return;
    setLoading(true);
    const advice = await getHabitAdvice(formData.name, formData.identity);
    onAdd({
      ...formData,
      advice
    });
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="bg-black/60 backdrop-blur-sm flex items-end justify-center min-h-screen fixed inset-0 z-50">
      <div className="w-full max-w-md bg-[#f6f6f8] dark:bg-[#121121] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[92vh] animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-center pt-4 pb-2 flex-shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        </div>
        
        <div className="px-6 pb-2 pt-2 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">Nuevo Átomo</h2>
            <p className="text-xs text-[#4b40ed] font-semibold uppercase tracking-widest mt-1">Diseña tu sistema</p>
          </div>
          <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-gray-200 dark:bg-[#1e1d2b] flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 no-scrollbar">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-[#4b40ed]" />
              <label className="text-[#9e9db9] text-xs font-semibold uppercase tracking-wider">Identidad</label>
            </div>
            <p className="text-gray-900 dark:text-white text-base font-medium mb-3">¿En quién te quieres convertir?</p>
            <input 
              className="w-full bg-white dark:bg-[#1e1d2b] text-gray-900 dark:text-white rounded-2xl py-4 px-6 border-none focus:ring-2 focus:ring-[#4b40ed] placeholder-gray-400 shadow-sm" 
              placeholder="e.g., Un lector ávido" 
              type="text"
              value={formData.identity}
              onChange={e => setFormData({...formData, identity: e.target.value})}
            />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[#4b40ed]" />
              <label className="text-[#9e9db9] text-xs font-semibold uppercase tracking-wider">Hábito</label>
            </div>
            <input 
              className="w-full bg-white dark:bg-[#1e1d2b] text-gray-900 dark:text-white rounded-2xl py-4 px-6 border-none focus:ring-2 focus:ring-[#4b40ed] placeholder-gray-400 shadow-sm" 
              placeholder="e.g., Leer 20 minutos" 
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="mb-8 p-6 rounded-[2rem] bg-white dark:bg-[#1e1d2b] border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-[#4b40ed]" />
              <label className="text-[#9e9db9] text-xs font-semibold uppercase tracking-wider">Apilamiento</label>
            </div>
            <div className="relative pl-4 ml-2 border-l-2 border-dashed border-gray-300 dark:border-gray-700 space-y-6">
              <div className="relative">
                <div className="absolute -left-[23px] top-[40px] h-3 w-3 rounded-full border-2 border-gray-400 bg-[#f6f6f8] dark:bg-[#121121] z-10"></div>
                <label className="block text-[#9e9db9] text-[10px] font-bold mb-2 pl-1 uppercase tracking-tighter">Después de...</label>
                <input 
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl py-3 px-4 border-none focus:ring-2 focus:ring-[#4b40ed] placeholder-gray-400 text-sm" 
                  placeholder="Ej: Tomar café" 
                  type="text"
                  value={formData.stacking}
                  onChange={e => setFormData({...formData, stacking: e.target.value})}
                />
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] top-[40px] h-3 w-3 rounded-full bg-[#4b40ed] shadow-[0_0_8px_rgba(75,64,237,0.6)] z-10"></div>
                <label className="block text-[#4b40ed] text-[10px] font-bold mb-2 pl-1 uppercase tracking-tighter">Haré...</label>
                <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 py-3 px-4 rounded-xl text-sm border-none italic">
                  {formData.name || 'Tu nuevo hábito'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1e1d2b] border border-transparent flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#4b40ed]/10 flex items-center justify-center text-[#4b40ed]">
                <Timer size={20} />
              </div>
              <div className="flex-1">
                <label className="block text-[#9e9db9] text-[10px] font-bold uppercase mb-1">Regla de los 2 min</label>
                <input 
                  className="w-full bg-transparent text-gray-900 dark:text-white border-none focus:ring-0 text-sm placeholder-gray-400 p-0" 
                  placeholder="Ej: Leer una página" 
                  value={formData.twoMin}
                  onChange={e => setFormData({...formData, twoMin: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 bg-[#f6f6f8] dark:bg-[#121121] flex-shrink-0">
          <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="flex-1 py-4 px-6 rounded-full text-[#9e9db9] font-bold hover:bg-gray-200 dark:hover:bg-[#1e1d2b] transition-colors">
              Cancelar
            </button>
            <button 
              disabled={loading || !formData.name}
              onClick={handleSubmit} 
              className="flex-[2] py-4 px-6 rounded-full bg-[#4b40ed] text-white font-bold shadow-lg shadow-[#4b40ed]/30 hover:bg-[#3b32db] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <RotateCcw className="animate-spin" size={18} />
              ) : (
                <>
                  <span>Crear Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * --- SCREEN 3: STATS ---
 */
const StatsScreen = ({ habits, logs }: any) => {
  const navigate = useNavigate();
  const [audit, setAudit] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const runAudit = async () => {
    if (habits.length === 0) return;
    setLoadingAudit(true);
    const result = await getSystemAudit(habits, logs);
    setAudit(result);
    setLoadingAudit(false);
  };

  const DotsGrid = ({ count }: any) => {
    return (
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: count }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (count - 1 - i));
          const dateStr = d.toISOString().split('T')[0];
          const isCompleted = logs.some((l: any) => l.date === dateStr && l.completed);
          
          return (
            <div 
              key={i} 
              className={`aspect-square rounded-full transition-all duration-500 ${
                isCompleted 
                ? 'bg-[#4b40ed] shadow-[0_0_8px_rgba(75,64,237,0.4)]' 
                : 'bg-gray-200 dark:bg-white/5'
              }`}
            />
          );
        })}
      </div>
    );
  };

  const totalCompletions = logs.filter((l: any) => l.completed).length;

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-[#f6f6f8] dark:bg-[#121121] pb-24">
      <header className="sticky top-0 z-50 flex items-center bg-[#f6f6f8]/80 dark:bg-[#121121]/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-transparent">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-900 dark:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold flex-1 text-center">Mi Historial</h2>
        <div className="size-10" />
      </header>

      <div className="p-6">
        {/* James Clear AI Audit */}
        <div className="mb-8">
          {!audit ? (
            <button 
              onClick={runAudit}
              disabled={loadingAudit || habits.length === 0}
              className="w-full bg-white dark:bg-[#1e1d2b] p-6 rounded-[2.5rem] border-2 border-dashed border-[#4b40ed]/30 flex flex-col items-center justify-center gap-3 group hover:border-[#4b40ed] transition-all disabled:opacity-50"
            >
              <div className="size-14 rounded-2xl bg-[#4b40ed]/10 flex items-center justify-center text-[#4b40ed] group-hover:scale-110 transition-transform">
                {loadingAudit ? <Loader2 className="animate-spin" size={28} /> : <Bot size={28} />}
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">Auditoría Atómica</p>
                <p className="text-xs text-[#9e9db9]">Deja que la IA analice tu sistema actual</p>
              </div>
            </button>
          ) : (
            <div className="bg-[#4b40ed] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-[#4b40ed]/30 animate-in zoom-in duration-500">
               <Sparkles className="absolute -top-6 -right-6 size-32 text-white/10" />
               <div className="flex items-center gap-2 mb-4">
                 <Bot size={20} className="text-white" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Auditando Sistema...</span>
               </div>
               <p className="text-sm leading-relaxed font-medium italic">
                 "{audit}"
               </p>
               <button 
                onClick={() => setAudit(null)}
                className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1"
               >
                 <RotateCcw size={12} /> Re-evaluar mañana
               </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1e1d2b] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col items-center shadow-sm">
            <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
              <Flame size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalCompletions}</span>
            <span className="text-xs text-[#9e9db9] font-medium">Logros Totales</span>
          </div>
          <div className="bg-white dark:bg-[#1e1d2b] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col items-center shadow-sm">
            <div className="size-12 rounded-2xl bg-[#4b40ed]/10 flex items-center justify-center text-[#4b40ed] mb-2">
              <Sparkles size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {logs.length > 0 ? Math.round((logs.filter((l:any) => l.completed).length / (logs.length || 1)) * 100) : 0}%
            </span>
            <span className="text-xs text-[#9e9db9] font-medium">Tasa de Éxito</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1d2b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Últimos 30 Átomos</h3>
              <div className="flex items-center gap-1 text-[#4b40ed] text-xs font-bold">
                 <span>{new Date().getFullYear()}</span>
              </div>
           </div>
           <DotsGrid count={30} />
           <div className="mt-8 flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800">
             <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{totalCompletions}</span>
                  <span className="text-[10px] text-[#9e9db9] font-bold uppercase tracking-wider">Cumplidos</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-rose-500">{logs.filter((l:any) => !l.completed).length}</span>
                  <span className="text-[10px] text-[#9e9db9] font-bold uppercase tracking-wider">Fallidos</span>
                </div>
             </div>
           </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

/**
 * --- SCREEN 4: PHILOSOPHY ---
 */
const PhilosophyScreen = () => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-[#f6f6f8] dark:bg-[#121121] pb-24">
      <header className="p-8 pb-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">El Método</h1>
        <p className="text-[#9e9db9] text-sm mt-1">Los fundamentos de Hábitos Atómicos</p>
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-[#4b40ed] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-[#4b40ed]/30">
          <Sparkles className="absolute -top-6 -right-6 size-32 text-white/10" />
          <h2 className="text-2xl font-bold mb-3">Hábitos de Identidad</h2>
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            La forma más efectiva de cambiar tus hábitos es enfocarte no en lo que quieres lograr, sino en quién deseas convertirte.
          </p>
          <div className="flex flex-col gap-3">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex items-center gap-4 backdrop-blur-md">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center font-black">1</div>
              <span className="font-bold text-sm">Decide qué tipo de persona quieres ser.</span>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex items-center gap-4 backdrop-blur-md">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center font-black">2</div>
              <span className="font-bold text-sm">Demuéstratelo con pequeñas victorias.</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1d2b] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
             <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Timer size={24} />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Regla de los 2 Minutos</h3>
          </div>
          <p className="text-[#9e9db9] text-sm leading-relaxed italic">
            "Cuando empiezas un nuevo hábito, debe tomarte menos de dos minutos. 'Leer antes de dormir' se convierte en 'Leer una página'."
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e1d2b] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
             <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Layers size={24} />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Apilamiento</h3>
          </div>
          <p className="text-[#9e9db9] text-sm leading-relaxed mb-4">
            Una de las mejores formas de crear un hábito es identificar uno que ya tengas y apilar el nuevo comportamiento encima.
          </p>
          <div className="p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
             <p className="text-[10px] font-black text-[#4b40ed] uppercase tracking-widest mb-2">La Fórmula</p>
             <p className="text-gray-900 dark:text-white italic text-sm font-bold">
               "Después de [Hábito Actual], haré [Hábito Nuevo]."
             </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

/**
 * --- MAIN APP WRAPPER ---
 */
export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [activeAdvice, setActiveAdvice] = useState<string | null>(null);

  useEffect(() => {
    const h = getFromLocal('at_habits');
    const l = getFromLocal('at_logs');
    if (h) setHabits(h);
    if (l) setLogs(l);
  }, []);

  useEffect(() => {
    saveToLocal('at_habits', habits);
    saveToLocal('at_logs', logs);
  }, [habits, logs]);

  const onAddHabit = (data: any) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: data.name,
      identity: data.identity,
      cue: data.cue,
      easyVersion: data.twoMin,
      stackingHabit: data.stacking,
      createdAt: Date.now(),
      color: 'bg-[#4b40ed]',
      category: 'Otros'
    };
    setHabits([...habits, newHabit]);
    if (data.advice) setActiveAdvice(data.advice);
  };

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = logs.findIndex(l => l.habitId === id && l.date === today);
    
    if (existingIndex >= 0) {
      const newLogs = [...logs];
      newLogs[existingIndex].completed = !newLogs[existingIndex].completed;
      setLogs(newLogs);
    } else {
      setLogs([...logs, { habitId: id, date: today, completed: true }]);
    }
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    setLogs(logs.filter(l => l.habitId !== id));
  };

  return (
    <MemoryRouter>
      <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#121121] text-gray-900 dark:text-white selection:bg-[#4b40ed] selection:text-white font-sans antialiased">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                habits={habits} 
                logs={logs} 
                onToggle={toggleHabit} 
                onDelete={deleteHabit}
                advice={activeAdvice}
                onCloseAdvice={() => setActiveAdvice(null)}
              />
            } 
          />
          <Route path="/create" element={<CreateHabit onAdd={onAddHabit} />} />
          <Route path="/stats" element={<StatsScreen habits={habits} logs={logs} />} />
          <Route path="/philosophy" element={<PhilosophyScreen />} />
        </Routes>
      </div>
    </MemoryRouter>
  );
}
