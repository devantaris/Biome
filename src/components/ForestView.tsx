// ============================================
// Focus Forest — Immersive Forest World v3
// Inventory tray + Manual placement + Territory expansion
// ============================================
import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Maximize2, Info, ZoomIn, ZoomOut, RotateCcw, Move, RotateCcw as ReturnIcon, Trash2, Share2, Check, Copy, ChevronDown } from 'lucide-react';
import type { AppState, AppActions, ForestItem, InventoryItem } from '../types';
import { RARITY_COLORS, RARITY_BG, BIOME_THEMES } from '../constants';

interface ForestViewProps {
  state: AppState;
  actions: AppActions;
}

type PlacementModeItem = InventoryItem | null;

export default function ForestView({ state, actions }: ForestViewProps) {
  const [placingItem, setPlacingItem] = useState<PlacementModeItem>(null);
  const [movingItem, setMovingItem] = useState<ForestItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ForestItem | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [expansionFlash, setExpansionFlash] = useState(false);
  const [showInventoryHelp, setShowInventoryHelp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const currentThemeId = state.settings.biomeTheme || 'forest';
  const currentTheme = useMemo(() =>
    BIOME_THEMES.find(t => t.id === currentThemeId) || BIOME_THEMES[0],
    [currentThemeId]
  );

  const gridSize = state.gridSize ?? 10;
  const totalTiles = gridSize * gridSize;
  const livingItems = state.forest.filter(f => f.type !== 'dead');
  const deadCount = state.forest.filter(f => f.type === 'dead').length;
  const healthPercent = state.forest.length > 0
    ? Math.round((livingItems.length / state.forest.length) * 100)
    : 100;
  const fillPercent = Math.min(Math.round((livingItems.length / totalTiles) * 100), 100);

  // Build grid lookup map: "x,y" → ForestItem
  const gridMap = useMemo(() => {
    const map = new Map<string, ForestItem>();

    const tryPlace = (item: ForestItem, targetX: number, targetY: number) => {
      if (targetX < 0 || targetY < 0 || targetX >= gridSize || targetY >= gridSize) return false;
      if (item.size === 2) {
        if (targetX + 1 >= gridSize || targetY + 1 >= gridSize) return false;
        if (map.has(`${targetX},${targetY}`) || map.has(`${targetX+1},${targetY}`) ||
            map.has(`${targetX},${targetY+1}`) || map.has(`${targetX+1},${targetY+1}`)) return false;
        map.set(`${targetX},${targetY}`, item);
        map.set(`${targetX+1},${targetY}`, item);
        map.set(`${targetX},${targetY+1}`, item);
        map.set(`${targetX+1},${targetY+1}`, item);
        return true;
      } else {
        if (map.has(`${targetX},${targetY}`)) return false;
        map.set(`${targetX},${targetY}`, item);
        return true;
      }
    };

    state.forest.forEach(item => {
      if (movingItem?.id === item.id) return; // skip item currently being moved

      if (tryPlace(item, item.x, item.y)) return;

      // collision — find nearest open spot
      for (let r = 1; r < gridSize; r++) {
        let found = false;
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            const nx = ((item.x + dx) % gridSize + gridSize) % gridSize;
            const ny = ((item.y + dy) % gridSize + gridSize) % gridSize;
            if (tryPlace(item, nx, ny)) {
              found = true;
            }
          }
        }
        if (found) break;
      }
    });
    return map;
  }, [state.forest, gridSize, movingItem]);

  // ─── Placement actions ─────────────────────
  const selectForPlacement = useCallback((item: InventoryItem) => {
    setMovingItem(null);
    setSelectedItem(null);
    setPlacingItem(item);
  }, []);

  const cancelPlacement = useCallback(() => {
    setPlacingItem(null);
    setMovingItem(null);
  }, []);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!placingItem && !movingItem) {
      const clickedItem = gridMap.get(`${x},${y}`);
      if (clickedItem) {
        setSelectedItem(clickedItem);
      }
      return;
    }

    const activeItem = placingItem || movingItem;
    if (!activeItem) return;

    if (activeItem.size === 2) {
      if (x + 1 >= gridSize || y + 1 >= gridSize) return;
      if (gridMap.has(`${x},${y}`) || gridMap.has(`${x+1},${y}`) ||
          gridMap.has(`${x},${y+1}`) || gridMap.has(`${x+1},${y+1}`)) return;
    } else {
      if (gridMap.has(`${x},${y}`)) return;
    }

    if (placingItem) {
      // Check if this placement will trigger expansion
      const livingCount = livingItems.length + 1; // after this placement
      const willExpand = livingCount >= totalTiles && placingItem.type !== 'dead';

      actions.placeInventoryItem(placingItem.id, x, y);
      setPlacingItem(null);

      if (willExpand) {
        setExpansionFlash(true);
        setTimeout(() => setExpansionFlash(false), 3000);
      }
    } else if (movingItem) {
      actions.moveForestItem(movingItem.id, x, y);
      setMovingItem(null);
    }
  }, [placingItem, movingItem, gridMap, livingItems.length, totalTiles, gridSize, actions]);

  const rarityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    livingItems.forEach(f => { counts[f.rarity] = (counts[f.rarity] || 0) + 1; });
    return counts;
  }, [livingItems]);

  const shareSummaryText = useMemo(() => {
    return (
      `🌲 My Biome Forest World 🌍\n` +
      `• Territory: ${state.gridSize}×${state.gridSize} (${livingItems.length}/${totalTiles} tiles planted)\n` +
      `• Forest Health: ${healthPercent}%\n` +
      `• Expansions: ${state.expansionCount}×\n` +
      `• Streak: ${state.streak.current} days 🔥\n` +
      `• Total Focus: ${Math.round(state.totalFocusMinutes / 60)}h completed\n\n` +
      `Grow your forest with Biome: https://biome-focus.web.app`
    );
  }, [state.gridSize, livingItems.length, totalTiles, healthPercent, state.expansionCount, state.streak.current, state.totalFocusMinutes]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${state.profile.name}'s Biome Forest`,
          text: shareSummaryText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareSummaryText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  }, [state.profile.name, shareSummaryText]);

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col gap-4 min-h-0 min-w-0"
      >
      {/* ─── Header ─── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold text-forest-100">My Forest World</h2>
          <p className="text-forest-500 mt-1 sm:mt-0">
            {livingItems.length}/{totalTiles} tiles filled
            {state.expansionCount > 0 && ` · Expanded ${state.expansionCount}×`}
            {' · '}{healthPercent}% healthy
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-elevated/80 border border-glass-border-light rounded-xl p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
              disabled={zoom <= 0.6}
              className="p-1.5 hover:bg-forest-500/20 text-forest-300 disabled:opacity-30 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-forest-300 px-1 select-none min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.0, Math.round((z + 0.2) * 10) / 10))}
              disabled={zoom >= 2.0}
              className="p-1.5 hover:bg-forest-500/20 text-forest-300 disabled:opacity-30 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1.0 && (
              <button
                onClick={() => setZoom(1.0)}
                className="p-1.5 hover:bg-forest-500/20 text-forest-400 rounded-lg transition-colors"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-[1px] h-4 bg-glass-border mx-1" />
            <button
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1 text-xs font-bold text-forest-300 hover:text-forest-100 hover:bg-forest-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              title="Share Biome World"
            >
              <Share2 className="w-3.5 h-3.5 text-forest-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <div className="w-[1px] h-4 bg-glass-border mx-1" />
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(v => !v)}
                className="px-2.5 py-1 text-xs font-bold text-forest-300 hover:text-forest-100 hover:bg-forest-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                title="Change Biome Theme"
              >
                <span>{currentTheme.icon}</span>
                <span className="hidden md:inline">{currentTheme.name}</span>
                <ChevronDown className={`w-3 h-3 text-forest-500 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 top-full mt-2 w-56 glass-card p-2 shadow-2xl border border-glass-border-light z-50 space-y-1"
                  >
                    <p className="text-[10px] font-bold text-forest-500 uppercase px-2 py-1 tracking-wider">Biome Theme</p>
                    {BIOME_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          actions.updateSettings({ biomeTheme: theme.id });
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                          currentTheme.id === theme.id
                            ? 'bg-forest-500/20 text-forest-100 border border-forest-500/30'
                            : 'text-forest-400 hover:text-forest-200 hover:bg-elevated'
                        }`}
                      >
                        <span className="text-lg">{theme.icon}</span>
                        <div>
                          <p className="font-bold leading-tight">{theme.name}</p>
                          <p className="text-[10px] text-forest-500 line-clamp-1">{theme.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {(placingItem || movingItem) && (
            <button
              onClick={cancelPlacement}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs sm:text-sm hover:bg-red-500/20 transition-all"
            >
              <X className="w-4 h-4" /> Cancel {placingItem ? 'Placement' : 'Move'}
            </button>
          )}
        </div>
      </header>

      {/* ─── Territory fill bar ─── */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-forest-400" />
            <span className="text-xs font-bold text-forest-400">Territory Fill</span>
            <span className="text-[10px] text-forest-600">Fill all tiles to expand the world!</span>
          </div>
          <span className="text-xs font-bold text-forest-200">
            {livingItems.length} / {totalTiles} ({fillPercent}%)
          </span>
        </div>
        <div className="h-2.5 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${fillPercent >= 100 ? 'bg-gradient-to-r from-gold-500 to-gold-400 animate-pulse-glow' : 'bg-gradient-to-r from-forest-600 to-forest-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ─── Territory Expanded Flash ─── */}
      <AnimatePresence>
        {expansionFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="glass-card p-5 text-center border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent flex-shrink-0"
          >
            <p className="text-2xl font-display font-bold text-gold-400">🌍 World Expanded!</p>
            <p className="text-forest-400 text-sm mt-1">
              Your territory grew to {state.gridSize}×{state.gridSize} — {state.gridSize * state.gridSize} tiles!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Placement/Move mode indicator ─── */}
      <AnimatePresence>
        {(placingItem || movingItem) && (() => {
          const activeItem = placingItem || movingItem;
          if (!activeItem) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`glass-card p-3 flex items-center gap-3 border flex-shrink-0 ${placingItem ? 'border-forest-500/30 bg-forest-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}
            >
              <span className="text-3xl">{activeItem.icon}</span>
              <div>
                <p className={`font-bold text-sm ${placingItem ? 'text-forest-200' : 'text-blue-200'}`}>
                  {placingItem ? 'Placement Mode' : 'Move Mode'} — Click anywhere to drop
                </p>
                <p className={`text-xs ${placingItem ? 'text-forest-500' : 'text-blue-500'}`}>
                  {activeItem.name} · <span className={RARITY_COLORS[activeItem.rarity]}>{activeItem.rarity}</span>
                </p>
              </div>
              <div className={`ml-auto flex items-center gap-1 text-xs animate-pulse ${placingItem ? 'text-forest-500' : 'text-blue-500'}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${placingItem ? 'bg-forest-400' : 'bg-blue-400'}`}></span> Select a tile
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── Forest World Grid ─── */}
      <div className={`glass-card relative flex-1 min-h-[300px] flex flex-col min-h-0 min-w-0 bg-gradient-to-b ${currentTheme.gridBg}`}>
        {state.forest.length === 0 && state.inventory.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-4"
              >🌍</motion.div>
              <h3 className="font-display font-bold text-forest-200 text-xl mb-2">Your World Awaits</h3>
              <p className="text-forest-500 text-sm max-w-xs mx-auto">
                Complete focus sessions to earn items, then plant them wherever you like!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar p-2 md:p-4">
            <div
              className="min-w-[600px] md:min-w-[700px] max-w-5xl mx-auto pb-4 transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoom})` }}
            >
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  aspectRatio: `${gridSize} / ${Math.ceil(gridSize / 2)}`,
                }}
              >
              {Array.from({ length: totalTiles }).map((_, idx) => {
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                const key = `${x},${y}`;
                const item = gridMap.get(key);
                const isEmpty = !item;
                const activeItem = placingItem || movingItem;
                const isPlaceable = !!activeItem && isEmpty;
                
                let isHoveredArea = false;
                if (activeItem && hoveredTile) {
                  if (activeItem.size === 2) {
                    isHoveredArea = x >= hoveredTile.x && x <= hoveredTile.x + 1 && 
                                    y >= hoveredTile.y && y <= hoveredTile.y + 1;
                  } else {
                    isHoveredArea = hoveredTile.x === x && hoveredTile.y === y;
                  }
                }

                let cellBg = '';
                if (isPlaceable && isHoveredArea) cellBg = placingItem ? 'bg-forest-500/25' : 'bg-blue-500/25';
                else if (isPlaceable) cellBg = placingItem ? 'bg-forest-500/10' : 'bg-blue-500/10';
                else cellBg = currentTheme.cellEmptyBg;

                // Only render the item icon once if it's 2x2 (on its top-left cell)
                const isItemRoot = item && item.x === x && item.y === y;

                return (
                  <div
                    key={idx}
                    onClick={() => isPlaceable ? handleTileClick(x, y) : handleTileClick(x, y)}
                    onMouseEnter={() => (isPlaceable || item) && setHoveredTile({ x, y })}
                    onMouseLeave={() => setHoveredTile(null)}
                    className={`
                      aspect-square flex items-center justify-center relative group
                      border ${currentTheme.cellBorder} transition-all rounded-md m-[1px]
                      ${cellBg}
                      ${isPlaceable ? 'cursor-pointer' : item && item.type !== 'dead' && !activeItem ? 'cursor-grab hover:bg-forest-700/30' : 'cursor-default'}
                      ${isPlaceable && isHoveredArea ? 'z-10 shadow-lg shadow-forest-500/20' : ''}
                    `}
                  >
                    {/* Placement mode pulse effect on empty tiles */}
                    {isPlaceable && (
                      <div className={`absolute inset-0 border rounded-md animate-pulse pointer-events-none ${placingItem ? 'border-forest-400/30' : 'border-blue-400/30'}`} />
                    )}

                    {/* Forest item (rendered only on root cell) */}
                    {isItemRoot && (
                      <>
                        <motion.span
                          initial={{ scale: 0, rotate: -15 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', damping: 12 }}
                          className={`cursor-default select-none z-20 ${
                            item.type === 'dead' ? 'grayscale-[0.4] opacity-60 text-lg md:text-xl lg:text-2xl' : 'drop-shadow-sm'
                          } ${item.size === 2 ? 'absolute w-[200%] h-[200%] flex items-center justify-center text-5xl md:text-6xl top-0 left-0 pointer-events-none' : 'text-lg md:text-xl lg:text-2xl pointer-events-none'}`}
                        >
                          {item.icon}
                        </motion.span>

                        {/* Rarity ambient glow */}
                        {item.rarity === 'legendary' && (
                          <div className={`absolute ${item.size === 2 ? 'w-[200%] h-[200%] top-0 left-0' : 'inset-0'} bg-gold-400/5 rounded animate-pulse-glow pointer-events-none`} />
                        )}
                        {item.rarity === 'epic' && (
                          <div className={`absolute ${item.size === 2 ? 'w-[200%] h-[200%] top-0 left-0' : 'inset-0'} bg-purple-400/4 rounded pointer-events-none`} />
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-base/95 backdrop-blur text-forest-200 text-[9px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-glass-border-light transition-all">
                          <p className="font-bold text-[10px]">{item.name}</p>
                          <p className={`${RARITY_COLORS[item.rarity]} uppercase font-bold tracking-wider`}>{item.rarity}</p>
                          <p className="text-forest-600">{new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}

                    {/* Hover ghost preview during placement */}
                    {isPlaceable && isHoveredArea && activeItem && hoveredTile?.x === x && hoveredTile?.y === y && (
                      <span className={`opacity-70 animate-pulse pointer-events-none z-30 ${activeItem.size === 2 ? 'absolute w-[200%] h-[200%] flex items-center justify-center text-5xl md:text-6xl top-0 left-0' : 'text-xl'}`}>
                        {activeItem.icon}
                      </span>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Inventory Tray ─── */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-forest-400" />
            <h3 className="font-bold text-forest-200 text-sm">
              Inventory
              {state.inventory.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-forest-500/20 text-forest-300 rounded-md text-[10px] font-bold">
                  {state.inventory.length}
                </span>
              )}
            </h3>
            <button onClick={() => setShowInventoryHelp(v => !v)}>
              <Info className="w-3.5 h-3.5 text-forest-600 hover:text-forest-400 transition-colors" />
            </button>
          </div>
          {placingItem && (
            <span className="text-[10px] text-forest-400 animate-pulse font-bold">
              Click a tile above ↑
            </span>
          )}
        </div>

        {showInventoryHelp && (
          <p className="text-[11px] text-forest-500 mb-3 leading-relaxed">
            These are items you've earned from completed focus sessions. Click one to enter placement mode, then click any empty tile in the world to plant it permanently.
          </p>
        )}

        {state.inventory.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-forest-600 text-sm">
            <span className="text-2xl">📦</span>
            <span className="italic">Your inventory is empty. Complete a focus session to earn items!</span>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {state.inventory.map(item => (
              <motion.button
                key={item.id}
                onClick={() => placingItem?.id === item.id ? cancelPlacement() : selectForPlacement(item)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all group relative ${
                  placingItem?.id === item.id
                    ? 'bg-forest-500/20 border-forest-400 shadow-lg shadow-forest-500/15'
                    : `${RARITY_BG[item.rarity]} hover:border-forest-500/40`
                }`}
                title={`${item.name} — click to place in your forest`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${RARITY_COLORS[item.rarity]}`}>
                  {item.rarity}
                </span>
                <span className="text-[9px] text-forest-500 max-w-[52px] truncate">{item.name}</span>

                {/* "Selected" indicator */}
                {placingItem?.id === item.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-forest-400 rounded-full border border-base" />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ─── World Stats ─── */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 flex-shrink-0">
        <WorldStat label="Planted" value={livingItems.length} icon="🌿" />
        <WorldStat label="Pending" value={state.inventory.length} icon="📦" color="text-gold-400" />
        <WorldStat label="Withered" value={deadCount} icon="🥀" color="text-red-400" />
        <WorldStat label="Expansions" value={state.expansionCount} icon="🌍" color="text-blue-400" />
        <WorldStat label="Common" value={rarityBreakdown.common} icon="⚪" />
        <WorldStat label="Rare" value={rarityBreakdown.rare} icon="🔵" color="text-blue-400" />
        <WorldStat label="Epic+" value={(rarityBreakdown.epic || 0) + (rarityBreakdown.legendary || 0)} icon="🟣" color="text-purple-400" />
      </div>

      {/* ─── Selected Item Action Modal ─── */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card max-w-sm w-full p-6 border-forest-500/30 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-forest-500 hover:text-forest-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-forest-900/40 border border-forest-500/20 flex items-center justify-center text-4xl mb-3 shadow-inner">
                  {selectedItem.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-forest-100">{selectedItem.name}</h3>
                <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${RARITY_COLORS[selectedItem.rarity]}`}>
                  {selectedItem.rarity} {selectedItem.type === 'dead' ? '• Withered' : '• Planted'}
                </p>
                <p className="text-forest-500 text-xs mt-1">
                  Placed at ({selectedItem.x + 1}, {selectedItem.y + 1}) · {new Date(selectedItem.timestamp).toLocaleDateString()}
                </p>

                <div className="w-full flex flex-col gap-2 mt-5">
                  {selectedItem.type !== 'dead' && (
                    <button
                      onClick={() => {
                        setMovingItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-sm hover:bg-blue-500/25 transition-all"
                    >
                      <Move className="w-4 h-4" /> Move to New Tile
                    </button>
                  )}

                  <button
                    onClick={() => {
                      actions.recycleForestItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                      selectedItem.type === 'dead'
                        ? 'bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25'
                        : 'bg-forest-500/15 border border-forest-500/30 text-forest-200 hover:bg-forest-500/25'
                    }`}
                  >
                    {selectedItem.type === 'dead' ? (
                      <>
                        <Trash2 className="w-4 h-4" /> Clear Withered Shrub
                      </>
                    ) : (
                      <>
                        <ReturnIcon className="w-4 h-4" /> Return to Inventory
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-2 text-xs text-forest-500 hover:text-forest-300 transition-colors mt-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Share Biome Modal ─── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card max-w-md w-full p-6 border-forest-500/30 shadow-2xl relative"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-forest-500 hover:text-forest-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-forest-400" />
                <h3 className="font-display font-bold text-xl text-forest-100">Share Biome World</h3>
              </div>

              {/* Visual Card Preview */}
              <div className="rounded-2xl p-5 border border-forest-500/30 bg-gradient-to-br from-forest-900/80 via-forest-950/90 to-black text-forest-100 shadow-xl mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl pointer-events-none select-none">
                  🌲
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-800/60 border border-forest-500/30 flex items-center justify-center text-2xl shadow-inner">
                    {state.profile.avatar || '🧙‍♂️'}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-forest-100 leading-tight">
                      {state.profile.name}'s Forest
                    </h4>
                    <p className="text-xs text-forest-400">Biome Citizen · Level {state.level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-forest-500/20 text-center mb-3">
                  <div>
                    <span className="text-xs text-forest-500 font-bold block uppercase">Planted</span>
                    <span className="text-lg font-display font-bold text-forest-200">
                      {livingItems.length}/{totalTiles}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-forest-500 font-bold block uppercase">Streak</span>
                    <span className="text-lg font-display font-bold text-gold-400">
                      {state.streak.current}d 🔥
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-forest-500 font-bold block uppercase">Health</span>
                    <span className="text-lg font-display font-bold text-forest-300">
                      {healthPercent}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-forest-400/90 leading-relaxed italic">
                  "Growing a sanctuary of focus, one session at a time."
                </p>
                <div className="mt-2 text-right">
                  <span className="text-[10px] font-mono text-forest-500 tracking-wider">biome-focus.web.app</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-forest-600 to-forest-500 text-white font-bold text-sm hover:from-forest-500 hover:to-forest-400 shadow-lg shadow-forest-900/40 transition-all"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-green-300" /> Copied Summary to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Social Summary
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2 text-xs text-forest-500 hover:text-forest-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WorldStat({ label, value, icon, color = 'text-forest-200' }: {
  label: string; value: number; icon: string; color?: string;
}) {
  return (
    <div className="glass-card p-2 text-center">
      <span className="text-xs">{icon}</span>
      <p className={`text-sm font-display font-bold ${color}`}>{value}</p>
      <p className="text-[8px] font-bold text-forest-600 uppercase tracking-wider leading-tight">{label}</p>
    </div>
  );
}
