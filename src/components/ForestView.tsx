// ============================================
// Focus Forest — Immersive Forest World v3
// Inventory tray + Manual placement + Territory expansion
// ============================================
import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Maximize2, Info } from 'lucide-react';
import type { AppState, AppActions, ForestItem, InventoryItem } from '../types';
import { RARITY_COLORS, RARITY_BG } from '../constants';

interface ForestViewProps {
  state: AppState;
  actions: AppActions;
}

type PlacementModeItem = InventoryItem | null;

// ─── Terrain helpers ──────────────────────────
function isPathTile(x: number, y: number, size: number): boolean {
  const center = Math.floor(size / 2);
  const pathX = Math.floor(center + Math.sin(y * 0.7) * 2);
  return Math.abs(x - pathX) <= 0;
}
function isWaterTile(x: number, y: number, size: number): boolean {
  const px = Math.floor(size * 0.8);
  const py = Math.floor(size * 0.8);
  const dx = x - px, dy = y - py;
  return (dx * dx + dy * dy) <= 2;
}

export default function ForestView({ state, actions }: ForestViewProps) {
  const [placingItem, setPlacingItem] = useState<PlacementModeItem>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [expansionFlash, setExpansionFlash] = useState(false);
  const [showInventoryHelp, setShowInventoryHelp] = useState(false);

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
    state.forest.forEach(item => {
      const key = `${item.x},${item.y}`;
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        // collision — find nearest open spot
        for (let r = 1; r < gridSize; r++) {
          let found = false;
          for (let dx = -r; dx <= r && !found; dx++) {
            for (let dy = -r; dy <= r && !found; dy++) {
              const nx = ((item.x + dx) % gridSize + gridSize) % gridSize;
              const ny = ((item.y + dy) % gridSize + gridSize) % gridSize;
              const nk = `${nx},${ny}`;
              if (!map.has(nk)) {
                map.set(nk, item);
                found = true;
              }
            }
          }
          if (found) break;
        }
      }
    });
    return map;
  }, [state.forest, gridSize]);

  // ─── Placement actions ─────────────────────
  const selectForPlacement = useCallback((item: InventoryItem) => {
    setPlacingItem(item);
  }, []);

  const cancelPlacement = useCallback(() => {
    setPlacingItem(null);
  }, []);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!placingItem) return;
    const key = `${x},${y}`;
    if (gridMap.has(key)) return; // tile occupied

    // Check if this placement will trigger expansion
    const livingCount = livingItems.length + 1; // after this placement
    const willExpand = livingCount >= totalTiles && placingItem.type !== 'dead';

    actions.placeInventoryItem(placingItem.id, x, y);
    setPlacingItem(null);

    if (willExpand) {
      setExpansionFlash(true);
      setTimeout(() => setExpansionFlash(false), 3000);
    }
  }, [placingItem, gridMap, livingItems.length, totalTiles, actions]);

  const rarityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    livingItems.forEach(f => { counts[f.rarity] = (counts[f.rarity] || 0) + 1; });
    return counts;
  }, [livingItems]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col gap-4"
    >
      {/* ─── Header ─── */}
      <header className="flex items-end justify-between flex-shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold text-forest-100">My Forest World</h2>
          <p className="text-forest-500">
            {livingItems.length}/{totalTiles} tiles filled
            {state.expansionCount > 0 && ` · Expanded ${state.expansionCount}×`}
            {' · '}{healthPercent}% healthy
          </p>
        </div>
        {placingItem && (
          <button
            onClick={cancelPlacement}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all"
          >
            <X className="w-4 h-4" /> Cancel Placement
          </button>
        )}
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

      {/* ─── Placement mode indicator ─── */}
      <AnimatePresence>
        {placingItem && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-3 flex items-center gap-3 border-forest-500/30 bg-forest-500/5 flex-shrink-0"
          >
            <span className="text-3xl">{placingItem.icon}</span>
            <div>
              <p className="font-bold text-forest-200 text-sm">Placement Mode — Click any green tile to plant</p>
              <p className="text-xs text-forest-500">{placingItem.name} · <span className={RARITY_COLORS[placingItem.rarity]}>{placingItem.rarity}</span></p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-forest-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-forest-400 inline-block"></span> Select a tile
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Forest World Grid ─── */}
      <div className="glass-card overflow-hidden relative flex-shrink-0">
        {state.forest.length === 0 && state.inventory.length === 0 ? (
          <div className="flex items-center justify-center py-24">
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
          <div className="p-2">
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
                const isPath = isPathTile(x, y, gridSize);
                const isWater = isWaterTile(x, y, gridSize);
                const isEmpty = !item;
                const isPlaceable = placingItem && isEmpty;
                const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;

                let cellBg = '';
                if (isPath && isEmpty) cellBg = 'bg-amber-900/15';
                else if (isWater && isEmpty) cellBg = 'bg-blue-900/15';
                else if (isPlaceable && isHovered) cellBg = 'bg-forest-500/25';
                else if (isPlaceable) cellBg = 'bg-forest-500/10';
                else cellBg = 'bg-forest-900/10';

                return (
                  <div
                    key={idx}
                    onClick={() => isPlaceable && handleTileClick(x, y)}
                    onMouseEnter={() => isPlaceable && setHoveredTile({ x, y })}
                    onMouseLeave={() => setHoveredTile(null)}
                    className={`
                      aspect-square flex items-center justify-center relative group
                      border border-forest-800/8 transition-all
                      ${cellBg}
                      ${isPlaceable ? 'cursor-pointer' : 'cursor-default'}
                      ${isPlaceable && isHovered ? 'scale-105 z-10 shadow-lg shadow-forest-500/20' : ''}
                    `}
                  >
                    {/* Placement mode pulse effect on empty tiles */}
                    {isPlaceable && (
                      <div className="absolute inset-0 border border-forest-400/30 rounded-sm animate-pulse pointer-events-none" />
                    )}

                    {/* Water shimmer */}
                    {!item && isWater && (
                      <motion.span
                        className="text-[10px]"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >💧</motion.span>
                    )}

                    {/* Forest item */}
                    {item && (
                      <>
                        <motion.span
                          initial={{ scale: 0, rotate: -15 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', damping: 12 }}
                          className={`text-lg md:text-xl lg:text-2xl cursor-default select-none z-20 ${
                            item.type === 'dead' ? 'grayscale-[0.4] opacity-60' : 'drop-shadow-sm'
                          }`}
                        >
                          {item.icon}
                        </motion.span>

                        {/* Rarity ambient glow */}
                        {item.rarity === 'legendary' && (
                          <div className="absolute inset-0 bg-gold-400/5 rounded animate-pulse-glow pointer-events-none" />
                        )}
                        {item.rarity === 'epic' && (
                          <div className="absolute inset-0 bg-purple-400/4 rounded pointer-events-none" />
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
                    {isPlaceable && isHovered && placingItem && (
                      <span className="text-xl opacity-70 animate-pulse">
                        {placingItem.icon}
                      </span>
                    )}
                  </div>
                );
              })}
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
