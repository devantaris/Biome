import React from 'react';
import { BarChart3, Timer, LayoutGrid, ListTodo, Trophy, Settings as SettingsIcon } from 'lucide-react';
import type { ViewType } from '../types';

interface MobileNavBarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
}

export default function MobileNavBar({ view, setView }: MobileNavBarProps) {
  const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dash', icon: <BarChart3 /> },
    { id: 'timer', label: 'Focus', icon: <Timer /> },
    { id: 'forest', label: 'Forest', icon: <LayoutGrid /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo /> },
    { id: 'achievements', label: 'Awards', icon: <Trophy /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-deep/90 backdrop-blur-xl border-t border-glass-border flex items-center justify-around px-2 z-40 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive ? 'text-forest-400' : 'text-forest-600 hover:text-forest-500'
            }`}
          >
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 mb-1' : 'scale-100 mb-0.5'}`}>
              {React.cloneElement(item.icon as React.ReactElement, {
                className: `w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`
              })}
            </div>
            <span className={`text-[10px] font-bold tracking-wider transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
