// ============================================
// Focus Forest — Leaderboard
// ============================================
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, Crown, Medal, Flame, Target, Loader2, RotateCw, UserPlus, Copy, Check, Share2, Globe, Heart } from 'lucide-react';
import type { AppState, AppActions, LeaderboardEntry } from '../types';
import { getWeeklyChallenge } from '../lib/leaderboard';
import { fetchLeaderboard, LeaderboardRecord } from '../lib/firestore';
import { formatDuration } from '../lib/analytics';

interface LeaderboardProps {
  state: AppState;
  actions: AppActions;
  user?: { uid: string; displayName: string | null } | null;
}

export default function Leaderboard({ state, actions, user }: LeaderboardProps) {
  const [rawRecords, setRawRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'global' | 'friends'>('global');
  const [friendInput, setFriendInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [friendMsg, setFriendMsg] = useState<string | null>(null);

  const myFriendCode = state.profile.friendCode || 'BIO-' + (user?.uid ? user.uid.substring(0, 5).toUpperCase() : '7A9K2');
  const weeklyChallenge = useMemo(() => getWeeklyChallenge(), []);

  const weekAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);
  const playerWeeklyMinutes = useMemo(() => {
    return state.sessions
      .filter(s => s.startTime >= weekAgo && s.completed)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [state.sessions, weekAgo]);

  const challengeProgress = Math.min((playerWeeklyMinutes / weeklyChallenge.targetMinutes) * 100, 100);

  const loadLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      const topUsers = await fetchLeaderboard(50);
      setRawRecords(topUsers);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only on mount
  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // Compute merged leaderboard with current player state dynamically
  const leaderboard = useMemo(() => {
    let entries: LeaderboardEntry[] = rawRecords.map(u => ({
      rank: 0,
      name: u.name || 'Anonymous',
      avatar: u.avatar || '👤',
      weeklyMinutes: u.weeklyMinutes,
      streak: u.streak,
      level: u.level,
      isPlayer: u.uid === user?.uid,
    }));

    if (user && !entries.some(e => e.isPlayer)) {
      entries.push({
        rank: 0,
        name: state.profile.name,
        avatar: state.profile.avatar,
        weeklyMinutes: playerWeeklyMinutes,
        streak: state.streak.current,
        level: state.level,
        isPlayer: true,
      });
    } else if (user) {
      const userEntry = entries.find(e => e.isPlayer);
      if (userEntry) {
        userEntry.weeklyMinutes = Math.max(userEntry.weeklyMinutes, playerWeeklyMinutes);
        userEntry.name = state.profile.name;
        userEntry.avatar = state.profile.avatar;
        userEntry.streak = state.streak.current;
        userEntry.level = state.level;
      }
    }

    entries.sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }, [rawRecords, user, state.profile.name, state.profile.avatar, state.streak.current, state.level, playerWeeklyMinutes]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;
    const added = actions.addFriend(friendInput.trim());
    if (added) {
      setFriendMsg(`Added friend ${friendInput.trim().toUpperCase()}! 🌿`);
      setFriendInput('');
    } else {
      setFriendMsg(`Friend code already added or invalid.`);
    }
    setTimeout(() => setFriendMsg(null), 3500);
  };

  const friendsList = state.friends || [];
  const displayLeaderboard = useMemo(() => {
    if (tab === 'global') return leaderboard;
    return leaderboard.filter(e => e.isPlayer || friendsList.includes(e.name.toUpperCase()));
  }, [tab, leaderboard, friendsList]);

  const playerRank = leaderboard.find(e => e.isPlayer)?.rank ?? leaderboard.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100">Leaderboard</h2>
        <p className="text-forest-500">Compete with focus warriors from around the world</p>
      </header>

      {/* Your Rank Card */}
      <div className="glass-card p-4 sm:p-5 bg-gradient-to-r from-forest-600/10 to-forest-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-forest-500/20 border border-forest-500/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              {state.profile.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-forest-500 uppercase">Your Ranking</p>
              <p className="text-xl sm:text-2xl font-display font-bold text-forest-100 truncate">
                #{playerRank} <span className="text-xs sm:text-sm text-forest-400 font-normal">of {leaderboard.length}</span>
              </p>
            </div>
          </div>
          <div className="sm:ml-auto w-full sm:w-auto bg-elevated/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none sm:text-right">
            <p className="text-[10px] sm:text-xs font-bold text-forest-500 uppercase">This Week</p>
            <p className="text-lg sm:text-xl font-display font-bold text-forest-200">{formatDuration(playerWeeklyMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Friend Code & Invite System */}
      <div className="glass-card p-4 sm:p-5 border border-forest-500/20 bg-forest-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-forest-400 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-forest-400" /> Your Personal Friend Code
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono font-bold text-lg sm:text-xl text-forest-100 tracking-wider bg-elevated/80 px-3 py-1 rounded-xl border border-glass-border">
                {myFriendCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-forest-600/30 hover:bg-forest-600/50 text-forest-200 border border-forest-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Add Friend Input */}
          <form onSubmit={handleAddFriend} className="flex items-center gap-2">
            <input
              type="text"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value.toUpperCase())}
              placeholder="Enter Friend Code..."
              className="bg-elevated border border-glass-border rounded-xl px-3 py-2 text-xs font-mono text-forest-200 placeholder-forest-600 focus:ring-1 focus:ring-forest-500 outline-none w-44"
            />
            <button
              type="submit"
              disabled={!friendInput.trim()}
              className="px-3 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {friendMsg && (
          <p className="text-xs font-bold text-forest-300">{friendMsg}</p>
        )}
      </div>

      {/* Weekly Challenge */}
      <div className="glass-card p-5 border-gold-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-lg">
            {weeklyChallenge.icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gold-400 uppercase">Weekly Challenge</p>
            <p className="font-bold text-forest-200">{weeklyChallenge.title}</p>
          </div>
          <span className="text-xs font-bold text-forest-500">{weeklyChallenge.reward}</span>
        </div>
        <p className="text-xs text-forest-500 mb-3">{weeklyChallenge.description}</p>
        <div className="h-2 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${challengeProgress >= 100 ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-forest-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${challengeProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-forest-600 mt-1.5">
          <span>{formatDuration(playerWeeklyMinutes)}</span>
          <span>{formatDuration(weeklyChallenge.targetMinutes)}</span>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-elevated/60 rounded-xl border border-glass-border self-start">
            <button
              type="button"
              onClick={() => setTab('global')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'global'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-forest-400 hover:text-forest-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Global ({leaderboard.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('friends')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'friends'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-forest-400 hover:text-forest-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Friends Only ({friendsList.length})
            </button>
          </div>

          <button
            onClick={loadLeaderboardData}
            disabled={loading}
            className="text-forest-500 hover:text-forest-300 transition-colors p-1.5 rounded-lg hover:bg-elevated flex items-center gap-1.5 text-xs font-bold self-end sm:self-auto"
            title="Refresh leaderboard"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="divide-y divide-glass-border">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
            </div>
          ) : displayLeaderboard.length === 0 || (tab === 'friends' && friendsList.length === 0) ? (
            <div className="p-8 text-center text-forest-400 text-sm space-y-2">
              <p className="font-bold text-forest-200">
                {tab === 'friends' ? 'No friends added yet 🌱' : 'No data yet. Be the first to focus!'}
              </p>
              {tab === 'friends' && (
                <p className="text-xs text-forest-500 max-w-sm mx-auto">
                  Copy your friend code above and share it with your study buddies, or enter their friend code to compete together on your private leaderboard!
                </p>
              )}
            </div>
          ) : (
            displayLeaderboard.map((entry, i) => (
              <motion.div
                key={entry.name + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  entry.isPlayer ? 'bg-forest-600/10 border-l-2 border-forest-400' : 'hover:bg-elevated/30'
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex-shrink-0 text-center">
                  {entry.rank === 1 ? (
                    <Crown className="w-5 h-5 text-gold-400 mx-auto" />
                  ) : entry.rank === 2 ? (
                    <Medal className="w-5 h-5 text-gray-300 mx-auto" />
                  ) : entry.rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-600 mx-auto" />
                  ) : (
                    <span className="text-sm font-bold text-forest-500">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{entry.avatar}</span>
                  <div>
                    <p className={`font-bold text-sm ${entry.isPlayer ? 'text-forest-200' : 'text-forest-300'}`}>
                      {entry.name}
                      {entry.isPlayer && <span className="text-[9px] ml-2 text-forest-400 font-normal">(You)</span>}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-forest-600">
                      <span>Lv.{entry.level}</span>
                      {entry.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-400/60">
                          <Flame className="w-2.5 h-2.5" />{entry.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weekly Minutes */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-forest-200">{formatDuration(entry.weeklyMinutes)}</p>
                  <p className="text-[10px] text-forest-600">this week</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-forest-700 text-center italic">
        {user
          ? 'Live rankings from all Biome users worldwide.'
          : 'Sign in to see your real global rank among all users.'}
      </p>
    </motion.div>
  );
}
