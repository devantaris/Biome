// ============================================
// Focus Forest — Custom Title Bar (Electron)
// ============================================
import React, { useState, useEffect } from 'react';
import { TreePine, Minus, Square, X, Maximize2 } from 'lucide-react';


export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized);
    const cleanup = window.electronAPI?.onMaximizedChange?.(setIsMaximized);
    return cleanup;
  }, []);

  return (
    <header className="titlebar-drag h-10 flex items-center justify-between bg-deep border-b border-glass-border px-4 flex-shrink-0 select-none z-50">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-forest-600 rounded-md flex items-center justify-center">
          <TreePine className="text-white w-3 h-3" />
        </div>
        <span className="text-xs font-bold text-forest-400 tracking-wider uppercase">Biome</span>
      </div>
      <div className="flex titlebar-no-drag">
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-10 h-10 flex items-center justify-center text-forest-400 hover:text-forest-200 hover:bg-white/5 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="w-10 h-10 flex items-center justify-center text-forest-400 hover:text-forest-200 hover:bg-white/5 transition-colors"
        >
          {isMaximized ? <Maximize2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="w-10 h-10 flex items-center justify-center text-forest-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
