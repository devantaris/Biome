// ============================================
// Focus Forest — Co-working Study Rooms v3
// Social accountability & synchronized focus
// ============================================
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Plus, Play, Pause, LogOut, Copy, Check,
  Sparkles, Clock, Volume2, Globe, Radio, ShieldAlert
} from 'lucide-react';
import type { AppState, AppActions, ViewType } from '../types';
import type { TimerActions } from '../hooks/useTimer';
import { AMBIENT_SOUNDS } from '../constants';

interface StudyRoomsProps {
  state: AppState;
  actions: AppActions;
  setView: (view: ViewType) => void;
  timerActions?: TimerActions;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  status: 'focusing' | 'break' | 'ready';
  streak: number;
}

export interface ActiveRoom {
  id: string;
  code: string;
  title: string;
  hostName: string;
  durationMinutes: number;
  soundId: string;
  isPrivate: boolean;
  participants: RoomParticipant[];
  isActive: boolean;
  remainingSeconds: number;
}

const DEFAULT_ROOMS: ActiveRoom[] = [
  {
    id: 'room-1',
    code: 'DEEP25',
    title: 'Deep Work Sanctuary 💻',
    hostName: 'Aria Ranger',
    durationMinutes: 25,
    soundId: 'forest',
    isPrivate: false,
    isActive: true,
    remainingSeconds: 18 * 60,
    participants: [
      { id: 'u1', name: 'Aria Ranger', avatar: '🌲', status: 'focusing', streak: 12 },
      { id: 'u2', name: 'Marcus Fox', avatar: '🦊', status: 'focusing', streak: 5 },
      { id: 'u3', name: 'Elena Owl', avatar: '🦉', status: 'focusing', streak: 21 },
      { id: 'u4', name: 'Kai Ocean', avatar: '🌊', status: 'focusing', streak: 4 },
    ],
  },
  {
    id: 'room-2',
    code: 'LIB50',
    title: 'Silent Study Library 📚',
    hostName: 'Devon Sage',
    durationMinutes: 50,
    soundId: 'rain',
    isPrivate: false,
    isActive: true,
    remainingSeconds: 32 * 60,
    participants: [
      { id: 'u5', name: 'Devon Sage', avatar: '🧙‍♂️', status: 'focusing', streak: 30 },
      { id: 'u6', name: 'Sophia Pine', avatar: '🌲', status: 'focusing', streak: 15 },
      { id: 'u7', name: 'Liam Spark', avatar: '⚡', status: 'focusing', streak: 8 },
    ],
  },
  {
    id: 'room-3',
    code: 'NIGHT45',
    title: 'Night Owls Studio 🌙',
    hostName: 'Luna Wolf',
    durationMinutes: 45,
    soundId: 'thunder',
    isPrivate: false,
    isActive: false,
    remainingSeconds: 45 * 60,
    participants: [
      { id: 'u8', name: 'Luna Wolf', avatar: '🐺', status: 'ready', streak: 19 },
      { id: 'u9', name: 'Oliver Gem', avatar: '💎', status: 'ready', streak: 9 },
    ],
  },
];

