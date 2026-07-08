'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, TrendingUp, Edit2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Project } from '@/lib/types';

// Helper parsing untuk jam pengingat harian
const parseReminderTime = (desc: string) => {
  if (!desc) return '';
  const match = desc.match(/^\[Reminder:\s*([0-9]{2}:[0-9]{2})\]/);
  return match ? match[1] : '';
};

const parseNotes = (desc: string) => {
  if (!desc) return '';
  return desc.replace(/^\[Reminder:\s*[0-9]{2}:[0-9]{2}\]\s*/, '');
};

export default function GarapanPage() {
  const projects = useLiveQuery(() => db.projects.filter(p => !p.deleted_at).toArray()) || [];
  
  const dailyTasks = useLiveQuery(() => {
    const today = new Date().toISOString().split('T')[0];
    return db.garapan_tasks.where('date').equals(today).toArray();
  }) || [];

  // Auto-generate daily tasks for active projects marked as is_daily
  useEffect(() => {
    if (projects.length === 0) return;

    const generateDailyTasks = async () => {
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const activeDailies = projects.filter(p => p.status === 'active' && p.is_daily === 1);

      for (const proj of activeDailies) {
        // Cek jika deadline proyek belum terlewati
        if (proj.target_date && proj.target_date >= todayStr) {
          // Cek apakah tugas harian untuk proyek ini di hari ini sudah ada
          const exists = await db.garapan_tasks
            .where('project_id')
            .equals(proj.id)
            .and(t => t.date === todayStr)
            .first();

          if (!exists) {
            await db.garapan_tasks.add({
              id: crypto.randomUUID(),
              project_id: proj.id,
              title: `[Daily] ${proj.platform}`,
              is_completed: false,
              date: todayStr,
              sync_status: 'pending'
            });
          }
        }
      }
    };

    generateDailyTasks();
  }, [projects]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [isDailyProject, setIsDailyProject] = useState(false);
  
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [editIsDaily, setEditIsDaily] = useState(false);

  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  const toggleStatus = async (id: string, currentStatus: string) => {
    await db.projects.update(id, { status: currentStatus === 'active' ? 'completed' : 'active', sync_status: 'pending' });
  };

  const deleteProject = async (id: string) => {
    if (confirm('Hapus proyek ini?')) {
      await db.projects.update(id, { deleted_at: new Date().toISOString(), sync_status: 'pending' });
    }
  };

  const toggleDailyTask = async (id: string, currentStatus: boolean) => {
    await db.garapan_tasks.update(id, { is_completed: !currentStatus });
  };

  const deleteDailyTask = async (id: string) => {
    await db.garapan_tasks.delete(id);
  };

  const addDailyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    
    await db.garapan_tasks.add({
      id: crypto.randomUUID(),
      project_id: '',
      title: taskTitle.trim(),
      is_completed: false,
      date: new Date().toISOString().split('T')[0],
      sync_status: 'pending'
    });
    setTaskTitle('');
    setShowTaskAdd(false);
  };

  const addProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isDailyChecked = formData.get('is_daily') === 'on';
    const reminderTime = formData.get('reminder_time') as string;
    const notesText = formData.get('notes') as string;
    const platformName = formData.get('platform') as string;
    
    // Notes gabungan dengan platform info
    const fullNotes = platformName ? `[${platformName}] ${notesText}` : notesText;
    const descriptionVal = isDailyChecked && reminderTime
      ? `[Reminder: ${reminderTime}] ${fullNotes}`
      : fullNotes;

    await db.projects.add({
      id: crypto.randomUUID(),
      user_id: 'local_user',
      platform: formData.get('title') as string,
      target_date: formData.get('date') as string,
      estimated_reward: formData.get('reward') as string,
      status: 'active',
      is_daily: isDailyChecked ? 1 : 0,
      description: descriptionVal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: 'pending'
    });
    setShowAdd(false);
    setIsDailyProject(false);
  };

  const updateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    const formData = new FormData(e.currentTarget);
    const isDailyChecked = formData.get('is_daily') === 'on';
    const reminderTime = formData.get('reminder_time') as string;
    const notesText = formData.get('notes') as string;
    const platformName = formData.get('platform') as string;

    const fullNotes = platformName ? `[${platformName}] ${notesText}` : notesText;
    const descriptionVal = isDailyChecked && reminderTime
      ? `[Reminder: ${reminderTime}] ${fullNotes}`
      : fullNotes;

    await db.projects.update(editItem.id, {
      platform: formData.get('title') as string,
      target_date: formData.get('date') as string,
      estimated_reward: formData.get('reward') as string,
      is_daily: isDailyChecked ? 1 : 0,
      description: descriptionVal,
      status: formData.get('status') as 'active'|'completed',
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
    setShowEdit(false);
    setEditItem(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">Garapan & Airdrop</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-amber text-black text-sm font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all"
        >
          <Plus className="w-5 h-5" /> TAMBAH BARU
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="brutalist-card p-4 bg-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-lg font-black uppercase">Status Proyek</h2>
          </div>
          <div className="text-3xl font-black">{projects.filter(p => p.status === 'active').length} Aktif</div>
          <p className="text-xs font-bold uppercase mt-2 text-text-muted">Dari total {projects.length} garapan</p>
        </div>
        
        <div className="brutalist-card p-4 bg-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-5 h-5" />
            <h2 className="text-lg font-black uppercase">Daily Tracker</h2>
          </div>
          <div className="space-y-2 mt-3">
            {dailyTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleDailyTask(t.id, t.is_completed)} className="hover:scale-110 transition-transform">
                    {t.is_completed ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5 text-black" />}
                  </button>
                  <span className={`text-sm font-bold uppercase ${t.is_completed ? 'line-through opacity-50' : ''}`}>
                    {t.title}
                  </span>
                </div>
                <button onClick={() => deleteDailyTask(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-accent-rose hover:scale-110 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {!showTaskAdd ? (
              <button onClick={() => setShowTaskAdd(true)} className="text-xs font-bold uppercase flex items-center gap-1 text-text-muted hover:text-black mt-2">
                <Plus className="w-3 h-3" /> Tambah Task
              </button>
            ) : (
              <form onSubmit={addDailyTask} className="flex items-center gap-2 mt-2">
                <input 
                  type="text" 
                  autoFocus
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Nama task..." 
                  className="brutalist-input flex-1 p-1 text-sm border-black" 
                />
                <button type="submit" className="bg-black text-white px-2 py-1 text-xs font-bold border border-black hover:bg-accent-emerald hover:text-black transition-colors">OK</button>
                <button type="button" onClick={() => setShowTaskAdd(false)} className="bg-white text-black px-2 py-1 text-xs font-bold border border-black hover:bg-gray-100">X</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={addProject} className="brutalist-card p-6 bg-teal-100 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2 mb-4">Input Garapan Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Judul / Nama Proyek</label>
              <input name="title" type="text" required placeholder="Contoh: Megadrop" className="brutalist-input w-full p-2 border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Platform (CEX/Web)</label>
              <input name="platform" type="text" required placeholder="Contoh: Binance" className="brutalist-input w-full p-2 border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Estimasi Reward</label>
              <input name="reward" type="text" required placeholder="Contoh: $50 / 100 Token" className="brutalist-input w-full p-2 border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Tanggal/Deadline</label>
              <input name="date" type="date" required className="brutalist-input w-full p-2 border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Keterangan / Sumber</label>
              <input name="notes" type="text" placeholder="Catatan tambahan" className="brutalist-input w-full p-2 border-black" />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <input 
                  name="is_daily" 
                  type="checkbox" 
                  id="is_daily_check" 
                  checked={isDailyProject}
                  onChange={(e) => setIsDailyProject(e.target.checked)}
                  className="w-4 h-4 accent-black border-2 border-black" 
                />
                <label htmlFor="is_daily_check" className="text-xs font-black uppercase cursor-pointer select-none">Misi Harian (Daily Quest)?</label>
              </div>
              {isDailyProject && (
                <div className="mt-2 animate-fade-in">
                  <label className="block text-xs font-bold uppercase mb-1">Jam Reminder Bot (WIB)</label>
                  <input name="reminder_time" type="time" defaultValue="08:00" className="brutalist-input w-full p-2 border-black" required />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-black">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white text-black font-bold border border-black shadow-[1px_1px_0px_#000]">Batal</button>
            <button type="submit" className="px-4 py-2 bg-accent-emerald text-black font-bold border border-black shadow-[1px_1px_0px_#000]">Simpan Garapan</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {projects.map(p => {
          const isDaily = p.is_daily === 1;
          const todayTask = isDaily ? dailyTasks.find(t => t.project_id === p.id) : null;
          const reminderTime = parseReminderTime(p.description);
          const cleanNotes = parseNotes(p.description);

          return (
            <div key={p.id} className={`brutalist-card p-4 border-l-8 ${p.status === 'completed' ? 'border-l-black bg-gray-100 opacity-60' : 'border-l-accent-amber bg-white'} hover:-translate-y-1 transition-transform`}>
              <div className="flex justify-between items-start flex-col md:flex-row gap-4 md:gap-0">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-lg font-black uppercase ${p.status === 'completed' ? 'line-through' : ''}`}>{p.platform}</h3>
                    {isDaily && (
                      <span className="text-[9px] font-black bg-accent-purple text-white px-1.5 py-0.5 border border-black uppercase">Daily</span>
                    )}
                    {isDaily && reminderTime && (
                      <span className="text-[9px] font-black bg-black text-white px-1.5 py-0.5 border border-black uppercase">⏰ {reminderTime} WIB</span>
                    )}
                  </div>
                  {cleanNotes && (
                    <p className="text-xs font-bold text-text-muted mt-0.5 uppercase">{cleanNotes}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-bold text-text-muted mt-1 uppercase flex-wrap">
                    <span>💰 Reward: {p.estimated_reward}</span>
                    <span>📅 Date: {p.target_date}</span>
                  </div>

                  {/* Integrasi Daily Task Hari Ini ke Card */}
                  {isDaily && todayTask && (
                    <div className="mt-3 inline-block">
                      <button 
                        onClick={() => toggleDailyTask(todayTask.id, todayTask.is_completed)} 
                        className={`flex items-center gap-2 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none
                          ${todayTask.is_completed ? 'bg-accent-emerald text-black' : 'bg-pink-100 text-black'}`}
                      >
                        {todayTask.is_completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span>Misi Hari Ini: {todayTask.is_completed ? 'Selesai' : 'Belum Selesai'}</span>
                      </button>
                    </div>
                  )}
                </div>
              
                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  <button 
                    onClick={() => { setEditItem(p); setEditIsDaily(p.is_daily === 1); setShowEdit(true); }}
                    className="p-2 bg-accent-amber border border-black shadow-[1px_1px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                    title="Edit Garapan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleStatus(p.id, p.status)} className="flex items-center gap-1 text-xs font-bold uppercase px-2 py-1 bg-white border border-black shadow-[1px_1px_0px_#000] hover:bg-black hover:text-white transition-colors">
                    {p.status === 'completed' ? 'Buka Lagi' : 'Tandai Selesai'}
                  </button>
                  <button onClick={() => deleteProject(p.id)} className="p-2 bg-accent-rose text-white border border-black shadow-[1px_1px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {showEdit && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-lg shadow-[8px_8px_0px_#000] animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Edit Garapan</h2>
              <button type="button" onClick={() => { setShowEdit(false); setEditItem(null); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={updateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Judul / Nama Proyek</label>
                  <input name="title" type="text" defaultValue={editItem.platform} required className="brutalist-input w-full p-2 border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Estimasi Reward</label>
                  <input name="reward" type="text" defaultValue={editItem.estimated_reward} required className="brutalist-input w-full p-2 border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Tanggal/Deadline</label>
                  <input name="date" type="date" defaultValue={editItem.target_date} required className="brutalist-input w-full p-2 border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Status Proyek</label>
                  <select name="status" defaultValue={editItem.status} className="brutalist-input w-full p-2 border-black bg-white">
                    <option value="active">Aktif (Active)</option>
                    <option value="completed">Selesai (Completed)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase mb-1">Keterangan / Catatan</label>
                  <input name="notes" type="text" defaultValue={parseNotes(editItem.description)} placeholder="Keterangan tambahan" className="brutalist-input w-full p-2 border-black" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      name="is_daily" 
                      type="checkbox" 
                      id="edit_is_daily_check" 
                      checked={editIsDaily}
                      onChange={(e) => setEditIsDaily(e.target.checked)}
                      className="w-4 h-4 accent-black border-2 border-black" 
                    />
                    <label htmlFor="edit_is_daily_check" className="text-xs font-black uppercase cursor-pointer select-none">Misi Harian (Daily Quest)?</label>
                  </div>
                  {editIsDaily && (
                    <div className="mt-2 animate-fade-in">
                      <label className="block text-xs font-bold uppercase mb-1">Jam Reminder Bot (WIB)</label>
                      <input name="reminder_time" type="time" defaultValue={parseReminderTime(editItem.description) || '08:00'} className="brutalist-input w-full p-2 border-black" required />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-black">
                <button type="button" onClick={() => { setShowEdit(false); setEditItem(null); }} className="px-4 py-2 bg-white text-black font-bold border border-black shadow-[1px_1px_0px_#000]">Batal</button>
                <button type="submit" className="px-4 py-2 bg-accent-emerald text-black font-bold border border-black shadow-[1px_1px_0px_#000]">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
