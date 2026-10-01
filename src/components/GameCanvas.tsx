import React, { useEffect, useRef, useState } from 'react';
import { Ship, GameStats } from '../types';
import { SHIPS } from '../data';
import { audio } from '../utils/audio';
import { GameEngine } from '../systems/GameEngine';
import { EnemySystem, Enemy } from '../systems/EnemySystem';
import { DailyBossSystem } from '../systems/DailyBossSystem';
import { InputSystem } from '../systems/InputSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { NeonLiveOpsSystem } from '../systems/NeonLiveOpsSystem';
import { 
  Heart, 
  Shield, 
  Zap, 
  Tv, 
  Trophy, 
  Sparkles, 
  RotateCcw,
  Gem,
  AlertTriangle,
  Home,
  Save
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';

interface GameCanvasProps {
  equippedShipId: string;
  isPremium: boolean;
  chaosMode: boolean;
  preMatchShield: boolean;
  preMatchFireBoost: boolean;
  preMatchMagnet: boolean;
  onGameEnd: (stats: GameStats) => void;
  onWatchAdForExtraLife: () => void;
  hasUsedAdExtraLife: boolean;
  grantExtraLifeTrigger: boolean;
  upgradeLevels?: Record<string, number>;
  // SPRINT: MOBILE RETENTION & MONETIZATION
  isDailyRun?: boolean;
  dailyRunModifier?: string;
  vipFreeReviveUsedToday?: boolean;
  onUseVipFreeRevive?: () => void;
  isDailyBossRun?: boolean;
  fleet?: Record<string, { level: number; xp: number; matchesPlayed: number; enemiesDestroyed: number }>;
  isFtue?: boolean;
  onCompleteFtueStep?: () => void;
  autoStart?: boolean;
  resumeSnapshot?: string | null;
  onExitRun: (snapshot?: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  equippedShipId,
  isPremium,
  chaosMode,
  preMatchShield,
  preMatchFireBoost,
  preMatchMagnet,
  onGameEnd,
  onWatchAdForExtraLife,
  hasUsedAdExtraLife,
  grantExtraLifeTrigger,
  upgradeLevels = { laser_damage: 1, magnet_range: 1, shield_duration: 1 },
  isDailyRun = false,
  dailyRunModifier = '',
  vipFreeReviveUsedToday = false,
  onUseVipFreeRevive,
  isDailyBossRun = false,
  fleet = {},
  isFtue = false,
  onCompleteFtueStep,
  autoStart = true,
  resumeSnapshot = null,
  onExitRun
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [health, setHealth] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [victoryRewards, setVictoryRewards] = useState<{ gems: number; fragmentShipId: string; fragmentCount: number; badge: string } | null>(null);
  const [survivalSeconds, setSurvivalSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasBootstrappedRunRef = useRef(false);

  // Distances and Zones monitoring
  const [distance, setDistance] = useState(0);
  const [currentZone, setCurrentZone] = useState('Neon Orbit');
  const [zoneTransition, setZoneTransition] = useState<{ name: string; color: string } | null>(null);

  // Active powerup visual timers
  const [shieldTimeLeft, setShieldTimeLeft] = useState(0);
  const [fireTimeLeft, setFireTimeLeft] = useState(0);
  const [magnetTimeLeft, setMagnetTimeLeft] = useState(0);

  // New gameplay states
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [activeBoss, setActiveBoss] = useState<{ hp: number; maxHp: number } | null>(null);
  const [hazardWarning, setHazardWarning] = useState<string | null>(null);

  const triggerUltimate = () => {
    const state = stateRef.current;
    if (state.ultimateCharge < 100) return;

    // Clear charge
    state.ultimateCharge = 0;
    setUltimateCharge(0);

    // Camera shake
    GameEngine.triggerShake(state.shake, 25, 30);

    // Expand hot pink Shockwave centered on player's ship
    state.shockwaves.push({
      x: state.player.x,
      y: state.player.y,
      radius: 12,
      maxRadius: 360,
      speed: 13
    });

    // Sound effects sequence
    audio.playPowerup();
    setTimeout(() => {
      audio.playExplosion();
    }, 120);

    addEventLogRef.current("💥 SUPERNOVA ATTIVATA! 💥", "pink");
  };

  // Floating gameplay event logs overlay
  interface GameEvent {
    id: string;
    text: string;
    color: 'blue' | 'yellow' | 'pink' | 'emerald' | 'rose' | 'purple' | 'zinc';
  }
  const [eventLogs, setEventLogs] = useState<GameEvent[]>([]);
  const addEventLogRef = useRef<(text: string, color: 'blue' | 'yellow' | 'pink' | 'emerald' | 'rose' | 'purple' | 'zinc') => void>(() => {});
  
  useEffect(() => {
    addEventLogRef.current = (text, color) => {
      const id = Math.random().toString(36).substring(2, 9);
      setEventLogs([{ id, text, color }]);
      setTimeout(() => {
        setEventLogs(prev => prev.filter(log => log.id !== id));
      }, 2500);
    };
  }, []);

  // Ship stats
  const shipConfig = SHIPS.find(s => s.id === equippedShipId) || SHIPS[0];
  const shipLevel = fleet[equippedShipId]?.level || 1;
  const levelBoosts = NeonLiveOpsSystem.getShipLevelBoosts(shipLevel);
  const todayEvent = NeonLiveOpsSystem.getTodayEvent();
  const spaceWeather = NeonLiveOpsSystem.getSpaceWeather();

  // Game engine mutable states via refs
  const stateRef = useRef({
    player: {
      x: 0,
      y: 0,
      width: 45,
      height: 45,
      speed: shipConfig.speed + levelBoosts.speedBoost,
      color: shipConfig.color,
      secondaryColor: shipConfig.secondaryColor,
      bulletColor: shipConfig.bulletColor,
      isInvulnerable: false,
      invulnTimer: 0,
      hp: 3,
    },
    keys: {} as Record<string, boolean>,
    bullets: [] as Array<{ x: number, y: number, vx: number, vy: number, radius: number, isSearch: boolean }>,
    enemies: [] as Array<{ x: number, y: number, vx: number, speed: number, size: number, hp: number, maxHp: number, color: string, isTracking: boolean }>,
    particles: [] as Array<{ x: number, y: number, vx: number, vy: number, size: number, alpha: number, color: string, decay?: number }>,
    collectibles: [] as Array<{ x: number, y: number, type: 'gem' | 'shield' | 'fire' | 'magnet', size: number, angle: number }>,
    stars: [] as Array<{ x: number, y: number, size: number, speed: number }>,
    dimensions: { width: 400, height: 600 },
    lastShotTime: 0,
    gameTime: 0,
    stats: {
      score: 0,
      gemsCollected: 0,
      distance: 0,
      enemiesDestroyed: 0
    } as GameStats,
    powerups: {
      shieldUntil: 0,
      fireRateUntil: 0,
      magnetUntil: 0
    },
    shake: {
      intensity: 0,
      duration: 0
    },
    combo: {
      count: 0,
      lastKillTime: 0
    },
    currentZone: 'Neon Orbit',
    lastBossSpawnMeters: 0,
    hitstopFrames: 0,
    hasSpawnedFragmentThisRun: false,
    collectedFragmentShipId: null as string | null,
    nearMissesCount: 0,
    bossKillsCount: 0,
    ultimateCharge: 0,
    shockwaves: [] as Array<{ x: number, y: number, radius: number, maxRadius: number, speed: number }>,
    activeHazard: null as { type: 'lightning' | 'solar'; x?: number; y?: number; timer: number; strikeFrames?: number } | null,
    magneticIntensity: 0,
    seededSeed: 12345,
    ftueSpawnedShield: false,
    ftueSpawnedMagnet: false,
    ftueSpawnedFire: false
  });

  // Ref to track touch drag start position for fluid relative movement on mobile
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; playerX: number; playerY: number } | null>(null);

  // Watch for external reward extra life trigger
  useEffect(() => {
    if (grantExtraLifeTrigger && isGameOver) {
      setIsGameOver(false);
      setIsPlaying(true);
      setHealth(1);
      stateRef.current.player.hp = 1;
      // Give 3 seconds shield protection
      stateRef.current.player.invulnTimer = 180; // frames
      stateRef.current.player.isInvulnerable = true;
      stateRef.current.powerups.shieldUntil = Date.now() + 3000;
      setShieldTimeLeft(3);
      audio.playPowerup();
    }
  }, [grantExtraLifeTrigger]);

  // Handle ResizeObserver
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width || 400;
          canvas.height = height || 550;
          stateRef.current.dimensions = { width: canvas.width, height: canvas.height };

          // Center the player on resize if they haven't started playing
          if (!isPlaying) {
            stateRef.current.player.x = canvas.width / 2;
            stateRef.current.player.y = canvas.height - 80;
          }
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' && isPlaying && !isPaused) {
        e.preventDefault();
        if (stateRef.current.ultimateCharge >= 100) {
          triggerUltimate();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused]);

  // Touch and Mouse relative dragging controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Save starting touch coordinates and starting ship coordinates
    dragStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      playerX: stateRef.current.player.x,
      playerY: stateRef.current.player.y
    };

    // Capture the pointer to receive move/up events even if finger moves outside the canvas
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.error("Pointer capture error", err);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Boundary clamping
    const halfWidth = stateRef.current.player.width / 2;
    const halfHeight = stateRef.current.player.height / 2;

    if (dragStartRef.current) {
      // Relative movement delta
      const dx = clientX - dragStartRef.current.pointerX;
      const dy = clientY - dragStartRef.current.pointerY;

      stateRef.current.player.x = Math.max(halfWidth, Math.min(stateRef.current.dimensions.width - halfWidth, dragStartRef.current.playerX + dx));
      stateRef.current.player.y = Math.max(halfHeight, Math.min(stateRef.current.dimensions.height - 50, dragStartRef.current.playerY + dy));
    } else {
      // Fallback/Desktop hover: move toward target directly when not dragging (smooth cursor flow)
      stateRef.current.player.x = Math.max(halfWidth, Math.min(stateRef.current.dimensions.width - halfWidth, clientX));
      stateRef.current.player.y = Math.max(halfHeight, Math.min(stateRef.current.dimensions.height - 50, clientY));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Start a new game session
  const startNewGame = () => {
    audio.playPowerup();

    // Reset standard states
    setScore(0);
    setGemsCollected(0);
    setDistance(0);
    setCurrentZone('Neon Orbit');
    setZoneTransition(null);
    const initialHp = chaosMode ? 1 : (shipConfig.health + levelBoosts.healthBoost);
    setHealth(initialHp);
    setIsGameOver(false);
    setIsVictory(false);
    setVictoryRewards(null);
    setIsPaused(false);
    setIsPlaying(true);

    // Reset game logic variables
    const state = stateRef.current;
    (state as any).hasSpawnedDailyBoss = false;
    state.bullets = [];
    state.enemies = [];
    state.particles = [];
    state.collectibles = [];
    state.lastShotTime = 0;
    state.gameTime = 0;
    state.shake = { intensity: 0, duration: 0 };
    state.combo = { count: 0, lastKillTime: 0 };
    state.currentZone = 'Neon Orbit';
    state.lastBossSpawnMeters = 0;
    
    // Sprint custom variables reset
    state.hasSpawnedFragmentThisRun = false;
    state.collectedFragmentShipId = null;
    state.nearMissesCount = 0;
    state.bossKillsCount = 0;
    state.ultimateCharge = 0;
    state.shockwaves = [];
    state.activeHazard = null;
    state.magneticIntensity = 0;
    setUltimateCharge(0);
    setActiveBoss(null);
    setHazardWarning(null);
    if (isDailyRun) {
      const todayNum = new Date().getDate();
      state.seededSeed = todayNum + 42;
    }
    
    setEventLogs([]);
    setTimeout(() => {
      addEventLogRef.current("Sistemi di Volo Attivi! 🚀", "blue");
      addEventLogRef.current(`Livello Flotta: ${shipLevel} ⚓`, "yellow");
      if (chaosMode) {
        addEventLogRef.current("MODALITÀ CAOS ATTIVATA! ⚠️🔥", "rose");
      }
      if (todayEvent) {
        addEventLogRef.current(`EVENTO ATTIVO: ${todayEvent.name}! ${todayEvent.emoji}`, "purple");
      }
      if (spaceWeather) {
        addEventLogRef.current(`METEO: ${spaceWeather.name} ${spaceWeather.emoji}`, "emerald");
      }
      if (isDailyRun && dailyRunModifier) {
        const modTitleMap: Record<string, string> = {
          gem_rush: '💎 CORSA ALLE GEMME (+50% Gemme, nemici veloci)',
          shield_day: '🛡️ GIORNO DELLO SCUDO (Scudi +, Colossi ++)',
          chaos_lite: '🔥 MODALITÀ CHAOS LITE (Ostacoli +, Punti +30%)',
          laser_storm: '⚡ CADENZA DI FUOCO RAPIDO ATTIVA!',
          boss_signal: '👾 SEGNALE BOSS (Colossi ogni 1000m)',
          neon_jackpot: '💰 NEON JACKPOT (Gemme raddoppiate!)'
        };
        addEventLogRef.current(`MODIFICATORE: ${modTitleMap[dailyRunModifier] || dailyRunModifier.toUpperCase()}!`, "yellow");
      }
    }, 100);
    
    state.stats = {
      score: 0,
      gemsCollected: 0,
      distance: 0,
      enemiesDestroyed: 0
    };

    // Apply pre-match boosts if any (rewarded from watching ads or daily event scudi)
    const now = Date.now();
    const hasFreeEventShield = todayEvent.modifiers.freeShield;
    state.powerups = {
      shieldUntil: (preMatchShield || hasFreeEventShield) ? now + 20000 : 0,
      fireRateUntil: preMatchFireBoost ? now + 20000 : 0,
      magnetUntil: preMatchMagnet ? now + 20000 : 0
    };

    setShieldTimeLeft((preMatchShield || hasFreeEventShield) ? 20 : 0);
    setFireTimeLeft(preMatchFireBoost ? 20 : 0);
    setMagnetTimeLeft(preMatchMagnet ? 20 : 0);

    // Re-initialize player parameters
    const hasFreeShieldInvuln = preMatchShield || hasFreeEventShield;
    state.player = {
      x: state.dimensions.width / 2,
      y: state.dimensions.height - 80,
      width: 45,
      height: 45,
      speed: shipConfig.speed + levelBoosts.speedBoost + (spaceWeather.id === 'weather_2' ? 1.5 : 0),
      color: shipConfig.color,
      secondaryColor: shipConfig.secondaryColor,
      bulletColor: shipConfig.bulletColor,
      isInvulnerable: hasFreeShieldInvuln,
      invulnTimer: hasFreeShieldInvuln ? 1200 : 60, // Frame units
      hp: initialHp,
    };

    // Initialize starry field
    state.stars = [];
    for (let i = 0; i < 60; i++) {
      state.stars.push({
        x: Math.random() * state.dimensions.width,
        y: Math.random() * state.dimensions.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5
      });
    }
  };

  const createRunSnapshot = () => {
    const state = stateRef.current;
    const now = Date.now();

    return JSON.stringify({
      version: 1,
      savedAt: now,
      state: { ...state, powerups: undefined },
      powerupsRemaining: {
        shield: Math.max(0, state.powerups.shieldUntil - now),
        fireRate: Math.max(0, state.powerups.fireRateUntil - now),
        magnet: Math.max(0, state.powerups.magnetUntil - now)
      },
      ui: {
        score,
        gemsCollected,
        health: state.player.hp,
        distance,
        currentZone,
        ultimateCharge,
        survivalSeconds
      }
    });
  };

  const restoreSavedRun = () => {
    if (!resumeSnapshot) return false;

    try {
      const parsed = JSON.parse(resumeSnapshot);
      if (parsed?.version !== 1 || !parsed?.state) return false;

      const now = Date.now();
      const current = stateRef.current;
      const restored = parsed.state;
      const remaining = parsed.powerupsRemaining || {};

      stateRef.current = {
        ...current,
        ...restored,
        player: {
          ...current.player,
          ...(restored.player || {})
        },
        keys: {},
        powerups: {
          shieldUntil: now + Math.max(0, Number(remaining.shield) || 0),
          fireRateUntil: now + Math.max(0, Number(remaining.fireRate) || 0),
          magnetUntil: now + Math.max(0, Number(remaining.magnet) || 0)
        }
      };

      const ui = parsed.ui || {};
      setScore(Number(ui.score) || Number(restored.stats?.score) || 0);
      setGemsCollected(Number(ui.gemsCollected) || Number(restored.stats?.gemsCollected) || 0);
      setHealth(Number(restored.player?.hp) || Number(ui.health) || 1);
      setDistance(Number(ui.distance) || Math.round((Number(restored.stats?.distance) || 0) * 10));
      setCurrentZone(ui.currentZone || restored.currentZone || 'Neon Orbit');
      setUltimateCharge(Number(restored.ultimateCharge) || Number(ui.ultimateCharge) || 0);
      setSurvivalSeconds(Number(ui.survivalSeconds) || 0);
      setIsGameOver(false);
      setIsVictory(false);
      setIsPaused(false);
      setShowExitConfirm(false);
      setIsPlaying(true);
      addEventLogRef.current('Partita Premium ripristinata. 🚀', 'emerald');
      return true;
    } catch (error) {
      console.error('Unable to restore run snapshot', error);
      return false;
    }
  };

  useEffect(() => {
    if (hasBootstrappedRunRef.current) return;
    hasBootstrappedRunRef.current = true;

    if (resumeSnapshot && restoreSavedRun()) return;
    if (autoStart) startNewGame();
  }, []);

  useEffect(() => {
    let listener: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener('backButton', () => {
      if (isGameOver || isVictory) return;
      setIsPaused(true);
      setShowExitConfirm(true);
    }).then(handle => {
      listener = handle;
    });

    return () => {
      if (listener) void listener.remove();
    };
  }, [isGameOver, isVictory]);

  // Main game loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const state = stateRef.current;
      const now = Date.now();

      // Implement brief impact hitstop
      if (state.hitstopFrames > 0) {
        state.hitstopFrames--;
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const originalRandom = Math.random;
      if (isDailyRun) {
        Math.random = () => {
          state.seededSeed = (state.seededSeed * 1664525 + 1013904223) % 4294967296;
          return state.seededSeed / 4294967296;
        };
      }

      // Clear Canvas with a zone-specific deep space tint
      let clearColor = '#09090b';
      if (state.currentZone === 'Violet Debris Field') {
        clearColor = '#120b1e'; // deep dark violet
      } else if (state.currentZone === 'Solar Wreck Zone') {
        clearColor = '#1a1005'; // deep dark solar amber
      } else if (state.currentZone === 'Quantum Abyss') {
        clearColor = '#04150d'; // deep dark quantum emerald
      }
      ctx.fillStyle = clearColor;
      ctx.fillRect(0, 0, state.dimensions.width, state.dimensions.height);

      // Draw Zone-Themed Ambient Background Radial Glow
      let glowColor = 'rgba(59, 130, 246, 0.05)'; // Blue (Neon Orbit)
      if (state.currentZone === 'Violet Debris Field') {
        glowColor = 'rgba(168, 85, 247, 0.12)'; // Violet (More vivid)
      } else if (state.currentZone === 'Solar Wreck Zone') {
        glowColor = 'rgba(245, 158, 11, 0.12)'; // Amber / Orange (More vivid)
      } else if (state.currentZone === 'Quantum Abyss') {
        glowColor = 'rgba(16, 185, 129, 0.12)'; // Emerald Green (More vivid)
      }

      const grad = ctx.createRadialGradient(
        state.dimensions.width / 2, state.dimensions.height / 2, 10,
        state.dimensions.width / 2, state.dimensions.height / 2, Math.max(state.dimensions.width, state.dimensions.height) / 1.5
      );
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, state.dimensions.width, state.dimensions.height);

      // 1. RENDER & UPDATE STARS (Always running, even in background)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      if (!isPaused && isPlaying && !isGameOver) {
        let zoneSpeedMultiplier = 1.0;
        if (state.currentZone === 'Violet Debris Field') {
          zoneSpeedMultiplier = 1.35;
        } else if (state.currentZone === 'Solar Wreck Zone') {
          zoneSpeedMultiplier = 1.75;
        } else if (state.currentZone === 'Quantum Abyss') {
          zoneSpeedMultiplier = 2.2;
        }
        GameEngine.updateStars(state.stars, state.dimensions.height, (chaosMode ? 2.5 : 1.2) * zoneSpeedMultiplier);
      }
      state.stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      if (!isPlaying || isPaused || isGameOver) {
        // Draw decorative star particle glow when not actively in game
        if (!isPlaying && !isGameOver) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.beginPath();
          ctx.arc(state.dimensions.width / 2, state.dimensions.height / 2, 100, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw idle player ship
        drawShip(ctx, state.dimensions.width / 2, state.dimensions.height - 80, shipConfig.color, shipConfig.secondaryColor);
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // --- GAME LOGIC STARTS HERE ---
      state.gameTime++;

      // Update camera shake
      const { x: dxShake, y: dyShake } = GameEngine.getShakeOffsets(state.shake);

      ctx.save();
      if (dxShake !== 0 || dyShake !== 0) {
        ctx.translate(dxShake, dyShake);
      }

      // Distances tracking (based on elapsed game time and ship speed)
      const distSpeedFactor = state.player.speed || 5;
      const distanceIncrement = 0.01 * distSpeedFactor;
      state.stats.distance += distanceIncrement;
      const meters = Math.round(state.stats.distance * 10);
      setDistance(meters);

      // Check for Space Zone transition
      let zone = 'Neon Orbit';
      let zoneColor: 'blue' | 'purple' | 'yellow' | 'emerald' = 'blue';
      if (meters >= 5000) {
        zone = 'Quantum Abyss';
        zoneColor = 'emerald';
      } else if (meters >= 2500) {
        zone = 'Solar Wreck Zone';
        zoneColor = 'yellow';
      } else if (meters >= 1000) {
        zone = 'Violet Debris Field';
        zoneColor = 'purple';
      }

      if (state.currentZone !== zone) {
        state.currentZone = zone;
        setCurrentZone(zone);
        addEventLogRef.current(`ENTRANDO IN: ${zone.toUpperCase()}! 🌌`, zoneColor);
        setZoneTransition({ name: zone, color: zoneColor });
        audio.playPowerup();
        setTimeout(() => {
          setZoneTransition(prev => prev?.name === zone ? null : prev);
        }, 3000);
      }

      // Check for Daily Boss Spawn
      if (isDailyBossRun && !(state as any).hasSpawnedDailyBoss && meters >= 300) {
        (state as any).hasSpawnedDailyBoss = true;
        
        const todayBoss = DailyBossSystem.getTodayBoss();
        const bossEntity = {
          id: 'daily_boss_entity',
          x: state.dimensions.width / 2,
          y: -80,
          vx: 0,
          vy: 0,
          speed: 0.8,
          size: 45,
          hp: todayBoss.maxHp,
          maxHp: todayBoss.maxHp,
          color: todayBoss.color,
          isTracking: true,
          type: 'daily_boss',
          patternType: todayBoss.patternType,
          behaviorTimer: 0,
          lastShotTime: 0
        };
        state.enemies.push(bossEntity as any);
        audio.playGameOver(); // Retro alarm sound
        addEventLogRef.current(`⚠️ DETECTED: ${todayBoss.name.toUpperCase()}! ⚠️`, "rose");
        GameEngine.triggerShake(state.shake, 30, 40);
      }

      // Check for Mini-Boss Spawn (Every 2,000 meters or 1,000 meters on Boss Signal day)
      const lastBossSpawn = state.lastBossSpawnMeters || 0;
      const bossInterval = dailyRunModifier === 'boss_signal' ? 1000 : 2000;
      if (!isDailyBossRun && meters >= bossInterval && meters - lastBossSpawn >= bossInterval) {
        state.lastBossSpawnMeters = Math.floor(meters / bossInterval) * bossInterval;
        
        // Spawn boss!
        const scoreBonusHP = Math.floor(state.stats.score / 250);
        let bossHp = 22 + scoreBonusHP * 2;
        if (dailyRunModifier === 'shield_day') {
          bossHp = Math.round(bossHp * 1.6);
        }
        const boss = {
          id: Math.random().toString(36).substring(2, 9),
          x: state.dimensions.width / 2,
          y: -60,
          vx: 0,
          vy: 0,
          speed: 0.8,
          size: 40,
          hp: bossHp,
          maxHp: bossHp,
          color: '#a855f7', // vibrant deep purple
          isTracking: true,
          type: 'mini_boss',
          behaviorTimer: 0,
          lastShotTime: 0
        };
        state.enemies.push(boss as any);
        audio.playGameOver(); // play retro alarm sound
        addEventLogRef.current("⚠️ COLOSSO ASTEROIDE RILEVATO! ⚠️", "rose");
      }

      // Update Powerup Visual Timers every second
      const shieldTimer = Math.max(0, Math.round((state.powerups.shieldUntil - now) / 1000));
      const fireTimer = Math.max(0, Math.round((state.powerups.fireRateUntil - now) / 1000));
      const magnetTimer = Math.max(0, Math.round((state.powerups.magnetUntil - now) / 1000));
      setShieldTimeLeft(shieldTimer);
      setFireTimeLeft(fireTimer);
      setMagnetTimeLeft(magnetTimer);

      // Handle Keyboard Movements
      const dx = (state.keys['arrowleft'] || state.keys['a'] ? -1 : 0) + (state.keys['arrowright'] || state.keys['d'] ? 1 : 0);
      const dy = (state.keys['arrowup'] || state.keys['w'] ? -1 : 0) + (state.keys['arrowdown'] || state.keys['s'] ? 1 : 0);

      const speedFactor = chaosMode ? state.player.speed * 1.3 : state.player.speed;
      state.player.x += dx * speedFactor;
      state.player.y += dy * speedFactor;

      // Apply magnetic pulse hazard drift if active
      if (state.magneticIntensity !== 0) {
        state.player.x += state.magneticIntensity * Math.sin(state.gameTime * 0.08);
      }

      // Restrict ship boundaries
      const halfWidth = state.player.width / 2;
      const halfHeight = state.player.height / 2;
      state.player.x = Math.max(halfWidth, Math.min(state.dimensions.width - halfWidth, state.player.x));
      state.player.y = Math.max(halfHeight, Math.min(state.dimensions.height - 50, state.player.y));

      // Handle Shooting (Auto-Fire triggers matching ship's fire rate)
      const isFireBoosted = fireTimer > 0 || dailyRunModifier === 'laser_storm' || spaceWeather.id === 'weather_1';
      let fireInterval = isFireBoosted ? shipConfig.fireRate * 0.45 : shipConfig.fireRate;
      // Apply level-up fireRate reductions
      fireInterval = Math.max(80, fireInterval - levelBoosts.fireRateReduction);

      if (now - state.lastShotTime > fireInterval) {
        state.lastShotTime = now;
        audio.playLaser();

        const laserLvl = upgradeLevels.laser_damage || 1;
        // Standard or Golden/Quantum projectile streams
        if (equippedShipId === 'premium_golden') {
          // Triple spread bullet
          state.bullets.push({ x: state.player.x, y: state.player.y - 15, vx: 0, vy: -10, radius: 4.5 + laserLvl * 0.5, isSearch: false });
          state.bullets.push({ x: state.player.x, y: state.player.y - 15, vx: -3, vy: -9, radius: 4 + laserLvl * 0.5, isSearch: false });
          state.bullets.push({ x: state.player.x, y: state.player.y - 15, vx: 3, vy: -9, radius: 4 + laserLvl * 0.5, isSearch: false });
        } else if (equippedShipId === 'premium_quantum') {
          // Seek/Homming bullet setup
          state.bullets.push({ x: state.player.x, y: state.player.y - 15, vx: 0, vy: -11, radius: 5 + laserLvl * 0.5, isSearch: true });
        } else {
          // Standard laser
          state.bullets.push({ x: state.player.x, y: state.player.y - 15, vx: 0, vy: -9, radius: 4 + laserLvl * 0.5, isSearch: false });
        }
      }

      // Derive invulnerability every frame from legitimate timed sources only.
      if (state.player.invulnTimer > 0) {
        state.player.invulnTimer--;
      }
      const hasHitGrace = state.player.invulnTimer > 0;
      const hasActiveShield = shieldTimer > 0;
      state.player.isInvulnerable = hasHitGrace || hasActiveShield;

      // 2. SPAWN METEOR ENEMIES (Scales up spawn frequency and max screen cap dynamically with distance thresholds)
      let baseSpawnChance = chaosMode ? 0.06 : 0.022;
      let zoneSpawnMultiplier = 1.0;
      let maxEnemiesOnScreen = 10;
      if (isFtue) {
        baseSpawnChance = 0.007; // extremely gentle spawn rate
        zoneSpawnMultiplier = 0.5;
        maxEnemiesOnScreen = 3; // limited easy targets
      } else if (state.currentZone === 'Violet Debris Field') {
        zoneSpawnMultiplier = 1.25;
        maxEnemiesOnScreen = 12;
      } else if (state.currentZone === 'Solar Wreck Zone') {
        zoneSpawnMultiplier = 1.5;
        maxEnemiesOnScreen = 14;
      } else if (state.currentZone === 'Quantum Abyss') {
        zoneSpawnMultiplier = 1.8;
        maxEnemiesOnScreen = 16;
      }
      let spawnChance = (baseSpawnChance + Math.min(0.04, state.stats.score * 0.000015)) * zoneSpawnMultiplier;
      if (dailyRunModifier === 'chaos_lite') {
        spawnChance *= 1.45;
        maxEnemiesOnScreen += 4;
      }

      // Apply today event spawn delay modifier
      if (todayEvent?.modifiers?.spawnDelayMult) {
        spawnChance *= (1 / todayEvent.modifiers.spawnDelayMult);
      }
      
      const isDailyBossOnScreen = state.enemies.some(e => e.type === 'daily_boss');
      if (!isDailyBossOnScreen && Math.random() < spawnChance && state.enemies.length < maxEnemiesOnScreen) {
        const newEnemy = EnemySystem.createEnemy(state.stats.score, chaosMode, state.dimensions.width);
        if (dailyRunModifier === 'gem_rush') {
          newEnemy.speed *= 1.35;
        }

        // Apply today event speed and size multipliers
        if (todayEvent?.modifiers?.meteorSpeedMult) {
          newEnemy.speed *= todayEvent.modifiers.meteorSpeedMult;
        }
        if (todayEvent?.modifiers?.meteorSizeMult) {
          newEnemy.size *= todayEvent.modifiers.meteorSizeMult;
        }

        state.enemies.push(newEnemy as any);
      }

      // 3. SPAWN COLLECTIBLES (gems or boosts)
      let collectSpawnChance = isFtue ? 0.015 : 0.004; // more gems for FTUE!
      if (dailyRunModifier === 'shield_day') {
        collectSpawnChance = 0.008; // more items!
      }

      // FTUE Forced Powerup Spawns
      if (isFtue) {
        if (meters >= 100 && !state.ftueSpawnedShield) {
          state.ftueSpawnedShield = true;
          state.collectibles.push({
            x: state.dimensions.width / 2,
            y: -20,
            type: 'shield',
            size: 15,
            angle: 0
          });
          addEventLogRef.current("🛡️ SCUDO SPAZIALE IN ARRIVO! 🛡️", "blue");
        } else if (meters >= 250 && !state.ftueSpawnedMagnet) {
          state.ftueSpawnedMagnet = true;
          state.collectibles.push({
            x: state.dimensions.width / 2,
            y: -20,
            type: 'magnet',
            size: 15,
            angle: 0
          });
          addEventLogRef.current("🧲 ATTIRATORE DI GEMME IN ARRIVO! 🧲", "emerald");
        } else if (meters >= 400 && !state.ftueSpawnedFire) {
          state.ftueSpawnedFire = true;
          state.collectibles.push({
            x: state.dimensions.width / 2,
            y: -20,
            type: 'fire',
            size: 15,
            angle: 0
          });
          addEventLogRef.current("🔥 CADENZA DI FUOCO RAPIDA IN ARRIVO! 🔥", "yellow");
        }
      }

      if (Math.random() < collectSpawnChance && state.collectibles.length < 5) {
        let type: 'gem' | 'shield' | 'fire' | 'magnet' = 'gem';
        if (dailyRunModifier === 'shield_day' && Math.random() < 0.35) {
          type = 'shield'; // higher chance of shield!
        } else {
          const types: Array<'gem' | 'shield' | 'fire' | 'magnet'> = [
            'gem', 'gem', 'gem', 'gem', 'gem', 'gem', 'gem', 'gem',
            'fire', 'fire', 'magnet', 'shield'
          ];
          type = types[Math.floor(Math.random() * types.length)];
        }
        state.collectibles.push({
          x: Math.random() * (state.dimensions.width - 30) + 15,
          y: -20,
          type,
          size: type === 'gem' ? 10 : 15,
          angle: 0
        });
      }

      // Randomly spawn a ship fragment if distance > 1000m, limited to 1 per match
      if (meters > 1000 && !state.hasSpawnedFragmentThisRun && Math.random() < 0.001) {
        state.hasSpawnedFragmentThisRun = true;
        // Choose a random premium ship to spawn a fragment for
        const fragmentShips = ['premium_golden', 'premium_quantum', 'velocity', 'dreadnought'];
        const targetShipId = fragmentShips[Math.floor(Math.random() * fragmentShips.length)];
        
        state.collectibles.push({
          x: Math.random() * (state.dimensions.width - 40) + 20,
          y: -20,
          type: 'fragment',
          size: 12,
          angle: 0,
          shipId: targetShipId
        } as any);
        
        addEventLogRef.current("⚠️ FRAMMENTO NAVE RILEVATO NELLO SPAZIO! ⚠️", "yellow");
      }

      // --- DYNAMIC ENVIRONMENTAL HAZARDS EVENT LOOP ---
      if (state.gameTime % 320 === 0 && !state.activeHazard && state.currentZone !== 'Neon Orbit') {
        const hz = state.currentZone;
        if (hz === 'Quantum Abyss') {
          const lx = Math.random() * (state.dimensions.width - 60) + 30;
          state.activeHazard = { type: 'lightning', x: lx, timer: 65 };
          setHazardWarning("FULMINE QUANTISTICO IN ARRIVO! ⚡ Evita la zona verticale rossa!");
          audio.playClick();
        } else if (hz === 'Solar Wreck Zone') {
          const ly = Math.random() * (state.dimensions.height - 250) + 120;
          state.activeHazard = { type: 'solar', y: ly, timer: 80 };
          setHazardWarning("ERUZIONE SOLARE IMMINENTE! 🔥 Evita la fascia orizzontale rossa!");
          audio.playClick();
        } else if (hz === 'Violet Debris Field') {
          state.magneticIntensity = Math.random() > 0.5 ? 2.2 : -2.2;
          setHazardWarning("⚠️ PULSAZIONE MAGNETICA ATTIVA! 📡 Drift dello scafo in corso!");
          audio.playPowerup();
          setTimeout(() => {
            state.magneticIntensity = 0;
            setHazardWarning(null);
          }, 2200);
        }
      }

      // Update Active Hazards
      if (state.activeHazard) {
        state.activeHazard.timer--;
        if (state.activeHazard.timer <= 0) {
          if (state.activeHazard.strikeFrames === undefined) {
            state.activeHazard.strikeFrames = 18; // 18 frames active strike
            audio.playExplosion();
            setHazardWarning(state.activeHazard.type === 'lightning' ? "⚡ SCARICA INTEGRALE!" : "🔥 FLUSSO DI PLASMA SOLARE!");
          } else {
            state.activeHazard.strikeFrames--;
            if (state.activeHazard.strikeFrames <= 0) {
              state.activeHazard = null;
              setHazardWarning(null);
            }
          }
        }
      }

      // Check Active Hazard Collisions (Damage Player / Vaporize Meteors)
      if (state.activeHazard && state.activeHazard.strikeFrames && state.activeHazard.strikeFrames > 0) {
        if (state.activeHazard.type === 'lightning') {
          const lx = state.activeHazard.x || 0;
          // Player check
          if (Math.abs(state.player.x - lx) < 32) {
            if (!state.player.isInvulnerable) {
              audio.playExplosion();
              const newHp = Math.max(0, state.player.hp - 1);
              state.player.hp = newHp;
              setHealth(newHp);
              state.player.isInvulnerable = true;
              state.player.invulnTimer = 90;
              addEventLogRef.current("Fulmine Spaziale! VITE -1 ⚡", "rose");
              GameEngine.triggerShake(state.shake, 18, 22);
              if (newHp <= 0) {
                handleCrash();
              }
            }
          }
          // Meteors check
          state.enemies.forEach((enemy, eIdx) => {
            if (Math.abs(enemy.x - lx) < 32 && enemy.type !== 'mini_boss') {
              createSparks(state, enemy.x, enemy.y, 8, '#22d3ee');
              state.enemies.splice(eIdx, 1);
              state.stats.enemiesDestroyed++;
              state.stats.score += 50;
              state.collectibles.push({
                x: enemy.x,
                y: enemy.y,
                type: 'gem',
                size: 10,
                angle: 0
              });
            }
          });
        } else if (state.activeHazard.type === 'solar') {
          const ly = state.activeHazard.y || 0;
          // Player check
          if (Math.abs(state.player.y - ly) < 32) {
            if (!state.player.isInvulnerable) {
              audio.playExplosion();
              const newHp = Math.max(0, state.player.hp - 1);
              state.player.hp = newHp;
              setHealth(newHp);
              state.player.isInvulnerable = true;
              state.player.invulnTimer = 90;
              addEventLogRef.current("Tempesta Solare! VITE -1 🔥", "rose");
              GameEngine.triggerShake(state.shake, 18, 22);
              if (newHp <= 0) {
                handleCrash();
              }
            }
          }
          // Meteors check
          state.enemies.forEach((enemy, eIdx) => {
            if (Math.abs(enemy.y - ly) < 32 && enemy.type !== 'mini_boss') {
              createSparks(state, enemy.x, enemy.y, 8, '#f59e0b');
              state.enemies.splice(eIdx, 1);
              state.stats.enemiesDestroyed++;
              state.stats.score += 50;
              state.collectibles.push({
                x: enemy.x,
                y: enemy.y,
                type: 'gem',
                size: 10,
                angle: 0
              });
            }
          });
        }
      }

      // --- ULTIMATE SUPERNOVA SHOCKWAVES UPDATE & COLLISIONS ---
      state.shockwaves.forEach((wave, wIdx) => {
        wave.radius += wave.speed;
        
        // Check collisions with standard enemies
        state.enemies.forEach((enemy, eIdx) => {
          const distToWave = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
          if (Math.abs(distToWave - wave.radius) < 25) {
            if (enemy.type === 'mini_boss') {
              // Deal damage to boss
              const prevHp = enemy.hp;
              enemy.hp = Math.max(1, enemy.hp - 8);
              if (prevHp > enemy.hp) {
                createSparks(state, enemy.x, enemy.y, 10, '#ec4899');
              }
            } else {
              // Vaporize meteor
              createSparks(state, enemy.x, enemy.y, 12, '#ec4899');
              state.enemies.splice(eIdx, 1);
              state.stats.enemiesDestroyed++;
              state.stats.score += 75;
              state.collectibles.push({
                x: enemy.x,
                y: enemy.y,
                type: 'gem',
                size: 10,
                angle: Math.random() * Math.PI
              });
            }
          }
        });

        if (wave.radius >= wave.maxRadius) {
          state.shockwaves.splice(wIdx, 1);
        }
      });

      // --- THROTTLED REACT STATE SYNC (6 times a second) ---
      if (state.gameTime % 10 === 0) {
        setUltimateCharge(state.ultimateCharge);
        
        const activeBossEntity = state.enemies.find(e => e.type === 'mini_boss' || e.type === 'daily_boss');
        if (activeBossEntity) {
          setActiveBoss({ hp: activeBossEntity.hp, maxHp: activeBossEntity.maxHp });
        } else {
          setActiveBoss(null);
        }
      }

      // 4. UPDATE BULLETS
      state.bullets.forEach((b, bIdx) => {
        b.y += b.vy;
        b.x += b.vx;

        // Smart lock-on quantum homing
        if (b.isSearch && state.enemies.length > 0) {
          const target = state.enemies[0];
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          b.vx += Math.cos(angle) * 0.8;
          b.vy += Math.sin(angle) * 0.8;
          // limit speed
          const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
          if (speed > 12) {
            b.vx = (b.vx / speed) * 12;
            b.vy = (b.vy / speed) * 12;
          }
        }

        // Remove out-of-screen projectiles
        if (b.y < -10 || b.x < -10 || b.x > state.dimensions.width + 10) {
          state.bullets.splice(bIdx, 1);
        }
      });

      // 5. UPDATE ENEMIES
      state.enemies.forEach((enemy, eIdx) => {
        enemy.y += enemy.speed;
        enemy.x += enemy.vx;

        // Tracking meteorites adjust horizontal velocity towards the player
        if (enemy.isTracking && enemy.type !== 'mini_boss' && enemy.type !== 'daily_boss') {
          const dx = state.player.x - enemy.x;
          // Slowly drift towards player horizontally
          enemy.vx += Math.sign(dx) * 0.05;
          // Clamp tracking speed to prevent unavoidable speeds
          const maxVx = chaosMode ? 3.5 : 2.0;
          enemy.vx = Math.max(-maxVx, Math.min(maxVx, enemy.vx));
        }

        // Homing projectile tracking
        if (enemy.isTracking && enemy.type === 'boss_projectile') {
          const dx = state.player.x - enemy.x;
          enemy.vx += Math.sign(dx) * 0.08;
          enemy.vx = Math.max(-2.5, Math.min(2.5, enemy.vx));
        }

        // Gravity well pull physics
        if (enemy.type === 'gravity_well') {
          const distToPlayer = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
          if (distToPlayer < 180) {
            const pullStrength = (180 - distToPlayer) / 95;
            state.player.x += Math.sign(enemy.x - state.player.x) * pullStrength;
            state.player.y += Math.sign(enemy.y - state.player.y) * pullStrength;
          }
        }

        // Mini-boss custom behavior overrides
        if (enemy.type === 'mini_boss') {
          const isOverdrive = enemy.hp <= enemy.maxHp / 2;

          // Slow down and hover at the top (around y = 100)
          if (enemy.y < 120) {
            enemy.speed = 0.8;
          } else {
            enemy.speed = 0; // stop moving down
          }

          // Move side-to-side using sine wave (faster in overdrive!)
          enemy.vx = Math.sin(state.gameTime * (isOverdrive ? 0.052 : 0.025)) * (isOverdrive ? 3.2 : 1.5);

          // Summon 2 shield protector drones at 75% HP
          if (enemy.hp <= enemy.maxHp * 0.75 && !(enemy as any).hasSpawnedDrones) {
            (enemy as any).hasSpawnedDrones = true;
            addEventLogRef.current("🛡️ BARRIERA DRONI DEL COLOSSO ATTIVA! 🛡️", "purple");
            for (let i = 0; i < 2; i++) {
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x + (i === 0 ? -60 : 60),
                y: enemy.y + 40,
                vx: i === 0 ? -1.2 : 1.2,
                speed: 1.8,
                size: 16,
                hp: 4,
                maxHp: 4,
                color: '#ec4899', // hot pink
                isTracking: true,
                type: 'drone'
              } as any);
            }
          }

          // Shoots smaller, fast debris projectiles downward towards the player
          const bossLastShot = (enemy as any).lastShotTime || 0;
          const cooldown = isOverdrive ? 700 : 1400; // Overdrive speeds up firing rate
          
          if (now - bossLastShot > cooldown) {
            (enemy as any).lastShotTime = now;
            
            if (isOverdrive) {
              // Overdrive: 3-way spread fire!
              const angles = [-0.28, 0, 0.28];
              angles.forEach(angle => {
                state.enemies.push({
                  id: Math.random().toString(36).substring(2, 9),
                  x: enemy.x,
                  y: enemy.y + enemy.size,
                  vx: ((state.player.x - enemy.x) / 75) + Math.sin(angle) * 2.2,
                  speed: 4.8,
                  size: 10,
                  hp: 1,
                  maxHp: 1,
                  color: '#ef4444', // Red-hot overdrive laser
                  isTracking: false,
                  type: 'debris'
                } as any);
              });
              audio.playLaser();
            } else {
              // Standard boss fire
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x,
                y: enemy.y + enemy.size,
                vx: (state.player.x - enemy.x) / 100, // drift towards player
                speed: 4.2,
                size: 10,
                hp: 1,
                maxHp: 1,
                color: '#a855f7', // Violet
                isTracking: false,
                type: 'debris'
              } as any);
              audio.playLaser();
            }
          }
        }

        // Daily Boss custom behaviors
        if (enemy.type === 'daily_boss') {
          const patternType = (enemy as any).patternType || 'colossus';
          const isPhase2 = enemy.hp <= enemy.maxHp / 2;

          // Standard enter and hover logic
          if (enemy.y < 120) {
            enemy.speed = 0.8;
          } else {
            enemy.speed = 0; // stop moving down
          }

          // 1. MOVEMENT PATTERNS
          if (patternType === 'serpent') {
            enemy.vx = Math.sin(state.gameTime * 0.08) * (isPhase2 ? 4.5 : 3.0);
          } else if (patternType === 'quantum_crusher') {
            if (state.gameTime % 120 === 0) {
              const targetX = Math.random() * (state.dimensions.width - 100) + 50;
              createSparks(state, enemy.x, enemy.y, 15, enemy.color);
              enemy.x = targetX;
              createSparks(state, enemy.x, enemy.y, 15, '#ffffff');
              audio.playPowerup();
            }
            enemy.vx = 0;
          } else if (patternType === 'plasma_core') {
            enemy.vx = Math.sin(state.gameTime * 0.02) * 0.8;
          } else if (patternType === 'solar_leviathan') {
            enemy.vx = Math.sin(state.gameTime * 0.015) * 1.2;
          } else if (patternType === 'abyss_titan') {
            enemy.vx = Math.sin(state.gameTime * 0.01) * 0.8;
          } else if (patternType === 'drone_summoner') {
            enemy.vx = Math.sin(state.gameTime * 0.03) * 1.8;
          } else {
            enemy.vx = Math.sin(state.gameTime * 0.03) * 1.5;
          }

          // 2. SHOOTING PATTERNS
          const bossLastShot = (enemy as any).lastShotTime || 0;
          const cooldown = isPhase2 ? 800 : 1600;
          
          if (now - bossLastShot > cooldown) {
            (enemy as any).lastShotTime = now;
            
            if (patternType === 'colossus') {
              const spreads = isPhase2 ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.3, 0, 0.3];
              spreads.forEach(angle => {
                state.enemies.push({
                  id: Math.random().toString(36).substring(2, 9),
                  x: enemy.x,
                  y: enemy.y + enemy.size * 0.5,
                  vx: Math.sin(angle) * 3.5,
                  speed: 3.5,
                  size: 8,
                  hp: 1,
                  maxHp: 1,
                  color: '#a855f7',
                  isTracking: false,
                  type: 'boss_projectile'
                } as any);
              });
              audio.playLaser();
            } else if (patternType === 'serpent') {
              for (let i = 0; i < (isPhase2 ? 3 : 2); i++) {
                state.enemies.push({
                  id: Math.random().toString(36).substring(2, 9),
                  x: enemy.x + (Math.random() * 20 - 10),
                  y: enemy.y + enemy.size * 0.5,
                  vx: (Math.random() - 0.5) * 1.5,
                  speed: 4.0,
                  size: 6,
                  hp: 1,
                  maxHp: 1,
                  color: '#10b981',
                  isTracking: false,
                  type: 'boss_projectile'
                } as any);
              }
              audio.playLaser();
            } else if (patternType === 'drone_summoner') {
              if (!(enemy as any).hasSpawnedDrones) {
                (enemy as any).hasSpawnedDrones = true;
                addEventLogRef.current("🛡️ BARRIERA DRONI ATTIVA! 🛡️", "purple");
                for (let i = 0; i < 3; i++) {
                  state.enemies.push({
                    id: Math.random().toString(36).substring(2, 9),
                    x: enemy.x + (i === 0 ? -70 : i === 1 ? 70 : 0),
                    y: enemy.y + 40,
                    vx: i === 0 ? -1.5 : i === 1 ? 1.5 : 0,
                    speed: 1.5,
                    size: 14,
                    hp: 5,
                    maxHp: 5,
                    color: '#22d3ee',
                    isTracking: true,
                    type: 'drone'
                  } as any);
                }
              }
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x,
                y: enemy.y + enemy.size * 0.5,
                vx: (state.player.x - enemy.x) / 60,
                speed: 4.5,
                size: 7,
                hp: 1,
                maxHp: 1,
                color: '#22d3ee',
                isTracking: false,
                type: 'boss_projectile'
              } as any);
              audio.playLaser();
            } else if (patternType === 'plasma_core') {
              const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
              angles.forEach(angle => {
                state.enemies.push({
                  id: Math.random().toString(36).substring(2, 9),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 3.0,
                  speed: Math.sin(angle) * 3.0,
                  size: 7,
                  hp: 1,
                  maxHp: 1,
                  color: '#eab308',
                  isTracking: false,
                  type: 'boss_projectile'
                } as any);
              });
              audio.playLaser();
            } else if (patternType === 'quantum_crusher') {
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x,
                y: enemy.y + enemy.size * 0.5,
                vx: (state.player.x - enemy.x) / 80,
                speed: 3.5,
                size: 8,
                hp: 1,
                maxHp: 1,
                color: '#ec4899',
                isTracking: true,
                type: 'boss_projectile'
              } as any);
              audio.playLaser();
            } else if (patternType === 'solar_leviathan') {
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x,
                y: enemy.y + enemy.size * 0.5,
                vx: (Math.random() - 0.5) * 3.0,
                speed: 5.0,
                size: 10,
                hp: 1,
                maxHp: 1,
                color: '#f97316',
                isTracking: false,
                type: 'boss_projectile'
              } as any);
              audio.playLaser();

              if (Math.random() < 0.25 && !state.activeHazard) {
                const ly = Math.random() * (state.dimensions.height - 250) + 120;
                state.activeHazard = { type: 'solar', y: ly, timer: 45 };
                setHazardWarning("FLARE SOLARE DEL LEVIATHAN! 🔥");
              }
            } else if (patternType === 'abyss_titan') {
              state.enemies.push({
                id: Math.random().toString(36).substring(2, 9),
                x: enemy.x,
                y: enemy.y + enemy.size * 0.5,
                vx: (state.player.x - enemy.x) / 120,
                speed: 2.2,
                size: 16,
                hp: 1,
                maxHp: 1,
                color: '#3b82f6',
                isTracking: false,
                type: 'gravity_well'
              } as any);
              audio.playLaser();
            }
          }
        }

        // Bounce off side walls
        if (enemy.x - enemy.size < 0) {
          enemy.x = enemy.size;
          enemy.vx = -enemy.vx * 0.8;
        } else if (enemy.x + enemy.size > state.dimensions.width) {
          enemy.x = state.dimensions.width - enemy.size;
          enemy.vx = -enemy.vx * 0.8;
        }

        // Collision check with player bullets
        if (enemy.type !== 'gravity_well') {
          state.bullets.forEach((bullet, bIdx) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < enemy.size + bullet.radius) {
              // Remove bullet
              state.bullets.splice(bIdx, 1);
              // Spawn damage sparks
              createSparks(state, bullet.x, bullet.y, 4, '#ef4444');

              let laserDmg = (upgradeLevels.laser_damage || 1) * (todayEvent?.modifiers?.playerDamageMult || 1);
              if (spaceWeather?.id === 'weather_4') {
                laserDmg *= 2; // Solar flare double damage!
              }
              enemy.hp -= laserDmg;
            if (enemy.hp <= 0) {
              // Destroyed meteor!
              audio.playExplosion();
              
             const isBoss = enemy.type === 'mini_boss' || enemy.type === 'daily_boss';
             const isBigMeteor = enemy.maxHp >= 4 || isBoss;

              // Spectacular custom particle bursts for massive arcade juice
              if (isBoss) {
                // Double concentric rings + extra heavy spark spray
                GameEngine.createExplosionRing(state.particles, enemy.x, enemy.y, enemy.color);
                GameEngine.createExplosionRing(state.particles, enemy.x, enemy.y, '#ffffff');
                createSparks(state, enemy.x, enemy.y, 40, enemy.color);
                createSparks(state, enemy.x, enemy.y, 20, '#ffffff');
              } else if (isBigMeteor) {
                // Radial blast ring + spark spray
                GameEngine.createExplosionRing(state.particles, enemy.x, enemy.y, enemy.color);
                createSparks(state, enemy.x, enemy.y, 25, enemy.color);
              } else {
                createSparks(state, enemy.x, enemy.y, 10, enemy.color);
              }
              
              // Implement a tactile 'hitstop' freeze frame (combining frames and synchronous micro-sleep)
              if (isBoss) {
                state.hitstopFrames = 10;
                const start = performance.now();
                while (performance.now() - start < 80) {} // 80ms satisfying tactile freeze
              } else if (isBigMeteor) {
                state.hitstopFrames = 6;
                const start = performance.now();
                while (performance.now() - start < 45) {} // 45ms solid crisp impact freeze
              } else {
                state.hitstopFrames = 1;
              }

              // Splitter meteorite debris split
              if ((enemy as any).type === 'splitter') {
                const debris = EnemySystem.splitMeteor(enemy as any);
                debris.forEach(d => state.enemies.push(d as any));
              }

              state.enemies.splice(eIdx, 1);
              
              // Score awards (Chaos mode offers triple points! Combo multiplies score!)
              let scored = 0;
              if (enemy.type === 'mini_boss' || enemy.type === 'daily_boss') {
                scored = chaosMode ? 1000 : 500;
                state.bossKillsCount++;
                if (enemy.type === 'daily_boss') {
                  setTimeout(() => {
                    handleDailyBossVictory();
                  }, 1200);
                }
              } else {
                const scoreWeight = enemy.maxHp * 15;
                scored = chaosMode ? scoreWeight * 3 : scoreWeight;
              }
              if (dailyRunModifier === 'chaos_lite') {
                scored = Math.round(scored * 1.3);
              }
              
              // Apply dynamic combo multiplier up to x5
              const comboMultiplier = Math.min(5, Math.floor((state.combo.count || 0) / 3) + 1);
              scored = scored * comboMultiplier;

              // Charge Ultimate Weapon
              state.ultimateCharge = Math.min(100, (state.ultimateCharge || 0) + 4);

              state.stats.score += scored;
              setScore(state.stats.score);
              state.stats.enemiesDestroyed++;

              // Camera shake on meteorite destruction (larger for big ones)
              GameEngine.triggerShake(state.shake, isBoss ? 24 : (isBigMeteor ? 12 : 5), isBoss ? 28 : (isBigMeteor ? 14 : 7));

              // Combo and Event Log
              const nowTime = Date.now();
              if (nowTime - state.combo.lastKillTime < 2200) {
                state.combo.count++;
              } else {
                state.combo.count = 1;
              }
              state.combo.lastKillTime = nowTime;

              const label = isBoss ? "COLOSSO ELIMINATO" : (isBigMeteor ? "Asteroide Gigante" : (enemy.isTracking ? "Asteroide Cacciatore" : "Meteorite"));
              const logColor = isBoss ? "yellow" : (isBigMeteor ? "rose" : (enemy.isTracking ? "purple" : "zinc"));

              if (state.combo.count >= 2) {
                addEventLogRef.current(`${label}! Combo x${state.combo.count} 🔥`, logColor);
              } else {
                addEventLogRef.current(`${label}! +${scored}`, logColor);
              }

              // Mini-boss rich drop: 5 to 7 gems in a burst!
              if (enemy.type === 'mini_boss') {
                for (let i = 0; i < 6; i++) {
                  state.collectibles.push({
                    x: enemy.x + (Math.random() * 40 - 20),
                    y: enemy.y + (Math.random() * 40 - 20),
                    type: 'gem',
                    size: 10,
                    angle: Math.random() * Math.PI
                  });
                }
              } else if (Math.random() < 0.45) {
                // Occasional gems release from broken meteors
                state.collectibles.push({
                  x: enemy.x,
                  y: enemy.y,
                  type: 'gem',
                  size: 10,
                  angle: 0
                });
              }
            }
          }
        });
      }

        // Out of screen delete
        if (enemy.y > state.dimensions.height + 40) {
          state.enemies.splice(eIdx, 1);
        }

        // Near Miss detection (within 38px of player boundary, but not colliding)
        const shipDist = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
        const collisionThreshold = enemy.size + 15;
        const nearMissThreshold = enemy.size + 38;
        if (shipDist < nearMissThreshold && shipDist >= collisionThreshold) {
          if (!(enemy as any).nearMissTriggered) {
            (enemy as any).nearMissTriggered = true;
            state.nearMissesCount++;
            
            // Trigger Near Miss!
            audio.playClick();
            createSparks(state, (state.player.x + enemy.x) / 2, (state.player.y + enemy.y) / 2, 8, '#22d3ee'); // cyan sparks
            
            // Charge Ultimate (+15% for risky near-misses)
            const oldCharge = state.ultimateCharge || 0;
            state.ultimateCharge = Math.min(100, oldCharge + 15);
            if (state.ultimateCharge >= 100 && oldCharge < 100) {
              audio.playPowerup();
            }

            const points = chaosMode ? 75 : 25;
            state.stats.score += points;
            setScore(state.stats.score);
            addEventLogRef.current(`SCHIVATA STELLARE +${points}! ⚡`, "blue");
          }
        }

        // Damage Player Collision
        if (shipDist < collisionThreshold) {
          if (!state.player.isInvulnerable) {
            audio.playExplosion();
            createSparks(state, state.player.x, state.player.y, 25, '#f43f5e');
            
            // Substantial camera shake on player damage
            GameEngine.triggerShake(state.shake, 18, 24);

            // Log event
            addEventLogRef.current("Scafo Colpito! ⚠️ VITE -1", "rose");

            // Subtract health
            const newHp = Math.max(0, state.player.hp - 1);
            state.player.hp = newHp;
            setHealth(newHp);
            state.enemies.splice(eIdx, 1);

            if (newHp <= 0) {
              handleCrash();
            } else {
              // Temp blinking invulnerability
              state.player.isInvulnerable = true;
              state.player.invulnTimer = 90; // 1.5 seconds invuln
            }
          } else {
            // Bounced off shield!
            audio.playExplosion();
            createSparks(state, enemy.x, enemy.y, 12, '#60a5fa');
            state.enemies.splice(eIdx, 1);
            state.stats.score += 5;
            setScore(state.stats.score);

            // Minor camera shake on shield bounce
            GameEngine.triggerShake(state.shake, 5, 8);

            addEventLogRef.current("Impatto Assorbito dallo Scudo! 🛡️", "blue");
          }
        }
      });

      // 6. UPDATE COLLECTIBLES
      state.collectibles.forEach((item, cIdx) => {
        // Slow falling speed
        item.y += chaosMode ? 3 : 2;
        item.angle += 0.05;

        // Magnet attraction pull
        const magnetLvl = upgradeLevels.magnet_range || 1;
        const magnetTimer = Math.max(0, Math.round((state.powerups.magnetUntil - now) / 1000));
        
        // Passive magnet range vs Active magnet range
        const pullRadius = magnetTimer > 0 ? (150 + 25 * magnetLvl) : (magnetLvl > 1 ? 35 * (magnetLvl - 1) : 0);
        
        if (pullRadius > 0) {
          const distToShip = Math.hypot(state.player.x - item.x, state.player.y - item.y);
          if (distToShip < pullRadius) {
            // Pull towards player
            const dx = state.player.x - item.x;
            const dy = state.player.y - item.y;
            // Faster pull speed if active powerup
            const pullSpeed = magnetTimer > 0 ? 6.5 : 4.0;
            item.x += (dx / distToShip) * pullSpeed;
            item.y += (dy / distToShip) * pullSpeed;
          }
        }

        // Collision Check with player
        const dist = Math.hypot(state.player.x - item.x, state.player.y - item.y);
        if (dist < item.size + 18) {
          state.collectibles.splice(cIdx, 1);
          audio.playCollect();

          if (item.type === 'gem') {
            // Gem multipliers based on Premium status and Daily Run modifiers
            let count = 1;
            if (isPremium) count = 2;
            if (dailyRunModifier === 'neon_jackpot') {
              count = count * 2;
            } else if (dailyRunModifier === 'gem_rush') {
              count = isPremium ? 3 : 2; // +50% satisfying boost
            }

            // Neon Live System event gems multiplier!
            if (todayEvent?.modifiers?.gemsMultiplier) {
              count = Math.ceil(count * todayEvent.modifiers.gemsMultiplier);
            }

            state.stats.gemsCollected += count;
            setGemsCollected(state.stats.gemsCollected);
            createSparks(state, item.x, item.y, 6, '#ec4899');

            if (dailyRunModifier === 'neon_jackpot') {
              addEventLogRef.current(`Jackpot! Gemme x${count}! 💰💎`, "yellow");
            } else if (dailyRunModifier === 'gem_rush') {
              addEventLogRef.current(`Gem Rush! Gemme +${count}! ⚡💎`, "pink");
            } else if (isPremium) {
              addEventLogRef.current("Bonus Premium: Gemme raddoppiate! 💎", "pink");
            } else if (Math.random() < 0.2) {
              addEventLogRef.current("Gemma Raccolta! +1 💎", "pink");
            }
          } else if ((item as any).type === 'fragment') {
            const fShipId = (item as any).shipId || 'premium_golden';
            const shipName = SHIPS.find(s => s.id === fShipId)?.name || 'Astronave Speciale';
            state.collectedFragmentShipId = fShipId;
            createSparks(state, item.x, item.y, 16, '#f59e0b');
            addEventLogRef.current(`FRAMMENTO ${shipName.toUpperCase()} ACQUISITO! 🛸✨`, "yellow");
          } else {
            // Activate boost
            audio.playPowerup();
            const shieldLvl = upgradeLevels.shield_duration || 1;
            const boostLength = 15000 * (1 + 0.15 * (shieldLvl - 1)); // 15 seconds + 15% per level
            
            if (item.type === 'shield') {
              state.powerups.shieldUntil = now + boostLength;
              createSparks(state, item.x, item.y, 12, '#3b82f6');
              addEventLogRef.current("Scudo Energetico Attivato! 🛡️", "blue");
            } else if (item.type === 'fire') {
              state.powerups.fireRateUntil = now + boostLength;
              createSparks(state, item.x, item.y, 12, '#eab308');
              addEventLogRef.current("Iper-Cadenza di Fuoco Attiva! ⚡", "yellow");
            } else if (item.type === 'magnet') {
              state.powerups.magnetUntil = now + boostLength;
              createSparks(state, item.x, item.y, 12, '#10b981');
              addEventLogRef.current("Magnete Attivato! 🧲", "emerald");
            }
          }
        }

        // Delete if off bottom
        if (item.y > state.dimensions.height + 20) {
          state.collectibles.splice(cIdx, 1);
        }
      });

      // 7. UPDATE PARTICLES (Sparks / Trails)
      state.particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay !== undefined ? p.decay : 0.02;
        if (p.alpha <= 0) {
          state.particles.splice(pIdx, 1);
        }
      });

      // Spawn faint engine exhaust fire trails
      if (state.gameTime % 2 === 0) {
        state.particles.push({
          x: state.player.x + (Math.random() * 10 - 5),
          y: state.player.y + 20,
          vx: Math.random() * 0.8 - 0.4,
          vy: Math.random() * 2 + 3,
          size: Math.random() * 3 + 1,
          alpha: 0.8,
          color: state.player.isInvulnerable ? '#60a5fa' : '#f97316' // Blue tail if shield active, otherwise orange
        });
      }

      // --- RENDERING PHASE ---
      // Render Player Bullets
      state.bullets.forEach(b => {
        ctx.fillStyle = state.player.bulletColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Laser tail glow
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(b.x - b.radius / 2, b.y, b.radius, b.radius * 3);
      });

      // Draw Space Environmental Hazards warnings & strikes on Canvas
      if (state.activeHazard) {
        const haz = state.activeHazard;
        const width = state.dimensions.width;
        const height = state.dimensions.height;
        
        ctx.save();
        if (haz.type === 'lightning') {
          const lx = haz.x || 0;
          if (haz.strikeFrames && haz.strikeFrames > 0) {
            // Thick vertical strike beam
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#06b6d4';
            ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
            ctx.fillRect(lx - 16, 0, 32, height);
            
            // White hot core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lx - 5, 0, 10, height);
          } else {
            // Warning dashed line & pulsing glow
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + 0.35 * Math.sin(state.gameTime * 0.16)})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, height);
            ctx.stroke();
            
            // Glow overlay
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(lx - 15, 0, 30, height);
            
            // Warning label
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText("ATTENZIONE FULMINE! ⚡", lx, 85 + Math.sin(state.gameTime * 0.1) * 4);
          }
        } else if (haz.type === 'solar') {
          const ly = haz.y || 0;
          if (haz.strikeFrames && haz.strikeFrames > 0) {
            // Thick horizontal flame beam
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#f59e0b';
            ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
            ctx.fillRect(0, ly - 16, width, 32);
            
            // White hot core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, ly - 5, width, 10);
          } else {
            // Warning dashed line & pulsing glow
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + 0.35 * Math.sin(state.gameTime * 0.16)})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(0, ly);
            ctx.lineTo(width, ly);
            ctx.stroke();
            
            // Glow overlay
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(0, ly - 15, width, 30);
            
            // Warning label
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText("ATTENZIONE FIAMMA! 🔥", 20, ly - 10);
          }
        }
        ctx.restore();
      }

      // Render Enemies
      state.enemies.forEach(enemy => {
        // Mini-boss custom rendering (Wings and Engine details)
        if (enemy.type === 'mini_boss') {
          const isPhase2 = enemy.hp <= enemy.maxHp / 2;
          ctx.save();
          ctx.shadowBlur = 18;
          ctx.shadowColor = isPhase2 ? '#ef4444' : '#a855f7';
          ctx.fillStyle = isPhase2 ? '#ef4444' : '#a855f7';
          ctx.beginPath();
          // Draw wing plates
          ctx.moveTo(enemy.x - enemy.size, enemy.y - enemy.size / 2);
          ctx.lineTo(enemy.x - enemy.size * 1.6, enemy.y + enemy.size / 2);
          ctx.lineTo(enemy.x + enemy.size * 1.6, enemy.y + enemy.size / 2);
          ctx.lineTo(enemy.x + enemy.size, enemy.y - enemy.size / 2);
          ctx.closePath();
          ctx.fill();
          
          // Core body
          ctx.fillStyle = '#0f172a'; // Deep slate core
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Reactor chamber cockpit
          ctx.fillStyle = isPhase2 ? '#fca5a5' : '#e9d5ff';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y + enemy.size * 0.2, enemy.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw HP ratio text inside the boss
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 12px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, enemy.x, enemy.y - enemy.size * 0.15);
          ctx.restore();
          return;
        }

        // Daily Boss Rendering
        if (enemy.type === 'daily_boss') {
          const patternType = (enemy as any).patternType || 'colossus';
          const isPhase2 = enemy.hp <= enemy.maxHp / 2;
          ctx.save();
          
          ctx.shadowBlur = 24;
          ctx.shadowColor = enemy.color;
          
          if (patternType === 'serpent') {
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();
            
            for (let i = 1; i <= 4; i++) {
              ctx.fillStyle = `rgba(16, 185, 129, ${0.8 - i * 0.15})`;
              const segX = enemy.x - Math.sin(state.gameTime * 0.08 - i * 0.4) * (20 + i * 2);
              const segY = enemy.y - i * 22;
              ctx.beginPath();
              ctx.arc(segX, segY, enemy.size * (1 - i * 0.15), 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (patternType === 'quantum_crusher') {
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2 + (state.gameTime * 0.04);
              const r = enemy.size * (i % 2 === 0 ? 1.5 : 0.8);
              ctx.lineTo(enemy.x + Math.cos(angle) * r, enemy.y + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
          } else if (patternType === 'plasma_core') {
            const pulseSize = enemy.size * (1 + 0.15 * Math.sin(state.gameTime * 0.1));
            
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulseSize * 1.4, state.gameTime * 0.02, state.gameTime * 0.02 + Math.PI * 1.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulseSize * 1.8, -state.gameTime * 0.03, -state.gameTime * 0.03 + Math.PI * 1.2);
            ctx.stroke();

            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulseSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else if (patternType === 'solar_leviathan') {
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(enemy.x - enemy.size * 2, enemy.y);
            ctx.lineTo(enemy.x - enemy.size, enemy.y - enemy.size);
            ctx.lineTo(enemy.x + enemy.size, enemy.y - enemy.size);
            ctx.lineTo(enemy.x + enemy.size * 2, enemy.y);
            ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
            ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size * 1.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else if (patternType === 'abyss_titan') {
            const pulse = enemy.size * (1 + 0.1 * Math.sin(state.gameTime * 0.05));
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulse * 1.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 4;
            for (let i = 0; i < 4; i++) {
              const startAngle = (i / 4) * Math.PI * 2 + (state.gameTime * 0.02);
              ctx.beginPath();
              ctx.arc(enemy.x, enemy.y, pulse * 0.9, startAngle, startAngle + Math.PI / 2);
              ctx.stroke();
            }

            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulse * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(enemy.x - enemy.size * 1.5, enemy.y - enemy.size * 0.3);
            ctx.lineTo(enemy.x - enemy.size * 2.2, enemy.y + enemy.size * 0.4);
            ctx.lineTo(enemy.x + enemy.size * 2.2, enemy.y + enemy.size * 0.4);
            ctx.lineTo(enemy.x - enemy.size * 1.5, enemy.y - enemy.size * 0.3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size * 1.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isPhase2 ? '#ef4444' : '#e9d5ff';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 12px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, enemy.x, enemy.y);
          ctx.restore();
          return;
        }

        // Render boss projectiles
        if (enemy.type === 'boss_projectile') {
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = enemy.color;
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        // Render gravity well
        if (enemy.type === 'gravity_well') {
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#3b82f6';
          
          const radius = enemy.size * (1 + 0.25 * Math.sin(state.gameTime * 0.15));
          const grad = ctx.createRadialGradient(enemy.x, enemy.y, 2, enemy.x, enemy.y, radius);
          grad.addColorStop(0, '#09090b');
          grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
          grad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        // Shield guard drones rendering
        if (enemy.type === 'drone') {
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ec4899';
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size - 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 10px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🛡️ ${enemy.hp}`, enemy.x, enemy.y);
          ctx.restore();
          return;
        }

        // Standard meteorite drawing
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // Add details/crater look to meteorites
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(enemy.x - enemy.size * 0.3, enemy.y - enemy.size * 0.2, enemy.size * 0.25, 0, Math.PI * 2);
        ctx.arc(enemy.x + enemy.size * 0.3, enemy.y + enemy.size * 0.3, enemy.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // White border core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Render dynamic numerical "meteorite health" counter in the center
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(10, Math.min(15, enemy.size * 0.65));
        ctx.font = `bold ${fontSize}px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 4;
        ctx.fillText(enemy.hp.toString(), enemy.x, enemy.y);
        ctx.shadowBlur = 0; // reset shadow configuration
      });

      // Render Collectibles
      state.collectibles.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.angle);

        if (item.type === 'gem') {
          // Hexagon Diamond structure
          ctx.fillStyle = '#ec4899'; // Pink Gem
          ctx.beginPath();
          ctx.moveTo(0, -item.size);
          ctx.lineTo(item.size * 0.8, -item.size * 0.3);
          ctx.lineTo(item.size * 0.5, item.size * 0.8);
          ctx.lineTo(-item.size * 0.5, item.size * 0.8);
          ctx.lineTo(-item.size * 0.8, -item.size * 0.3);
          ctx.closePath();
          ctx.fill();

          // Sparkle line
          ctx.strokeStyle = '#fbcfe8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Shield, Fire rate or Magnet icons
          ctx.beginPath();
          ctx.arc(0, 0, item.size, 0, Math.PI * 2);
          ctx.fillStyle = item.type === 'shield' ? 'rgba(59, 130, 246, 0.3)' : 
                          item.type === 'fire' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)';
          ctx.fill();

          ctx.strokeStyle = item.type === 'shield' ? '#3b82f6' : 
                            item.type === 'fire' ? '#eab308' : '#10b981';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Letter/symbol in center
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            item.type === 'shield' ? 'S' : item.type === 'fire' ? 'F' : 'M',
            0, 0
          );
        }
        ctx.restore();
      });

      // Render Particles
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0; // reset alpha

      // Render Player Ship with blinking effect when invulnerable
      if (!state.player.isInvulnerable || state.gameTime % 4 < 2) {
        drawShip(ctx, state.player.x, state.player.y, state.player.color, state.player.secondaryColor);
      }

      // Draw active shield sphere around player if shield timer active
      if (shieldTimer > 0) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y, 32, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
        ctx.fill();
      }

      ctx.restore();
      Math.random = originalRandom;
      animationId = requestAnimationFrame(gameLoop);
    };

    // Trigger frame animations
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isPaused, isGameOver, health, chaosMode, isDailyRun, dailyRunModifier]);

  // Handle ship crashing game over
  const handleCrash = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setSurvivalSeconds(stateRef.current.gameTime / 60);
    audio.playGameOver();
  };

  const handleDailyBossVictory = () => {
    setIsPlaying(false);
    setIsVictory(true);
    audio.playPowerup();
    GameEngine.triggerShake(stateRef.current.shake, 35, 45);
    addEventLogRef.current("🎉 BOSS GIORNALIERO SCONFITTO! 🎉", "emerald");

    const rewards = DailyBossSystem.getTodayBossRewards();
    setVictoryRewards(rewards);
  };

  const claimVictory = () => {
    audio.playClick();
    setIsPlaying(false);
    setIsVictory(false);
    setIsPaused(false);
    onGameEnd({
      ...stateRef.current.stats,
      nearMisses: stateRef.current.nearMissesCount,
      bossKills: stateRef.current.bossKillsCount,
      collectedFragment: stateRef.current.collectedFragmentShipId || undefined,
      dailyBossDefeated: true
    });
  };

  const finishRun = () => {
    audio.playClick();
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    onGameEnd({
      ...stateRef.current.stats,
      nearMisses: stateRef.current.nearMissesCount,
      bossKills: stateRef.current.bossKillsCount,
      collectedFragment: stateRef.current.collectedFragmentShipId || undefined
    });
  };

  const requestExitRun = () => {
    audio.playClick();
    setIsPaused(true);
    setShowExitConfirm(true);
  };

  const cancelExitRun = () => {
    audio.playClick();
    setShowExitConfirm(false);
    setIsPaused(false);
  };

  const confirmExitRun = () => {
    audio.playClick();
    const snapshot = isPremium ? createRunSnapshot() : undefined;
    setShowExitConfirm(false);
    setIsPlaying(false);
    setIsPaused(false);
    onExitRun(snapshot);
  };

  // Helper particle emitter
  const createSparks = (state: any, x: number, y: number, count: number, color: string) => {
    GameEngine.createSparks(state.particles, x, y, count, color);
  };

  // Draw Spacecraft Vector shape on Canvas
  const drawShip = (ctx: CanvasRenderingContext2D, x: number, y: number, primary: string, secondary: string) => {
    ctx.save();
    ctx.translate(x, y);

    // Thruster fire glow
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-10, 15);
    ctx.lineTo(0, 28);
    ctx.lineTo(10, 15);
    ctx.fill();

    // Main fuselage wings
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(0, -22); // Nose
    ctx.lineTo(22, 16);  // Right wing tip
    ctx.lineTo(8, 10);   // Right inner body
    ctx.lineTo(-8, 10);  // Left inner body
    ctx.lineTo(-22, 16); // Left wing tip
    ctx.closePath();
    ctx.fill();

    // Canopy glass / Secondary accents
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 4);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    // Wingtip micro-lasers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-22, 10, 2, 4);
    ctx.fillRect(20, 10, 2, 4);

    ctx.restore();
  };

  return (
    <div className="w-full h-full relative bg-black select-none overflow-hidden">
      
      {/* Mobile-first HUD overlay */}
      <div
        className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 px-2 pb-2 bg-gradient-to-b from-black/85 via-black/55 to-transparent text-sm pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      >
        <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
          <button
            type="button"
            onClick={requestExitRun}
            className="w-9 h-9 shrink-0 rounded-full border border-white/15 bg-black/55 backdrop-blur flex items-center justify-center text-white active:scale-95"
            aria-label="Torna alla Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.max(0, shipConfig.health) }).map((_, i) => (
              <Heart 
                key={i} 
                className={`w-5 h-5 ${i < health ? 'text-red-500 fill-red-500' : 'text-zinc-700'}`} 
              />
            ))}
          </div>

          {chaosMode && (
            <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded animate-pulse uppercase tracking-wider">
              CHAOS MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 pointer-events-none">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-gray-500 block">ZONA</span>
            <span className={`text-xs font-black uppercase tracking-wider ${
              currentZone === 'Quantum Abyss' ? 'text-emerald-400' :
              currentZone === 'Solar Wreck Zone' ? 'text-yellow-400' :
              currentZone === 'Violet Debris Field' ? 'text-purple-400' : 'text-blue-400'
            }`}>{currentZone}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 block">DISTANZA</span>
            <span className="text-base sm:text-lg font-black text-white font-mono">{distance}m</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 block">PUNTI</span>
            <span className="text-base sm:text-lg font-black text-blue-400 font-mono">{score}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 block">GEMME</span>
            <span className="text-base sm:text-lg font-black text-pink-400 font-mono flex items-center gap-1">
              <Gem className="w-4 h-4" /> {gemsCollected}
            </span>
          </div>
        </div>
      </div>

      {/* Full viewport gameplay stage */}
      <div 
        id="game-stage" 
        ref={containerRef} 
        className={`absolute inset-0 w-full h-full overflow-hidden transition-all duration-1000 ${
          currentZone === 'Quantum Abyss' ? 'bg-[#020b06]' :
          currentZone === 'Solar Wreck Zone' ? 'bg-[#120a03]' :
          currentZone === 'Violet Debris Field' ? 'bg-[#0c0714]' :
          'bg-black'
        }`}
      >
        
        {/* HTML5 Canvas engine */}
        <canvas 
          id="arcade-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 block w-full h-full touch-none"
        />

        {/* Big Zone Transition Notification Alert Overlay */}
        {zoneTransition && (
          <div className="absolute inset-x-0 top-1/4 flex flex-col items-center justify-center pointer-events-none z-30 select-none px-4">
            <div className={`px-6 py-4 rounded-2xl bg-zinc-950/95 border backdrop-blur-md shadow-2xl flex flex-col items-center gap-1.5 text-center transition-all animate-[pulse_1.5s_infinite] ${
              zoneTransition.color === 'emerald' ? 'border-emerald-500/50 shadow-emerald-500/20' :
              zoneTransition.color === 'yellow' ? 'border-yellow-500/50 shadow-yellow-500/20' :
              zoneTransition.color === 'purple' ? 'border-purple-500/50 shadow-purple-500/20' :
              'border-blue-500/50 shadow-blue-500/20'
            }`}>
              <span className="text-[9px] tracking-[0.25em] font-extrabold text-zinc-500 uppercase">TRANSIZIONE SPAZIALE</span>
              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-wider ${
                zoneTransition.color === 'emerald' ? 'text-emerald-400' :
                zoneTransition.color === 'yellow' ? 'text-yellow-400' :
                zoneTransition.color === 'purple' ? 'text-purple-400' :
                'text-blue-400'
              }`}>
                {zoneTransition.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                <span>Maggiore densità meteoritica rilevata! ⚠️</span>
              </div>
            </div>
          </div>
        )}

        {/* Timers list for active powerups */}
        <div className="absolute top-16 left-3 space-y-1.5 pointer-events-none z-20">
          {shieldTimeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/70 border border-blue-500/40 text-blue-300 text-xs font-bold animate-pulse">
              <Shield className="w-3.5 h-3.5" /> Scudo: {shieldTimeLeft}s
            </div>
          )}
          {fireTimeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-950/70 border border-yellow-500/40 text-yellow-300 text-xs font-bold animate-pulse">
              <Zap className="w-3.5 h-3.5" /> Cadenza+: {fireTimeLeft}s
            </div>
          )}
          {magnetTimeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Calamita: {magnetTimeLeft}s
            </div>
          )}
        </div>

        {/* Epic Boss Health Bar */}
        {activeBoss && isPlaying && !isGameOver && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[85%] max-w-xs sm:max-w-sm z-20 flex flex-col gap-1 items-center bg-zinc-950/90 border border-purple-500/30 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between w-full text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest">
              <span>⚠️ {isDailyBossRun ? `BOSS: ${DailyBossSystem.getTodayBoss().name.toUpperCase()}` : 'COLOSSO DELLO SPAZIO'}</span>
              <span>{activeBoss.hp} / {activeBoss.maxHp} HP</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-150 ${activeBoss.hp <= activeBoss.maxHp / 2 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-purple-500 shadow-[0_0_8px_#a855f7]'}`}
                style={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}
              />
            </div>
            {activeBoss.hp <= activeBoss.maxHp / 2 && (
              <span className="text-[8px] font-black text-red-500 tracking-widest uppercase animate-pulse">ATTENZIONE: OVERDRIVE ATTIVATO! 🔥</span>
            )}
          </div>
        )}

        {/* Dynamic Space Hazard Warnings Alert Overlay */}
        {hazardWarning && isPlaying && !isGameOver && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[85%] max-w-xs sm:max-w-sm z-20 pointer-events-none select-none text-center">
            <div className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/70 text-red-300 font-extrabold text-xs tracking-wide animate-pulse shadow-lg backdrop-blur-sm">
              {hazardWarning}
            </div>
          </div>
        )}

        {/* Ultimate Supernova Charge Button */}
        {isPlaying && !isGameOver && !isPaused && (
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1 select-none pointer-events-auto">
            <span className="text-[8px] text-zinc-500 font-bold tracking-wider">ARMA SPECIALE</span>
            <button
              onClick={triggerUltimate}
              disabled={ultimateCharge < 100}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                ultimateCharge >= 100 
                ? 'bg-pink-600/95 border-pink-500 text-white animate-bounce shadow-[0_0_15px_rgba(236,72,153,0.65)] hover:bg-pink-500 active:scale-95 cursor-pointer' 
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${ultimateCharge >= 100 ? 'text-yellow-300 animate-pulse' : 'text-zinc-600'}`} />
              <span>SUPERNOVA: {ultimateCharge}%</span>
            </button>
            {ultimateCharge >= 100 && (
              <span className="text-[8px] text-pink-400 font-extrabold tracking-widest animate-pulse">TOCCA PER ATTIVARE</span>
            )}
          </div>
        )}

        {/* Floating Event Log Overlay */}
        {isPlaying && !isPaused && !isGameOver && eventLogs.length > 0 && (
          <div className="absolute top-16 right-3 flex flex-col gap-1.5 items-end max-w-[250px] pointer-events-none z-10">
            {eventLogs.map((log) => {
              const bgBorderColor = 
                log.color === 'blue' ? "bg-blue-950/80 border-blue-500/40 text-blue-200" :
                log.color === 'yellow' ? "bg-yellow-950/80 border-yellow-500/40 text-yellow-200" :
                log.color === 'pink' ? "bg-pink-950/80 border-pink-500/40 text-pink-200" :
                log.color === 'emerald' ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200" :
                log.color === 'rose' ? "bg-rose-950/80 border-rose-500/40 text-rose-200 animate-pulse" :
                log.color === 'purple' ? "bg-purple-950/80 border-purple-500/40 text-purple-200" :
                "bg-zinc-900/80 border-zinc-700/40 text-zinc-300";

              return (
                <div 
                  key={log.id} 
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold shadow-lg shadow-black/40 flex items-center gap-2 backdrop-blur-sm transition-all duration-300 animate-[fadeIn_0.2s_ease-out] ${bgBorderColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{log.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* EXIT RUN CONFIRMATION */}
        {showExitConfirm && !isGameOver && !isVictory && (
          <div className="absolute inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center px-5">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-center shadow-2xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {isPremium ? <Save className="w-5 h-5 text-yellow-400" /> : <Home className="w-5 h-5 text-blue-400" />}
              </div>
              <h2 className="text-xl font-black text-white">Tornare alla Home?</h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                {isPremium
                  ? 'Neon Premium salverà questa run. Potrai riprenderla dalla Home esattamente da qui.'
                  : 'Se esci adesso, i progressi di questa run andranno persi.'}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button type="button" onClick={cancelExitRun} className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 font-bold active:scale-95">
                  Continua
                </button>
                <button
                  type="button"
                  onClick={confirmExitRun}
                  className={`py-3 rounded-xl font-black text-white active:scale-95 ${isPremium ? 'bg-yellow-600' : 'bg-rose-600'}`}
                >
                  {isPremium ? 'Salva e Home' : 'Abbandona'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAUSE SCREEN */}
        {isPaused && !showExitConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-2">Partita In Pausa</h2>
            <p className="text-gray-500 text-sm mb-6">Sistemi di volo offline temporaneamente sospesi.</p>

            <div className="space-y-3 w-full max-w-xs">
              <button 
                onClick={() => { audio.playClick(); setIsPaused(false); }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
              >
                Riprendi Volo
              </button>
              <button 
                onClick={requestExitRun}
                className="w-full py-3 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white font-bold rounded-xl transition-all"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN WITH AD REWARD OPTION */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start sm:justify-center py-8 px-4 sm:py-6 sm:px-6 text-center z-50">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 mb-2 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white mb-1">Nave Distrutta!</h2>
            <p className="text-gray-500 text-xs mb-3">Sei andato in collisione con un ostacolo spaziale.</p>

            {/* Score summary */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 mb-4">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Punti Finali</span>
                <span className="text-lg font-black text-blue-400 font-mono">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Gemme Raccolte</span>
                <span className="text-lg font-black text-pink-400 font-mono flex items-center justify-center gap-1">
                  <Gem className="w-4 h-4" /> {gemsCollected}
                </span>
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs mb-4">
              {/* Survival restriction check: min 12s */}
              {survivalSeconds < 12 ? (
                <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-400 rounded-xl leading-relaxed text-center">
                  ⚠️ Sei durato troppo poco ({Math.round(survivalSeconds)}s) per attivare un rientro d'emergenza. Ricarica i propulsori e riprova! (Min. 12s)
                </div>
              ) : (
                <>
                  {/* VIP Free Daily Revive option */}
                  {isPremium && !vipFreeReviveUsedToday ? (
                    <button 
                      onClick={() => {
                        if (onUseVipFreeRevive) onUseVipFreeRevive();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 text-xs uppercase active:scale-95"
                    >
                      👑 Rientro Gratuito VIP (1/gg)
                    </button>
                  ) : null}

                  {/* Reward video option for extra life */}
                  {!hasUsedAdExtraLife ? (
                    <button 
                      onClick={onWatchAdForExtraLife}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Tv className="w-4 h-4" /> GUARDA AD PER 1 VITA EXTRA
                    </button>
                  ) : (
                    <div className="p-2 border border-zinc-850 bg-zinc-900/30 text-[11px] text-zinc-500 rounded-lg">
                      *Rientro d'emergenza già consumato per questa partita.
                    </div>
                  )}
                </>
              )}

              <button 
                onClick={finishRun}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <RotateCcw className="w-4 h-4" /> RISULTATI E HOME
              </button>
            </div>
          </div>
        )}

        {/* DAILY BOSS VICTORY SCREEN */}
        {isVictory && victoryRewards && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start sm:justify-center py-8 px-4 sm:py-6 sm:px-6 text-center z-50 animate-[fadeIn_0.3s_ease-out]">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-2 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-wider mb-1">VITTORIA!</h2>
            <p className="text-gray-400 text-xs mb-4">Hai annientato il Daily Boss e salvato il settore!</p>

            <div className="w-full max-w-xs p-4 rounded-2xl border border-emerald-500/30 bg-zinc-950/90 shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-5 text-left space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block text-center border-b border-zinc-800 pb-1.5">RICOMPENSE OTTENUTE</span>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                  <Gem className="w-4 h-4 text-pink-500" /> Gemme Bonus:
                </span>
                <span className="text-base font-extrabold text-pink-400 font-mono">+{victoryRewards.gems} 💎</span>
              </div>

              {victoryRewards.fragmentCount > 0 && (
                <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" /> Frammenti:
                  </span>
                  <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-wide">
                    +{victoryRewards.fragmentCount} ({SHIPS.find(s => s.id === victoryRewards.fragmentShipId)?.name || 'Astronave'})
                  </span>
                </div>
              )}

              {victoryRewards.badge && (
                <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                    <Trophy className="w-4 h-4 text-emerald-400 animate-pulse" /> Badge Onorevole:
                  </span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {victoryRewards.badge}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full max-w-xs">
              <button 
                onClick={claimVictory}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer font-bold"
              >
                <Sparkles className="w-4 h-4 text-zinc-950 animate-pulse" /> Riscatta Ricompense
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
