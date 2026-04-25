import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Save, User as UserIcon } from 'lucide-react';
import type { AppState, AppActions } from '../types';

const AVATARS = ['🌲', '🌳', '🌴', '🌵', '🌸', '🍀', '🦊', '🐺', '🦉', '🐝', '🦋', '🌙', '⭐', '🔥', '💎', '🎯', '🧠', '⚡', '🏔️', '🌊'];

interface ProfileViewProps {
  state: AppState;
  actions: AppActions;
}

export default function ProfileView({ state, actions }: ProfileViewProps) {
  const [name, setName] = useState(state.profile.name);
  const [avatar, setAvatar] = useState(state.profile.avatar);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    actions.updateProfile({ 
      name: name.trim() || 'Forest Ranger', 
      avatar 
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100 flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-forest-400" />
          My Profile
        </h2>
        <p className="text-forest-500 mt-1">Manage your identity in the focus forest.</p>
      </header>

      <div className="glass-card p-8 bg-gradient-to-br from-forest-600/5 to-transparent">
        {/* Avatar Selection */}
        <div className="mb-10 text-center">
          <h3 className="font-bold text-forest-200 mb-4 uppercase tracking-widest text-xs">Choose Your Avatar</h3>
          <motion.div
            key={avatar}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 rounded-2xl bg-forest-500/15 border-2 border-forest-400/30 flex items-center justify-center text-5xl mx-auto mb-6"
          >
            {avatar}
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                  avatar === a
                    ? 'bg-forest-500/20 border-2 border-forest-400 scale-110'
                    : 'bg-elevated border-2 border-transparent hover:border-glass-border-light hover:scale-105'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-10 text-center">
          <h3 className="font-bold text-forest-200 mb-4 uppercase tracking-widest text-xs">Your Name</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full max-w-md bg-elevated border-2 border-glass-border rounded-2xl p-4 text-center text-xl font-bold text-forest-100 placeholder:text-forest-600 outline-none focus:border-forest-500 transition-colors"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSave}
            className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center gap-3 group ${
              saved 
                ? 'bg-forest-500 text-white shadow-forest-500/25' 
                : 'bg-gradient-to-r from-forest-600 to-forest-500 text-white shadow-forest-500/25 hover:from-forest-500 hover:to-forest-400 hover:shadow-forest-400/30'
            }`}
          >
            {saved ? (
              <>
                <Sparkles className="w-5 h-5" />
                Profile Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