export default function StudyRooms({ state, setView, timerActions }: StudyRoomsProps) {
  const [rooms, setRooms] = useState<ActiveRoom[]>(() => {
    const saved = localStorage.getItem('biome_study_rooms');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return DEFAULT_ROOMS;
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // New room form state
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(25);
  const [newSound, setNewSound] = useState('forest');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  // Persist rooms to localStorage
  useEffect(() => {
    localStorage.setItem('biome_study_rooms', JSON.stringify(rooms));
  }, [rooms]);

  // Active room instance
  const currentRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  // Handle countdown in active room
  useEffect(() => {
    if (!currentRoom || !currentRoom.isActive || currentRoom.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRooms(prev => prev.map(r => {
        if (r.id === currentRoom.id && r.isActive && r.remainingSeconds > 0) {
          return { ...r, remainingSeconds: r.remainingSeconds - 1 };
        }
        return r;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom]);

  // Join a room
  const handleJoin = (room: ActiveRoom) => {
    const myParticipant: RoomParticipant = {
      id: 'current-user',
      name: state.profile.name,
      avatar: state.profile.avatar,
      status: room.isActive ? 'focusing' : 'ready',
      streak: state.streak.current,
    };

    setRooms(prev => prev.map(r => {
      if (r.id === room.id) {
        const withoutMe = r.participants.filter(p => p.id !== 'current-user');
        return { ...r, participants: [...withoutMe, myParticipant] };
      }
      return r;
    }));

    setActiveRoomId(room.id);
  };

  // Leave active room
  const handleLeave = () => {
    if (!currentRoom) return;
    setRooms(prev => prev.map(r => {
      if (r.id === currentRoom.id) {
        return { ...r, participants: r.participants.filter(p => p.id !== 'current-user') };
      }
      return r;
    }));
    setActiveRoomId(null);
  };

  // Create new room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: ActiveRoom = {
      id: `room-${Date.now()}`,
      code: generatedCode,
      title: newTitle.trim(),
      hostName: state.profile.name,
      durationMinutes: newDuration,
      soundId: newSound,
      isPrivate: newIsPrivate,
      isActive: true,
      remainingSeconds: newDuration * 60,
      participants: [
        {
          id: 'current-user',
          name: state.profile.name,
          avatar: state.profile.avatar,
          status: 'focusing',
          streak: state.streak.current,
        },
      ],
    };

    setRooms(prev => [newRoom, ...prev]);
    setActiveRoomId(newRoom.id);
    setShowCreateModal(false);
    setNewTitle('');
  };

  // Join by code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    const targetRoom = rooms.find(r => r.code === code);
    if (targetRoom) {
      handleJoin(targetRoom);
      setJoinCodeInput('');
    } else {
      alert(`No active room found with code "${code}". Please check the code and try again.`);
    }
  };

  // Copy room invite code
  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Launch synchronized focus session in timer
  const handleFocusWithRoom = () => {
    if (!currentRoom || !timerActions) {
      setView('timer');
      return;
    }
    timerActions.setDuration(currentRoom.durationMinutes);
    timerActions.setSound(currentRoom.soundId);
    setView('timer');
    timerActions.start();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* ─── Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-forest-400 animate-pulse" />
            <h2 className="text-3xl font-display font-bold text-forest-100">Study Rooms</h2>
          </div>
          <p className="text-forest-500 mt-1">Live co-focusing spaces with shared timers and social accountability.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-forest-600 to-forest-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-forest-500 hover:to-forest-400 shadow-lg shadow-forest-900/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Create Room
          </button>
        </div>
      </header>

      {/* ─── Inside Active Room View ─── */}
      {currentRoom ? (
        <section className="glass-card p-6 border-forest-500/30 bg-gradient-to-b from-forest-950/40 via-surface to-surface space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-glass-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-500/20 text-forest-300">
                  Live Co-Working
                </span>
                <span className="text-xs text-forest-500">Host: {currentRoom.hostName}</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-forest-100 mt-1">{currentRoom.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyCode(currentRoom.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated border border-glass-border text-xs font-mono font-bold text-forest-300 hover:border-forest-500/40 transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-forest-400" />}
                <span>{currentRoom.code}</span>
              </button>

              <button
                onClick={handleLeave}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave
              </button>
            </div>
          </div>

          {/* Sync Timer Block */}
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-44 h-44 rounded-full border-4 border-forest-500/20 flex flex-col items-center justify-center relative shadow-inner">
              <div
                className="absolute inset-0 rounded-full border-4 border-forest-400"
                style={{
                  clipPath: `polygon(50% 50%, -50% -50%, ${Math.max(0, 100 - (currentRoom.remainingSeconds / (currentRoom.durationMinutes * 60)) * 100)}% 0)`
                }}
              />
              <span className="text-4xl font-mono font-bold text-forest-100">
                {String(Math.floor(currentRoom.remainingSeconds / 60)).padStart(2, '0')}:
                {String(currentRoom.remainingSeconds % 60).padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-forest-500 uppercase tracking-widest mt-1">
                {currentRoom.isActive ? 'Session Active' : 'Waiting for host'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleFocusWithRoom}
                className="px-6 py-3 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-xl font-bold flex items-center gap-2 hover:from-forest-500 hover:to-forest-400 shadow-xl shadow-forest-900/40 transition-all text-sm"
              >
                <Play className="w-4 h-4 fill-current" /> Focus With Room Timer
              </button>
            </div>
          </div>

          {/* Participant Avatars */}
          <div className="pt-4 border-t border-glass-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-400" />
                <h4 className="font-bold text-sm text-forest-200">
                  Focusing Together ({currentRoom.participants.length})
                </h4>
              </div>
              <span className="text-xs text-forest-500">Shared sound: {currentRoom.soundId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {currentRoom.participants.map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-elevated/40 border border-glass-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-900/30 border border-forest-500/20 flex items-center justify-center text-xl">
                    {p.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-forest-200 truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
                      <span className="text-[10px] text-forest-500 capitalize">{p.status}</span>
                      <span className="text-[10px] text-gold-400 ml-auto">{p.streak}d 🔥</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Join by Code Strip ─── */}
      <section className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-forest-300 text-sm font-medium">
          <Globe className="w-4 h-4 text-forest-400" />
          <span>Have a private room invite code?</span>
        </div>
        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={joinCodeInput}
            onChange={e => setJoinCodeInput(e.target.value)}
            placeholder="Enter 6-char code..."
            maxLength={8}
            className="bg-elevated border border-glass-border rounded-xl px-3 py-1.5 text-xs text-forest-200 font-mono uppercase tracking-wider outline-none focus:border-forest-500"
          />
          <button
            type="submit"
            disabled={!joinCodeInput.trim()}
            className="px-4 py-1.5 bg-forest-600/30 border border-forest-500/30 text-forest-200 rounded-xl text-xs font-bold hover:bg-forest-600/50 disabled:opacity-40 transition-colors"
          >
            Join
          </button>
        </form>
      </section>

      {/* ─── Public Rooms List ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-forest-200">Public Study Spaces</h3>
          <span className="text-xs text-forest-500">{rooms.length} active spaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <motion.div
              key={room.id}
              whileHover={{ y: -3 }}
              className="glass-card p-5 flex flex-col justify-between border hover:border-forest-500/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-forest-500 bg-elevated px-2 py-0.5 rounded border border-glass-border">
                    {room.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-forest-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{room.participants.length} online</span>
                  </div>
                </div>

                <h4 className="font-display font-bold text-base text-forest-100 group-hover:text-forest-300 transition-colors">
                  {room.title}
                </h4>
                <p className="text-xs text-forest-500 mt-1">Hosted by {room.hostName}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-forest-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {room.durationMinutes}m focus
                  </span>
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> {room.soundId}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-glass-border flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {room.participants.slice(0, 4).map(p => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full bg-elevated border border-glass-border flex items-center justify-center text-xs"
                      title={p.name}
                    >
                      {p.avatar}
                    </div>
                  ))}
                  {room.participants.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-forest-900 border border-forest-500/30 flex items-center justify-center text-[9px] font-bold text-forest-300">
                      +{room.participants.length - 4}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleJoin(room)}
                  className="px-4 py-1.5 bg-forest-500/15 border border-forest-500/30 text-forest-200 rounded-xl text-xs font-bold hover:bg-forest-500/25 transition-all"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Create Room Modal ─── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-md w-full p-6 border-forest-500/30 shadow-2xl relative"
            >
              <h3 className="font-display font-bold text-xl text-forest-100 mb-4">Create Study Room</h3>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-forest-400 uppercase tracking-wider block mb-1">Room Name</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Morning Focus Sprint ☕"
                    maxLength={35}
                    className="w-full bg-elevated border border-glass-border rounded-xl p-3 text-sm text-forest-200 outline-none focus:border-forest-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-400 uppercase tracking-wider block mb-1">Focus Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 25, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setNewDuration(mins)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          newDuration === mins
                            ? 'bg-forest-500/20 border-forest-400 text-forest-200'
                            : 'bg-elevated/40 border-glass-border text-forest-500'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-400 uppercase tracking-wider block mb-1">Ambient Atmosphere</label>
                  <select
                    value={newSound}
                    onChange={e => setNewSound(e.target.value)}
                    className="w-full bg-elevated border border-glass-border rounded-xl p-3 text-sm text-forest-200 outline-none focus:border-forest-500"
                  >
                    {AMBIENT_SOUNDS.map(s => (
                      <option key={s.id} value={s.id} className="bg-surface text-forest-100">
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-glass-border text-xs font-bold text-forest-500 hover:text-forest-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-xl text-xs font-bold hover:from-forest-500 hover:to-forest-400 shadow-lg shadow-forest-900/30"
                  >
                    Create & Enter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
