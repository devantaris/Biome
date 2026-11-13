// ============================================
// Biome — In-App Feedback & Pro Waitlist Modal
// ============================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Sparkles, Send, CheckCircle2, Bug, Lightbulb, Heart } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from 'firebase/auth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  initialTab?: 'feedback' | 'waitlist';
}

export default function FeedbackModal({ isOpen, onClose, user, initialTab = 'feedback' }: FeedbackModalProps) {
  const [tab, setTab] = useState<'feedback' | 'waitlist'>(initialTab);
  
  // Feedback state
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug' | 'praise'>('feature');
  const [message, setMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState(user?.email || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    const payload = {
      type: feedbackType,
      message: message.trim(),
      email: feedbackEmail.trim() || user?.email || 'anonymous',
      userId: user?.uid || 'guest',
      createdAt: Date.now(),
      platform: navigator.userAgent,
    };

    try {
      if (db) {
        await addDoc(collection(db, 'feedback'), payload);
      }
    } catch {
      // Fallback local storage
      const existing = JSON.parse(localStorage.getItem('biome_feedback') || '[]');
      existing.push(payload);
      localStorage.setItem('biome_feedback', JSON.stringify(existing));
    } finally {
      setIsSubmitting(false);
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setMessage('');
        setFeedbackSubmitted(false);
        onClose();
      }, 2200);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) return;

    setWaitlistSubmitting(true);
    const payload = {
      email: waitlistEmail.trim(),
      userId: user?.uid || 'guest',
      joinedAt: Date.now(),
      tierInterest: 'pro_early_access',
    };

    try {
      if (db) {
        await addDoc(collection(db, 'waitlist'), payload);
      }
    } catch {
      const existing = JSON.parse(localStorage.getItem('biome_waitlist') || '[]');
      existing.push(payload);
      localStorage.setItem('biome_waitlist', JSON.stringify(existing));
    } finally {
      setWaitlistSubmitting(false);
      setWaitlistSubmitted(true);
      setTimeout(() => {
        setWaitlistSubmitted(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="glass-card w-full max-w-lg p-6 bg-deep/95 border border-forest-500/30 rounded-2xl shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-forest-500 hover:text-forest-200 transition-colors p-1 rounded-lg hover:bg-forest-800/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-elevated/60 rounded-xl mb-6 max-w-xs border border-glass-border">
          <button
            type="button"
            onClick={() => setTab('feedback')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'feedback'
                ? 'bg-forest-600 text-white shadow-md'
                : 'text-forest-400 hover:text-forest-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Feedback
          </button>
          <button
            type="button"
            onClick={() => setTab('waitlist')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'waitlist'
                ? 'bg-forest-600 text-white shadow-md'
                : 'text-forest-400 hover:text-forest-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Pro Waitlist
          </button>
        </div>

        {tab === 'feedback' ? (
          <div>
            <h3 className="text-xl font-display font-bold text-forest-100 mb-1">Send Us Your Thoughts</h3>
            <p className="text-xs text-forest-400 mb-4">
              Found a bug or have an idea to make Biome even better? We read every submission.
            </p>

            {feedbackSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-forest-500/20 flex items-center justify-center text-forest-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-forest-100">Thank you! 🌿</h4>
                <p className="text-xs text-forest-400 max-w-xs">
                  Your feedback has been received and directly shapes our upcoming updates.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Feedback Type Pill Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'feature'
                        ? 'bg-forest-500/20 border-forest-400 text-forest-200'
                        : 'bg-elevated border-glass-border text-forest-500 hover:text-forest-300'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'bug'
                        ? 'bg-red-500/20 border-red-400 text-red-200'
                        : 'bg-elevated border-glass-border text-forest-500 hover:text-forest-300'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5 text-red-400" /> Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('praise')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'praise'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                        : 'bg-elevated border-glass-border text-forest-500 hover:text-forest-300'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-pink-400" /> Love
                  </button>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Tell us what's on your mind..."
                    className="w-full bg-elevated border border-glass-border rounded-xl p-3 text-xs text-forest-200 placeholder-forest-600 focus:ring-1 focus:ring-forest-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-forest-500 uppercase block mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-elevated border border-glass-border rounded-xl px-3 py-2 text-xs text-forest-200 placeholder-forest-600 focus:ring-1 focus:ring-forest-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full py-3 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-forest-900/40 hover:from-forest-500 hover:to-forest-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-display font-bold text-forest-100 mb-1">Join the Pro Waitlist</h3>
            <p className="text-xs text-forest-400 mb-4">
              All core features in Biome remain 100% free forever. Join the early-access list to be first in line when our advanced team analytics and premium biomes launch.
            </p>

            {waitlistSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-gold-300">You're on the list! 🎉</h4>
                <p className="text-xs text-forest-400 max-w-xs">
                  We'll notify you the moment early access invites are released. Enjoy all current free features!
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div className="p-3 rounded-xl bg-forest-950/40 border border-forest-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-forest-300">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" /> What's coming in Pro:
                  </div>
                  <ul className="text-[11px] text-forest-400 list-disc list-inside space-y-0.5">
                    <li>Custom community biome creation engine</li>
                    <li>Advanced time-allocation personal analytics</li>
                    <li>Exclusive legendary animated world monuments</li>
                  </ul>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-forest-500 uppercase block mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-elevated border border-glass-border rounded-xl px-3 py-2 text-xs text-forest-200 placeholder-forest-600 focus:ring-1 focus:ring-forest-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={waitlistSubmitting || !waitlistEmail.includes('@')}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-900/40 hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  {waitlistSubmitting ? 'Joining...' : 'Get Early Access'}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
