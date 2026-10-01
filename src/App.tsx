import React, { useState, useEffect } from 'react';
import { UserState, PurchaseItem, GameStats } from './types';
import { SHIPS, STORE_PRODUCTS } from './data';
import { audio } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { ShopModal } from './components/ShopModal';
import { AdOverlay } from './components/AdOverlay';
import { EconomySystem } from './systems/EconomySystem';
import { MissionSystem, Mission } from './systems/MissionSystem';
import { DailyBossSystem } from './systems/DailyBossSystem';
import { NeonLiveOpsSystem } from './systems/NeonLiveOpsSystem';
import { AnalyticsService } from './systems/AnalyticsService';
import { BalanceConfig } from './systems/BalanceConfig';
import { EconomyMonitor } from './systems/EconomyMonitor';
import { DebugAnalyticsDashboard } from './components/DebugAnalyticsDashboard';
import { 
  Gamepad2, 
  Wrench, 
  ShoppingBag, 
  Trophy, 
  Crown, 
  ShieldAlert, 
  Gem, 
  Sparkles, 
  Tv, 
  Zap, 
  Shield, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus,
  Compass,
  Flame,
  UserCheck,
  CheckCircle2,
  X,
  Home,
  User,
  Target,
  Award
} from 'lucide-react';

const DEFAULT_USER_STATE: UserState = {
  isPremium: false,
  isAdFree: false,
  gems: 120, // Start with some free gems to buy the first upgrade!
  coins: 0,
  highscore: 0,
  equippedShip: 'starter',
  ownedShips: ['starter'],
  activeBoosts: {
    shieldUntil: 0,
    magnetUntil: 0,
    fireBoostUntil: 0
  },
  hasExtraLife: false,
  adsWatchedCount: 0,
  chaosModeUnlocked: false,
  upgradeLevels: {
    laser_damage: 1,
    magnet_range: 1,
    shield_duration: 1
  },
  dailyStreak: 1,
  lastLoginDate: new Date().toDateString(),
  totalMatchesPlayed: 0,
  highestDistance: 0,
  highestCombo: 0,
  highestGemsSingleRun: 0,
  claimedMissions: [],
  totalGemsCollected: 0,
  totalEnemiesDestroyed: 0,
  totalDistanceTraveled: 0,
  shipFragments: {
    premium_golden: 0,
    premium_quantum: 0,
    velocity: 0,
    dreadnought: 0
  },
  vipFreeReviveUsedToday: false,
  dailyStreakConsecutive: 1,
  dailyRunsCompleted: 0,
  lastDailyRunDate: "",
  dailyChestClaimedTime: 0,
  dailyExtraAdChestsOpenedToday: 0,
  battlePassXp: 0,
  claimedBattlePassRewardsFree: [],
  claimedBattlePassRewardsPremium: [],
  // NEON LIVE SYSTEM SPRINT
  dailyGoalProgress: {},
  dailyGoalClaimedDate: "",
  dailyChallengeCompletedDate: "",
  dailyChallengeClaimedDate: "",
  lastLuckyWheelSpinDate: "",
  prestigeLevel: 0,
  prestigeStars: 0,
  fleet: {
    starter: { level: 1, xp: 0, matchesPlayed: 0, enemiesDestroyed: 0 }
  },
  unlockedLoreIds: [],
  unlockedArchivioIds: [],
  ftueCompleted: false,
  ftueStep: 'intro',
  firstUpgradeFreeUsed: false,
  firstLuckyWheelSpinClaimed: false,
  firstChestClaimed: false,
  premiumTrialUsed: false,
  premiumTrialCompleted: false,
  ratingState: 'none',
  ratingRequestedCount: 0,
  avatar: 'pilot_1',
  nickname: 'Pilota Neon',
  hudColor: '#00f3ff',
  colorblindMode: 'none',
  controlsSensitivity: 1.0,
  vibrationEnabled: true,
  volumeMusic: 80,
  volumeSfx: 80,
  reducedParticles: false,
  batterySaverMode: false
};

const getDailyRunShipId = (): string => {
  const day = new Date().getDay();
  // Sunday (0) to Saturday (6)
  const ships = ['dreadnought', 'velocity', 'dreadnought', 'starter', 'premium_quantum', 'velocity', 'premium_golden'];
  return ships[day];
};

const getDailyModifier = () => {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const modifiers = [
    { id: 'chaos_lite', name: 'Chaos Lite', desc: 'Più ostacoli e densità nemica, +30% punteggio' }, // Sunday
    { id: 'gem_rush', name: 'Gem Rush', desc: 'Presenza di gemme +50%, meteore velocizzate' }, // Monday
    { id: 'shield_day', name: 'Shield Day', desc: 'Scudi protettivi più frequenti, boss rinforzati' }, // Tuesday
    { id: 'chaos_lite', name: 'Chaos Lite', desc: 'Più ostacoli e densità nemica, +30% punteggio' }, // Wednesday
    { id: 'laser_storm', name: 'Laser Storm', desc: 'Iper-frequenza di fuoco raddoppiata automatica' }, // Thursday
    { id: 'boss_signal', name: 'Boss Signal', desc: 'Segnale Boss rilevato ogni 1.000 metri percorsi' }, // Friday
    { id: 'neon_jackpot', name: 'Neon Jackpot', desc: 'Raddoppio automatico di tutte le gemme raccolte' } // Saturday
  ];
  return modifiers[day];
};

export default function App() {
  const [isDailyRunMode, setIsDailyRunMode] = useState(false);
  const [isDailyBossRunMode, setIsDailyBossRunMode] = useState(false);
  const [timeLeftUntilMidnight, setTimeLeftUntilMidnight] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeftUntilMidnight(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const [openedChestResult, setOpenedChestResult] = useState<{
    gemsReward: number;
    shipFragmentReward?: { shipId: string; count: number };
  } | null>(null);
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('neon_runner_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure standard structure is fully filled
        return { ...DEFAULT_USER_STATE, ...parsed };
      } catch (e) {
        return DEFAULT_USER_STATE;
      }
    }
    return DEFAULT_USER_STATE;
  });

  const [activeTab, setActiveTab] = useState<'play' | 'missions' | 'garage' | 'shop' | 'achievements' | 'battlepass' | 'debug'>('play');
  const [garageSubTab, setGarageSubTab] = useState<'ships' | 'upgrades'>('ships');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  // Audio state
  const [soundOn, setSoundOn] = useState(true);

  // Boost Selection states before game starts
  const [tempShieldSelected, setTempShieldSelected] = useState(false);
  const [tempFireSelected, setTempFireSelected] = useState(false);
  const [tempMagnetSelected, setTempMagnetSelected] = useState(false);
  const [chaosModeSelected, setChaosModeSelected] = useState(false);

  // NEON LIVE SYSTEM SPRINT
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelResult, setWheelResult] = useState<{ text: string; value: number; type: string } | null>(null);
  const [trialShipTimer, setTrialShipTimer] = useState<string | null>(null);

  // Ads management overlays
  const [activeAd, setActiveAd] = useState<{
    type: 'banner' | 'interstitial' | 'rewarded';
    rewardType?: 'extra_life' | 'shield_boost' | 'magnet_boost' | 'fire_boost' | 'gems_double';
  } | null>(null);

  // Extra life triggers inside active game
  const [hasUsedAdExtraLife, setHasUsedAdExtraLife] = useState(false);
  const [grantExtraLifeTrigger, setGrantExtraLifeTrigger] = useState(false);

  // Track run stats
  const [lastRunStats, setLastRunStats] = useState<GameStats | null>(null);
  const [showRunSummary, setShowRunSummary] = useState(false);
  const [bpAlert, setBpAlert] = useState<string | null>(null);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStartTime, setRunStartTime] = useState<number>(0);

  useEffect(() => {
    if (isPlaying) {
      const rId = 'run_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      setActiveRunId(rId);
      setRunStartTime(Date.now());
      
      const spaceWeather = NeonLiveOpsSystem.getSpaceWeather();
      const activeEvent = NeonLiveOpsSystem.getTodayEvent();
      
      let runMode = 'standard';
      if (isDailyRunMode) runMode = 'daily_run';
      else if (isDailyBossRunMode) runMode = 'daily_boss';
      else if (chaosModeSelected) runMode = 'chaos';

      const selectedShip = isDailyRunMode ? getDailyRunShipId() : userState.equippedShip;
      
      AnalyticsService.trackRunStart(rId, {
        run_mode: runMode,
        selected_ship: selectedShip,
        selected_skin: 'default',
        selected_boosters: [
          tempShieldSelected ? 'shield' : '',
          tempFireSelected ? 'fire_boost' : '',
          tempMagnetSelected ? 'magnet' : ''
        ].filter(Boolean),
        active_live_event: activeEvent.name,
        active_space_weather: spaceWeather.name
      });
    } else {
      setActiveRunId(null);
    }
  }, [isPlaying]);

  // Initialize Analytics and track returning player
  useEffect(() => {
    AnalyticsService.initialize();
  }, []);

  // Sync profile edits with localStorage
  useEffect(() => {
    localStorage.setItem('neon_runner_profile', JSON.stringify(userState));
  }, [userState]);

  // Daily login checks for streaks and VIP free revives
  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (userState.lastLoginDate !== todayStr) {
      setUserState(prev => {
        const lastLogin = prev.lastLoginDate ? new Date(prev.lastLoginDate) : null;
        let consecutive = prev.dailyStreakConsecutive || 1;
        
        if (lastLogin) {
          const today = new Date();
          // Reset time parts to compare pure days
          const todayPure = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const lastLoginPure = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
          const diffTime = Math.abs(todayPure.getTime() - lastLoginPure.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            consecutive += 1;
          } else if (diffDays > 1) {
            consecutive = 1; // reset streak
          }
        } else {
          consecutive = 1;
        }

        return {
          ...prev,
          lastLoginDate: todayStr,
          dailyStreakConsecutive: consecutive,
          vipFreeReviveUsedToday: false, // Reset daily VIP free revive
          dailyExtraAdChestsOpenedToday: 0, // Reset extra ad chest count
          dailyEnemiesDestroyed: 0,
          dailyGemsCollected: 0,
          dailyDistanceTraveled: 0,
          dailyMatchesPlayed: 0,
          dailyNearMisses: 0,
          dailyBossKills: 0,
          dailyDifferentShipsUsed: []
        };
      });
    }
  }, [userState.lastLoginDate]);

  const toggleSound = () => {
    audio.playClick();
    const target = !soundOn;
    setSoundOn(target);
    audio.setEnabled(target);
  };

  const handlePurchaseSuccess = (product: PurchaseItem) => {
    setUserState(prev => {
      let withGems = prev;
      if (product.gemsReward) {
        withGems = EconomySystem.transact(prev, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: product.gemsReward || 0,
          source: 'store_purchase',
          relatedEvent: `purchase_${product.id}`
        });
      }

      const nextState = { ...withGems };
      if (product.id === 'sub_vip') {
        nextState.isPremium = true;
        nextState.isAdFree = true;
        nextState.ownedShips = Array.from(new Set([...nextState.ownedShips, 'starter', 'velocity', 'dreadnought', 'premium_golden', 'premium_quantum']));
        nextState.chaosModeUnlocked = true;
      } else if (product.id === 'noncons_remove_ads') {
        nextState.isAdFree = true;
      }

      AnalyticsService.trackPurchase({
        purchase_state: 'completed',
        product_id: product.id as any
      });

      return nextState;
    });
  };

  const handleAdClose = (rewardGranted: boolean) => {
    if (!activeAd) return;

    if (activeAd.type === 'rewarded') {
      AnalyticsService.trackRewardedAd({
        ad_state: rewardGranted ? 'completed' : 'failed',
        reward_type: (activeAd.rewardType || 'revive') as any,
        runId: activeRunId || undefined
      });
    }

    if (rewardGranted && activeAd.type === 'rewarded') {
      setUserState(prev => {
        const adCount = (prev.adsWatchedCount || 0) + 1;
        const dailyAds = (prev.dailyAdsWatched || 0) + 1;
        return {
          ...prev,
          adsWatchedCount: adCount,
          dailyAdsWatched: dailyAds
        };
      });

      // Deliver rewards according to type
      if (activeAd.rewardType === 'extra_life') {
        setGrantExtraLifeTrigger(true);
        setHasUsedAdExtraLife(true);
      } else if (activeAd.rewardType === 'shield_boost') {
        setTempShieldSelected(true);
      } else if (activeAd.rewardType === 'fire_boost') {
        setTempFireSelected(true);
      } else if (activeAd.rewardType === 'magnet_boost') {
        setTempMagnetSelected(true);
      } else if (activeAd.rewardType === 'gacha_chest' as any) {
        handleOpenDailyChest(true);
      }
    }

    setActiveAd(null);
  };

  const handleUseVipFreeRevive = () => {
    audio.playPowerup();
    setUserState(prev => ({
      ...prev,
      vipFreeReviveUsedToday: true
    }));
    setGrantExtraLifeTrigger(true);
  };

  const spinLuckyWheel = () => {
    if (isSpinning) return;
    
    audio.playClick();
    const isFree = userState.lastLuckyWheelSpinDate !== new Date().toDateString();
    
    // Premium players get 2 spins, standard get 1
    if (!isFree && !userState.isPremium) {
      alert("Hai già effettuato il tuo giro gratuito oggi! Torna domani oppure attiva il Premium Pass per giri extra! ⭐");
      return;
    }

    const prizes = NeonLiveOpsSystem.LUCKY_WHEEL_SECTOR_PRIZES;
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    
    setIsSpinning(true);
    setWheelResult(null);
    
    // Each sector is 360 / 8 = 45 degrees
    const extraAngle = 360 - (randomIndex * 45); 
    const newAngle = wheelAngle + 1440 + extraAngle; // 4 full rotations minimum
    setWheelAngle(newAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWheelResult(selectedPrize);
      audio.playPowerup();

      setUserState(prev => {
        let updated = { ...prev, lastLuckyWheelSpinDate: new Date().toDateString() };
        
        if (selectedPrize.type === 'gems') {
          updated = EconomySystem.transact(updated, {
            transactionType: 'credit',
            currencyType: 'gems',
            amount: selectedPrize.value,
            source: 'daily_reward',
            relatedEvent: 'lucky_wheel_gems'
          });
        } else if (selectedPrize.type === 'coins') {
          updated = EconomySystem.transact(updated, {
            transactionType: 'credit',
            currencyType: 'coins',
            amount: selectedPrize.value,
            source: 'daily_reward',
            relatedEvent: 'lucky_wheel_coins'
          });
        } else if (selectedPrize.type === 'fragments') {
          const nextFragments = { ...(prev.shipFragments || {}) };
          nextFragments['premium_golden'] = (nextFragments['premium_golden'] || 0) + selectedPrize.value;
          updated.shipFragments = nextFragments;
        } else if (selectedPrize.type === 'shield_boost') {
          // Grant active booster
          setTempShieldSelected(true);
        }
        
        return updated;
      });
    }, 4000);
  };

  const activateTrialShip = (shipId: string) => {
    audio.playPowerup();
    const trialMinutes = BalanceConfig.getConfig().retention.shipTrialDurationMinutes;
    setUserState(prev => ({
      ...prev,
      trialShip: {
        shipId: shipId,
        expiresAt: Date.now() + trialMinutes * 60 * 1000
      }
    }));
    alert(`🚀 PROVA ATTIVATA! Puoi pilotare l'astronave d'élite "${SHIPS.find(s=>s.id===shipId)?.name}" gratuitamente per i prossimi ${trialMinutes} minuti! divertiti!`);
  };

  const claimTransmissionLore = (loreId: string) => {
    audio.playCollect();
    setUserState(prev => {
      const unlocked = [...(prev.unlockedLoreIds || [])];
      if (!unlocked.includes(loreId)) {
        unlocked.push(loreId);
        const updated = EconomySystem.transact(prev, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: 20,
          source: 'live_event_reward',
          relatedEvent: `lore_unlock_${loreId}`
        });
        return {
          ...updated,
          unlockedLoreIds: unlocked
        };
      }
      return prev;
    });
    alert("📡 TRASMISSIONE REGISTRATA NELL'ARCHIVIO! Hai ottenuto +20 Gemme! 💎");
  };

  const claimDailyGoal = () => {
    audio.playCollect();
    setUserState(prev => {
      const updated = EconomySystem.transact(prev, {
        transactionType: 'credit',
        currencyType: 'gems',
        amount: 100,
        source: 'daily_reward',
        relatedEvent: 'daily_goal_claim'
      });
      return {
        ...updated,
        dailyGoalClaimedDate: new Date().toDateString()
      };
    });
  };

  const claimDailyChallenge = () => {
    audio.playCollect();
    setUserState(prev => {
      const updated = EconomySystem.transact(prev, {
        transactionType: 'credit',
        currencyType: 'gems',
        amount: 200,
        source: 'achievement_reward',
        relatedEvent: 'daily_challenge_claim'
      });
      return {
        ...updated,
        dailyChallengeClaimedDate: new Date().toDateString()
      };
    });
  };

  const handleGameEnd = (stats: GameStats) => {
    setIsPlaying(false);
    setHasUsedAdExtraLife(false);
    setGrantExtraLifeTrigger(false);

    // Apply premium gem double multiplier!
    const multiplier = userState.isPremium ? 2 : 1;
    const finalGems = stats.gemsCollected * multiplier;
    const runDistance = Math.round(stats.distance * 10);

    // Calculate Battle Pass XP
    const xpEarned = Math.floor(runDistance / 6) + (stats.gemsCollected * 2) + (stats.enemiesDestroyed * 1.5) + ((stats.nearMisses || 0) * 4) + ((stats.bossKills || 0) * 50);
    const vipXpBonus = userState.isPremium ? Math.round(xpEarned * 0.3) : 0;
    const totalXpEarned = Math.max(5, xpEarned + vipXpBonus);

    // Fetch Daily Boss rewards
    let bossGemsAwarded = 0;
    let bossBadgeAwarded = "";
    let bossFragmentShipId = "";
    let bossFragmentCount = 0;

    if (stats.dailyBossDefeated) {
      const bossRewards = DailyBossSystem.getTodayBossRewards();
      bossGemsAwarded = bossRewards.gems;
      bossBadgeAwarded = bossRewards.badge;
      bossFragmentShipId = bossRewards.fragmentShipId;
      bossFragmentCount = bossRewards.fragmentCount;
    }

    // TELEMETRY: Track end of run
    const runDuration = runStartTime > 0 ? Math.round((Date.now() - runStartTime) / 1000) : 0;
    let runMode = 'standard';
    if (isDailyRunMode) runMode = 'daily_run';
    else if (isDailyBossRunMode) runMode = 'daily_boss';
    else if (chaosModeSelected) runMode = 'chaos';

    const selectedShip = isDailyRunMode ? getDailyRunShipId() : userState.equippedShip;

    AnalyticsService.trackRunEnd(activeRunId || 'run_unknown', stats.score > 0 ? 'completed' : 'abandoned', {
      run_duration: runDuration,
      run_score: stats.score,
      run_distance: runDistance,
      run_mode: runMode,
      selected_ship: selectedShip,
      cause_of_death: stats.score > 0 ? 'crash' : 'abandoned',
      number_of_revives: hasUsedAdExtraLife ? 1 : 0,
      rewarded_revive_used: hasUsedAdExtraLife,
      gems_collected: stats.gemsCollected,
      enemies_destroyed: stats.enemiesDestroyed,
      bosses_defeated: stats.dailyBossDefeated ? 1 : 0,
      near_misses: stats.nearMisses || 0,
      maximum_combo: stats.score > 0 ? Math.floor(stats.score / 150) : 0
    });

    setUserState(prev => {
      let stateAfterRun = prev;
      
      // 1. Regular Run reward credited via EconomySystem
      if (finalGems > 0) {
        stateAfterRun = EconomySystem.transact(stateAfterRun, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: finalGems,
          source: 'run_reward',
          relatedEvent: 'run_completed',
          runId: activeRunId || undefined
        });
      }

      // 2. Daily run rewards credited via EconomySystem
      let nextLastDailyRunDate = prev.lastDailyRunDate;
      let dailyRunBonusMsg = "";
      if (isDailyRunMode) {
        nextLastDailyRunDate = new Date().toDateString();
        // Give daily run flat reward: +75 gems!
        stateAfterRun = EconomySystem.transact(stateAfterRun, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: 75,
          source: 'live_event_reward',
          relatedEvent: 'daily_run_completion',
          runId: activeRunId || undefined
        });
        
        // Calculate streak rewards
        const consec = prev.dailyStreakConsecutive || 1;
        let streakBonus = 0;
        if (consec === 3) streakBonus = 100;
        else if (consec === 5) streakBonus = 250;
        else if (consec === 7) streakBonus = 500;
        
        if (streakBonus > 0) {
          stateAfterRun = EconomySystem.transact(stateAfterRun, {
            transactionType: 'credit',
            currencyType: 'gems',
            amount: streakBonus,
            source: 'daily_reward',
            relatedEvent: `daily_run_streak_${consec}`,
            runId: activeRunId || undefined
          });
          dailyRunBonusMsg = `🔥 Bonus consecutività ${consec} GIORNI ottenuto: +${streakBonus} gemme!`;
        }
      }

      // 3. Daily Boss rewards credited via EconomySystem
      let nextDailyBossDefeatedDate = prev.dailyBossDefeatedDate;
      const nextBadges = [...(prev.dailyBossBadgesCollected || [])];
      let bossStreakBonusMsg = "";
      let nextStreakConsecutive = prev.dailyStreakConsecutive || 1;

      if (stats.dailyBossDefeated && prev.dailyBossDefeatedDate !== new Date().toDateString()) {
        stateAfterRun = EconomySystem.transact(stateAfterRun, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: bossGemsAwarded,
          source: 'boss_reward',
          relatedEvent: 'daily_boss_defeat',
          runId: activeRunId || undefined
        });
        nextDailyBossDefeatedDate = new Date().toDateString();
        
        if (bossBadgeAwarded && !nextBadges.includes(bossBadgeAwarded)) {
          nextBadges.push(bossBadgeAwarded);
        }

        nextStreakConsecutive += 1;
        bossStreakBonusMsg = `🏆 SCONFITTO BOSS GIORNALIERO: Streak globale aumentata a ${nextStreakConsecutive} giorni! (+${bossGemsAwarded} Gemme)`;
      }

      // 4. Perform updates on standard parameters
      const nextHighscore = Math.max(stateAfterRun.highscore, stats.score);
      const diffShips = stateAfterRun.dailyDifferentShipsUsed || [];
      const currentShip = isDailyRunMode ? getDailyRunShipId() : stateAfterRun.equippedShip;
      const nextDiffShips = diffShips.includes(currentShip) ? diffShips : [...diffShips, currentShip];

      const nextFragments = { ...(stateAfterRun.shipFragments || {}) };
      let fragmentAlert = "";
      if (stats.collectedFragment) {
        nextFragments[stats.collectedFragment] = (nextFragments[stats.collectedFragment] || 0) + 1;
        const sName = SHIPS.find(s => s.id === stats.collectedFragment)?.name || 'Astronave';
        fragmentAlert = `Trova Spaziale! Frammento per la nave ${sName} aggiunto alla tua collezione (${nextFragments[stats.collectedFragment]}/10)`;
      }

      if (stats.dailyBossDefeated && prev.dailyBossDefeatedDate !== new Date().toDateString() && bossFragmentShipId && bossFragmentCount > 0) {
        nextFragments[bossFragmentShipId] = (nextFragments[bossFragmentShipId] || 0) + bossFragmentCount;
      }

      const activeShip = isDailyRunMode ? getDailyRunShipId() : stateAfterRun.equippedShip;
      const currentFleet = { ...(stateAfterRun.fleet || {}) };
      const shipFleetData = currentFleet[activeShip] || { level: 1, xp: 0, matchesPlayed: 0, enemiesDestroyed: 0 };
      
      const fleetXpEarned = 25 + stats.enemiesDestroyed;
      let newXp = shipFleetData.xp + fleetXpEarned;
      let newLevel = shipFleetData.level;
      let nextLevelXp = NeonLiveOpsSystem.getShipNextLevelXp(newLevel);
      
      while (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = NeonLiveOpsSystem.getShipNextLevelXp(newLevel);
        const sName = SHIPS.find(s => s.id === activeShip)?.name || 'Astronave';
        fragmentAlert = `🚀 FLOTTA LIVELLATA! La tua ${sName} è salita al Livello ${newLevel}! Nuovi bonus sbloccati permanentemente! ✨`;
      }
      
      currentFleet[activeShip] = {
        level: newLevel,
        xp: newXp,
        matchesPlayed: (shipFleetData.matchesPlayed || 0) + 1,
        enemiesDestroyed: (shipFleetData.enemiesDestroyed || 0) + stats.enemiesDestroyed
      };

      const updatedWithGoal = NeonLiveOpsSystem.updateGoalProgress(
        { ...stateAfterRun, dailyGoalProgress: { ...(stateAfterRun.dailyGoalProgress || {}) } } as any, 
        {
          enemiesDestroyed: stats.enemiesDestroyed,
          gemsCollected: finalGems,
          distance: runDistance,
          matchPlayed: true
        }
      );
      const updatedGoalProgress = updatedWithGoal.dailyGoalProgress || {};

      const todayChallenge = NeonLiveOpsSystem.getTodayChallenge();
      let challengeCompletedThisRun = false;
      let challengeCompletedDateVal = stateAfterRun.dailyChallengeCompletedDate || "";
      
      if (todayChallenge && stateAfterRun.dailyChallengeCompletedDate !== new Date().toDateString()) {
        const challengeShip = isDailyRunMode ? getDailyRunShipId() : stateAfterRun.equippedShip;
        if (todayChallenge.id === 'challenge_1' && runDistance >= 1500 && !tempShieldSelected) {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_2' && stats.gemsCollected >= 40) {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_3' && stats.enemiesDestroyed >= 60 && runDistance >= 1000) {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_4' && stats.gemsCollected >= 30) {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_5' && (stats.bossKills || 0) >= 1 && runDistance <= 2000) {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_6' && runDistance >= 2000 && challengeShip === 'starter') {
          challengeCompletedThisRun = true;
        } else if (todayChallenge.id === 'challenge_7' && stats.collectedFragment && chaosModeSelected) {
          challengeCompletedThisRun = true;
        }
        
        if (challengeCompletedThisRun) {
          challengeCompletedDateVal = new Date().toDateString();
          fragmentAlert = `⭐ SFIDA COMPLETATA! Hai superato la Sfida del Giorno: "${todayChallenge.title}"! Riscatta il premio nelle Missioni!`;
        }
      }

      const nextBattlePassXp = (stateAfterRun.battlePassXp || 0) + totalXpEarned;

      return {
        ...stateAfterRun,
        highscore: nextHighscore,
        totalMatchesPlayed: (stateAfterRun.totalMatchesPlayed || 0) + 1,
        totalGemsCollected: (stateAfterRun.totalGemsCollected || 0) + finalGems + bossGemsAwarded,
        totalEnemiesDestroyed: (stateAfterRun.totalEnemiesDestroyed || 0) + stats.enemiesDestroyed,
        totalDistanceTraveled: (stateAfterRun.totalDistanceTraveled || 0) + runDistance,
        highestGemsSingleRun: Math.max(stateAfterRun.highestGemsSingleRun || 0, finalGems),
        highestDistance: Math.max(stateAfterRun.highestDistance || 0, runDistance),
        
        // Daily values
        dailyEnemiesDestroyed: (stateAfterRun.dailyEnemiesDestroyed || 0) + stats.enemiesDestroyed,
        dailyGemsCollected: (stateAfterRun.dailyGemsCollected || 0) + stats.gemsCollected,
        dailyDistanceTraveled: (stateAfterRun.dailyDistanceTraveled || 0) + runDistance,
        dailyMatchesPlayed: (stateAfterRun.dailyMatchesPlayed || 0) + 1,
        dailyNearMisses: (stateAfterRun.dailyNearMisses || 0) + (stats.nearMisses || 0),
        dailyBossKills: (stateAfterRun.dailyBossKills || 0) + (stats.bossKills || 0),
        dailyDifferentShipsUsed: nextDiffShips,
        
        // Fragments
        shipFragments: nextFragments,
        
        // Daily run trackers
        lastDailyRunDate: nextLastDailyRunDate,
        dailyRunsCompleted: isDailyRunMode ? (stateAfterRun.dailyRunsCompleted || 0) + 1 : (stateAfterRun.dailyRunsCompleted || 0),
        
        // Daily boss trackers
        dailyBossDefeatedDate: nextDailyBossDefeatedDate,
        dailyBossBadgesCollected: nextBadges,
        dailyStreakConsecutive: nextStreakConsecutive,

        // Battle Pass XP increment
        battlePassXp: nextBattlePassXp,
        
        // NEON LIVE SYSTEM updates
        dailyGoalProgress: updatedGoalProgress,
        dailyChallengeCompletedDate: challengeCompletedDateVal,
        fleet: currentFleet,

        // Save temp alerts for summary
        _tempFragmentAlert: fragmentAlert || undefined,
        _tempDailyRunBonus: (dailyRunBonusMsg || bossStreakBonusMsg) ? `${dailyRunBonusMsg} ${bossStreakBonusMsg}`.trim() : undefined
      };
    });

    setLastRunStats({
      ...stats,
      gemsCollected: finalGems, // Save doubled gems if VIP
      xpEarned: totalXpEarned,
      vipXpBonus: vipXpBonus
    } as any);
    setShowRunSummary(true);

    // Reset daily run active mode after matching
    setIsDailyRunMode(false);
    setIsDailyBossRunMode(false);

    // Trigger random Interstitial Ad sometimes (33% rate) if NOT premium and NOT ad-free
    if (!userState.isPremium && !userState.isAdFree && Math.random() < 0.4) {
      setTimeout(() => {
        setActiveAd({ type: 'interstitial' });
      }, 500);
    }
  };

  const handleUnlockShip = (shipId: string, price: number) => {
    audio.playClick();
    if (userState.gems < price) return;

    setUserState(prev => {
      const updated = EconomySystem.transact(prev, {
        transactionType: 'debit',
        currencyType: 'gems',
        amount: price,
        sink: 'ship_unlock',
        relatedEvent: `unlock_${shipId}`
      });
      return {
        ...updated,
        ownedShips: [...prev.ownedShips, shipId],
        equippedShip: shipId
      };
    });
    audio.playPowerup();
  };

  const handleEquipShip = (shipId: string) => {
    audio.playClick();
    setUserState(prev => ({
      ...prev,
      equippedShip: shipId
    }));
  };

  const handleUpgrade = (upgradeId: string) => {
    const upgrades = EconomySystem.getUpgrades(userState);
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (upgrade.currentLevel >= upgrade.maxLevel) {
      audio.playExplosion(); // buzz sound or error
      return;
    }

    const cost = EconomySystem.getUpgradeCost(upgrade.baseCost, upgrade.currentLevel);
    if (userState.gems < cost) {
      audio.playExplosion();
      return;
    }

    audio.playPowerup();
    setUserState(prev => {
      const nextLevels = { ...prev.upgradeLevels };
      nextLevels[upgradeId] = (nextLevels[upgradeId] || 1) + 1;
      const updated = EconomySystem.transact(prev, {
        transactionType: 'debit',
        currencyType: 'gems',
        amount: cost,
        sink: 'ship_upgrade',
        relatedEvent: `upgrade_${upgradeId}_to_${nextLevels[upgradeId]}`
      });
      return {
        ...updated,
        upgradeLevels: nextLevels
      };
    });
  };

  const handleClaimMission = (missionId: string) => {
    audio.playClick();
    const missions = MissionSystem.getMissions();
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    if (MissionSystem.isCompleted(userState, mission) && !MissionSystem.isClaimed(userState, missionId)) {
      audio.playCollect();
      setUserState(prev => {
        const updated = EconomySystem.transact(prev, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: mission.rewardGems,
          source: 'mission_reward',
          relatedEvent: `claim_mission_${missionId}`
        });
        return {
          ...updated,
          claimedMissions: [...(prev.claimedMissions || []), missionId]
        };
      });
    }
  };

  const handleOpenDailyChest = (isAdChest: boolean = false) => {
    audio.playClick();
    
    // Check constraints
    const todayStr = new Date().toDateString();
    
    if (!isAdChest) {
      const lastChestDate = userState.dailyChestClaimedTime ? new Date(userState.dailyChestClaimedTime).toDateString() : "";
      if (lastChestDate === todayStr) {
        return; // Already claimed normal chest today
      }
    } else {
      const openedToday = userState.dailyExtraAdChestsOpenedToday || 0;
      if (openedToday >= 3) {
        return; // Limit reached for ad chests
      }
    }

    const minGems = userState.isPremium ? 35 : 15;
    const maxGems = userState.isPremium ? 65 : 30;
    const gemsReward = Math.floor(Math.random() * (maxGems - minGems + 1)) + minGems;

    const fragmentShips = ['premium_golden', 'premium_quantum', 'velocity', 'dreadnought'];
    const shipId = fragmentShips[Math.floor(Math.random() * fragmentShips.length)];
    const count = userState.isPremium ? 2 : 1;

    setUserState(prev => {
      const nextFragments = { ...(prev.shipFragments || {}) };
      nextFragments[shipId] = (nextFragments[shipId] || 0) + count;

      const baseUpdated = EconomySystem.transact(prev, {
        transactionType: 'credit',
        currencyType: 'gems',
        amount: gemsReward,
        source: isAdChest ? 'rewarded_ad' : 'chest_reward',
        relatedEvent: isAdChest ? 'ad_chest_open' : 'daily_chest_open'
      });

      const updatedState: UserState = {
        ...baseUpdated,
        shipFragments: nextFragments,
        totalGemsCollected: (prev.totalGemsCollected || 0) + gemsReward,
      };

      if (!isAdChest) {
        updatedState.dailyChestClaimedTime = Date.now();
      } else {
        updatedState.dailyExtraAdChestsOpenedToday = (prev.dailyExtraAdChestsOpenedToday || 0) + 1;
      }

      return updatedState;
    });

    setOpenedChestResult({
      gemsReward,
      shipFragmentReward: { shipId, count }
    });

    audio.playPowerup();
  };

  const handleCraftShip = (shipId: string) => {
    audio.playClick();
    const currentFragments = userState.shipFragments?.[shipId] || 0;
    if (currentFragments < 10) return;

    setUserState(prev => {
      const nextFragments = { ...(prev.shipFragments || {}) };
      nextFragments[shipId] = Math.max(0, currentFragments - 10);
      
      const owned = prev.ownedShips.includes(shipId) ? prev.ownedShips : [...prev.ownedShips, shipId];
      return {
        ...prev,
        ownedShips: owned,
        equippedShip: shipId,
        shipFragments: nextFragments
      };
    });
    audio.playPowerup();
  };

  // Developer mode helpers
  const handleResetProgress = () => {
    audio.playClick();
    if (confirm('Sei sicuro di voler resettare tutti i progressi e gli acquisti fittizi?')) {
      localStorage.removeItem('neon_runner_profile');
      setUserState(DEFAULT_USER_STATE);
      alert('Progressi azzerati correttamente.');
    }
  };

  const handleAddGemsCheat = () => {
    audio.playClick();
    setUserState(prev => {
      const updated = EconomySystem.transact(prev, {
        transactionType: 'credit',
        currencyType: 'gems',
        amount: 250,
        source: 'achievement_reward',
        relatedEvent: 'gem_cheat_add'
      });
      return updated;
    });
    audio.playCollect();
  };

  const BATTLE_PASS_TIERS = [
    { level: 1, xpNeeded: 100, freeReward: { type: 'gems', amount: 20, name: '20 Gemme 💎' }, premiumReward: { type: 'gems', amount: 60, name: '60 Gemme 💎' } },
    { level: 2, xpNeeded: 200, freeReward: { type: 'fragment', shipId: 'dreadnought', amount: 2, name: '2x Frammenti Dreadnought 🛸' }, premiumReward: { type: 'fragment', shipId: 'dreadnought', amount: 5, name: '5x Frammenti Dreadnought 🛸' } },
    { level: 3, xpNeeded: 300, freeReward: { type: 'gems', amount: 30, name: '30 Gemme 💎' }, premiumReward: { type: 'gems', amount: 100, name: '100 Gemme 💎' } },
    { level: 4, xpNeeded: 400, freeReward: { type: 'fragment', shipId: 'velocity', amount: 2, name: '2x Frammenti Cyber Swift 🛸' }, premiumReward: { type: 'fragment', shipId: 'velocity', amount: 5, name: '5x Frammenti Cyber Swift 🛸' } },
    { level: 5, xpNeeded: 500, freeReward: { type: 'gems', amount: 50, name: '50 Gemme 💎' }, premiumReward: { type: 'gems', amount: 150, name: '150 Gemme 💎' } },
    { level: 6, xpNeeded: 600, freeReward: { type: 'fragment', shipId: 'premium_quantum', amount: 2, name: '2x Frammenti Quantum (VIP) 🛸' }, premiumReward: { type: 'fragment', shipId: 'premium_quantum', amount: 5, name: '5x Frammenti Quantum (VIP) 🛸' } },
    { level: 7, xpNeeded: 700, freeReward: { type: 'gems', amount: 75, name: '75 Gemme 💎' }, premiumReward: { type: 'gems', amount: 250, name: '250 Gemme 💎' } },
    { level: 8, xpNeeded: 800, freeReward: { type: 'fragment', shipId: 'premium_golden', amount: 2, name: '2x Frammenti Aurum (VIP) 🛸' }, premiumReward: { type: 'fragment', shipId: 'premium_golden', amount: 5, name: '5x Frammenti Aurum (VIP) 🛸' } },
    { level: 9, xpNeeded: 900, freeReward: { type: 'gems', amount: 100, name: '100 Gemme 💎' }, premiumReward: { type: 'gems', amount: 350, name: '350 Gemme 💎' } },
    { level: 10, xpNeeded: 1000, freeReward: { type: 'all_fragments', amount: 4, name: '4x Frammenti Tutti 🎁' }, premiumReward: { type: 'unlock_ship', shipId: 'premium_golden', name: 'SBLOCCO Aurum Eclipse (VIP) 👑' } },
  ];

  const handleClaimBattlePassReward = (tierLevel: number, isPremiumReward: boolean) => {
    audio.playPowerup();
    
    const tier = BATTLE_PASS_TIERS.find(t => t.level === tierLevel);
    if (!tier) return;
    
    const reward = isPremiumReward ? tier.premiumReward : tier.freeReward;
    
    setUserState(prev => {
      const nextFragments = { ...(prev.shipFragments || {}) };
      const nextOwnedShips = [...(prev.ownedShips || [])];
      
      const nextClaimedFree = [...(prev.claimedBattlePassRewardsFree || [])];
      const nextClaimedPremium = [...(prev.claimedBattlePassRewardsPremium || [])];
      
      if (isPremiumReward) {
        if (!nextClaimedPremium.includes(tierLevel)) {
          nextClaimedPremium.push(tierLevel);
        }
      } else {
        if (!nextClaimedFree.includes(tierLevel)) {
          nextClaimedFree.push(tierLevel);
        }
      }
      
      let gemsGained = 0;
      let alertMsg = "";
      
      if (reward.type === 'gems') {
        gemsGained = reward.amount || 0;
        alertMsg = `Complimenti! Riscattato: ${reward.name}!`;
      } else if (reward.type === 'fragment') {
        const sId = reward.shipId!;
        nextFragments[sId] = (nextFragments[sId] || 0) + (reward.amount || 0);
        alertMsg = `Frammenti Aggiunti! Riscattato: ${reward.name}!`;
      } else if (reward.type === 'all_fragments') {
        SHIPS.forEach(s => {
          nextFragments[s.id] = (nextFragments[s.id] || 0) + (reward.amount || 0);
        });
        alertMsg = `Super Jackpot Riscattato! +${reward.amount} frammenti per ciascuna nave in flotta!`;
      } else if (reward.type === 'unlock_ship') {
        const sId = reward.shipId!;
        if (!nextOwnedShips.includes(sId)) {
          nextOwnedShips.push(sId);
        }
        alertMsg = `👑 PRESTIGIO SUPREMO! Hai sbloccato definitivamente la nave Aurum Eclipse (VIP) senza pagare!`;
      }
      
      setBpAlert(alertMsg);
      setTimeout(() => setBpAlert(null), 4000);
      
      let stateAfterBP = prev;
      if (gemsGained > 0) {
        stateAfterBP = EconomySystem.transact(prev, {
          transactionType: 'credit',
          currencyType: 'gems',
          amount: gemsGained,
          source: 'premium_bonus',
          relatedEvent: `battlepass_tier_${tierLevel}_${isPremiumReward ? 'premium' : 'free'}`
        });
      }

      return {
        ...stateAfterBP,
        shipFragments: nextFragments,
        ownedShips: nextOwnedShips,
        claimedBattlePassRewardsFree: nextClaimedFree,
        claimedBattlePassRewardsPremium: nextClaimedPremium
      };
    });
  };

  const handleAddXpCheat = () => {
    audio.playClick();
    setUserState(prev => ({
      ...prev,
      battlePassXp: (prev.battlePassXp || 0) + 150
    }));
    audio.playPowerup();
    setBpAlert("🚀 +150 XP Pass Battaglia aggiunti!");
    setTimeout(() => setBpAlert(null), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Top Main Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-blue-500 animate-pulse" />
            <div className="leading-none">
              <span className="text-sm font-black tracking-wider block text-white uppercase">NEON RUNNER</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase hidden sm:block">Arcade Mode</span>
            </div>
            {userState.isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" /> VIP
              </span>
            )}
          </div>

          {/* Quick HUD for currency */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850 border border-zinc-800">
              <Gem className="w-4 h-4 text-pink-400 animate-pulse" />
              <span className="font-extrabold font-mono text-white text-xs">{userState.gems}</span>
              <button 
                onClick={handleAddGemsCheat}
                className="ml-1 p-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors"
                title="Cheat: Aggiungi +250 Gemme"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            >
              {soundOn ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Run active game canvas */}
        {isPlaying ? (
          <div className="aspect-[4/5] max-w-md w-full mx-auto border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <GameCanvas 
              equippedShipId={isDailyRunMode ? getDailyRunShipId() : userState.equippedShip}
              isPremium={userState.isPremium}
              chaosMode={(isDailyRunMode || isDailyBossRunMode) ? false : chaosModeSelected}
              preMatchShield={(isDailyRunMode || isDailyBossRunMode) ? false : tempShieldSelected}
              preMatchFireBoost={(isDailyRunMode || isDailyBossRunMode) ? false : tempFireSelected}
              preMatchMagnet={(isDailyRunMode || isDailyBossRunMode) ? false : tempMagnetSelected}
              onGameEnd={handleGameEnd}
              onWatchAdForExtraLife={() => setActiveAd({ type: 'rewarded', rewardType: 'extra_life' })}
              hasUsedAdExtraLife={hasUsedAdExtraLife}
              grantExtraLifeTrigger={grantExtraLifeTrigger}
              upgradeLevels={userState.upgradeLevels}
              isDailyRun={isDailyRunMode}
              dailyRunModifier={isDailyRunMode ? getDailyModifier().id : ''}
              vipFreeReviveUsedToday={userState.vipFreeReviveUsedToday || false}
              onUseVipFreeRevive={handleUseVipFreeRevive}
              isDailyBossRun={isDailyBossRunMode}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Quick Banner Ads placeholder if not Premium */}
            {!userState.isPremium && !userState.isAdFree && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" />
                  Rimuovi banner e sblocca la modalità Chaos acquistando il <strong>VIP Premium Pass</strong> nello Store offline.
                </span>
                <button 
                  onClick={() => { audio.playClick(); setIsShopOpen(true); }}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Rimuovi Ora
                </button>
              </div>
            )}

            {/* Run Summary Modal Overlay */}
            {showRunSummary && lastRunStats && (
              <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/5 text-center space-y-4">
                <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-full">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Partita Conclusa!</h3>
                  <p className="text-sm text-gray-400">Ecco i risultati ottenuti nell'ultima missione nello spazio:</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">Punteggio</span>
                    <span className="text-lg font-black text-white">{lastRunStats.score}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">Meteoriti</span>
                    <span className="text-lg font-black text-rose-400">{lastRunStats.enemiesDestroyed} polverizzati</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">Gemme</span>
                    <span className="text-lg font-black text-pink-400 flex items-center justify-center gap-1">
                      <Gem className="w-4.5 h-4.5" /> {lastRunStats.gemsCollected}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">Distanza</span>
                    <span className="text-lg font-black text-emerald-400">~{Math.round(lastRunStats.distance)} UA</span>
                  </div>
                </div>

                {userState.isPremium && (
                  <div className="text-xs text-yellow-400 font-bold">
                    👑 Bonus VIP Premium Attivo: Hai guadagnato il RADDOPPIO automatico delle gemme in gioco!
                  </div>
                )}

                {/* Battle Pass Progression Info Row */}
                <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-950/10 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <span className="block font-black text-white text-sm">Progressione Pass Battaglia</span>
                      <span className="text-[10px] text-pink-400 font-bold uppercase">
                        +{((lastRunStats as any).xpEarned) || 0} XP Guadagnati {((lastRunStats as any).vipXpBonus) > 0 && `(Incluso +30% VIP 👑)`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Miniature level tracker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400">LIVELLO {Math.floor((userState.battlePassXp || 0) / 100) + 1}</span>
                    <button 
                      onClick={() => { audio.playClick(); setShowRunSummary(false); setActiveTab('battlepass'); }}
                      className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all shadow shadow-pink-600/30 cursor-pointer"
                    >
                      Vedi Premi 🎁
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => { audio.playClick(); setShowRunSummary(false); }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
                >
                  Ottimo! Torna alla dashboard
                </button>
              </div>
            )}

            {/* Navigation tabs */}
            <div className="flex border-b border-zinc-900 gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
              <button 
                onClick={() => { audio.playClick(); setActiveTab('play'); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  activeTab === 'play' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4 flex-shrink-0" /> Home
              </button>
              <button 
                onClick={() => { audio.playClick(); setActiveTab('missions'); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap relative ${
                  activeTab === 'missions' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Target className="w-4 h-4 flex-shrink-0" /> Missioni
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </button>
              <button 
                onClick={() => { audio.playClick(); setActiveTab('garage'); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  activeTab === 'garage' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4 flex-shrink-0" /> Garage
              </button>
              <button 
                onClick={() => { audio.playClick(); setActiveTab('battlepass'); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap relative ${
                  activeTab === 'battlepass' 
                    ? 'border-pink-500 text-pink-400 bg-pink-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 flex-shrink-0 text-pink-400 animate-pulse" /> 
                <span>
                  Pass Battaglia
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                </span>
              </button>
              <button 
                onClick={() => { audio.playClick(); setActiveTab('shop'); setIsShopOpen(true); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  activeTab === 'shop' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" /> Negozio
              </button>
              <button 
                onClick={() => { audio.playClick(); setActiveTab('achievements'); }}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  activeTab === 'achievements' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 flex-shrink-0" /> Profilo
              </button>
            </div>

            {/* Tab: PLAY (Setup run layout with reward boosters) */}
            {activeTab === 'play' && (
              <div className="flex flex-col gap-6">
                
                {/* Daily Boss Card */}
                {(() => {
                  const todayBoss = DailyBossSystem.getTodayBoss();
                  const todayRewards = DailyBossSystem.getTodayBossRewards();
                  const isBossDefeatedToday = userState.dailyBossDefeatedDate === new Date().toDateString();
                  
                  return (
                    <div className={`p-6 rounded-2xl border ${
                      isBossDefeatedToday 
                        ? 'border-zinc-800 bg-zinc-900/10' 
                        : 'border-red-500/30 bg-red-950/10 shadow-lg shadow-red-900/10'
                    } flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                          isBossDefeatedToday ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        }`}>
                          😈
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                              isBossDefeatedToday ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/25 text-red-400 animate-pulse'
                            }`}>
                              {isBossDefeatedToday ? 'Sconfitto Oggi' : 'Boss Giornaliero Disponibile!'}
                            </span>
                            {!isBossDefeatedToday && (
                              <span className="text-[10px] bg-yellow-500/25 text-yellow-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                Raro
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-white truncate">
                            {todayBoss.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {isBossDefeatedToday 
                              ? "Hai abbattuto la minaccia spaziale odierna. Torna domani per una nuova epica sfida!" 
                              : "Sconfiggilo entro oggi per riscattare gemme, un frammento speciale e un distintivo leggendario!"
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
                        {/* Rewards preview if not defeated */}
                        {!isBossDefeatedToday && (
                          <div className="flex items-center justify-around gap-3 p-2 px-3 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs">
                            <span className="text-gray-500 uppercase font-black text-[9px]">Premio:</span>
                            <span className="font-extrabold text-pink-400 flex items-center gap-0.5" title="Gemme">
                              <Gem className="w-3.5 h-3.5" /> +{todayRewards.gems}
                            </span>
                            <span className="text-yellow-400 text-sm" title={`Distintivo: ${todayRewards.badge}`}>
                              🏆
                            </span>
                            <span className="font-extrabold text-blue-400 flex items-center gap-0.5" title="Frammento astronave">
                              🛸 +{todayRewards.fragmentCount}
                            </span>
                          </div>
                        )}

                        {isBossDefeatedToday ? (
                          <div className="text-center md:text-right space-y-1 p-2 bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4">
                            <span className="text-[10px] text-zinc-500 block font-bold uppercase">Prossimo Boss tra:</span>
                            <span className="text-sm font-black font-mono text-zinc-400 tracking-wider">
                              {timeLeftUntilMidnight || "00:00:00"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { audio.playClick(); setIsDailyBossRunMode(true); setIsPlaying(true); }}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            AFFRONTA IL BOSS ⚔️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* NEON LIVEOPS DASHBOARD BLOCK */}
                <div className="p-6 rounded-2xl border border-blue-900/40 bg-zinc-950/60 backdrop-blur-md space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xl">
                        📡
                      </span>
                      <div>
                        <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                          Neon Live System
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </h2>
                        <p className="text-xs text-gray-400 font-medium">Il nucleo dinamico galattico. Eventi, meteo spaziale, ruota della fortuna e trasmissioni giornaliere.</p>
                      </div>
                    </div>
                    <div className="text-xs font-mono bg-zinc-900 border border-zinc-800/80 p-1.5 px-3 rounded-lg text-gray-400 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black text-pink-400 animate-pulse">Aggiornamento tra:</span>
                      <span className="font-bold tracking-wider">{timeLeftUntilMidnight || "00:00:00"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Event of the Day & Space Weather */}
                    <div className="space-y-4">
                      {/* Active Event Card */}
                      {(() => {
                        const todayEvent = NeonLiveOpsSystem.getTodayEvent();
                        return (
                          <div className="p-4 rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-950/10 to-purple-950/10 hover:bg-zinc-900/30 transition-all flex flex-col justify-between h-[160px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/15 transition-all pointer-events-none" />
                            <div className="space-y-2">
                              <span className="text-[9px] font-extrabold tracking-widest text-pink-400 uppercase bg-pink-500/15 px-2 py-0.5 rounded">
                                Evento del Giorno
                              </span>
                              <h3 className="text-base font-black text-white flex items-center gap-2">
                                {todayEvent.emoji} {todayEvent.name.toUpperCase()}
                              </h3>
                              <p className="text-xs text-gray-400 leading-normal line-clamp-2">
                                {todayEvent.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-yellow-400 uppercase tracking-wide bg-yellow-500/10 p-1 px-2 rounded border border-yellow-500/20 w-fit">
                              ✨ MODIFICATORE COMPRESO: Attivo in Volo!
                            </div>
                          </div>
                        );
                      })()}

                      {/* Space Weather Forecast Card */}
                      {(() => {
                        const spaceWeather = NeonLiveOpsSystem.getSpaceWeather();
                        return (
                          <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 to-teal-950/10 hover:bg-zinc-900/30 transition-all flex flex-col justify-between h-[160px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />
                            <div className="space-y-2">
                              <span className="text-[9px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-500/15 px-2 py-0.5 rounded">
                                Meteo Spaziale Attivo
                              </span>
                              <h3 className="text-base font-black text-white flex items-center gap-2">
                                {spaceWeather.emoji} {spaceWeather.name.toUpperCase()}
                              </h3>
                              <p className="text-xs text-gray-400 leading-normal line-clamp-2">
                                {spaceWeather.description}
                              </p>
                            </div>
                            <div className="text-[10px] font-black text-teal-300 uppercase tracking-wider">
                              ⚠️ Influenza tutte le modalità di volo
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Column 2: Lucky Wheel (Ruota della Fortuna) */}
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-between text-center min-h-[336px] relative overflow-hidden">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold tracking-widest text-yellow-400 uppercase bg-yellow-500/15 px-2 py-0.5 rounded">
                          Ruota della Fortuna
                        </span>
                        <h3 className="text-sm font-black text-white mt-1">Gira Gratis Oggi!</h3>
                        <p className="text-[10px] text-gray-500">I VIP ottengono 2 tentativi al giorno.</p>
                      </div>

                      {/* Virtual Wheel Representation */}
                      <div className="my-4 relative w-36 h-36 flex items-center justify-center">
                        {/* Center pointer */}
                        <div className="absolute top-[-4px] left-[50%] translate-x-[-50%] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-pink-500 z-10 drop-shadow-lg" />
                        
                        {/* Inner Wheel Disk */}
                        <div 
                          className="w-32 h-32 rounded-full border-4 border-zinc-800 bg-zinc-950 relative overflow-hidden transition-transform duration-[4000ms] ease-out flex items-center justify-center shadow-inner shadow-pink-500/20"
                          style={{ 
                            transform: `rotate(${wheelAngle}deg)`,
                          }}
                        >
                          {/* Radial lines overlay */}
                          <div className="absolute inset-0 w-full h-full rounded-full border-2 border-zinc-700/50 pointer-events-none" />
                          <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-zinc-800/80 pointer-events-none" />
                          <div className="absolute left-0 right-0 top-[50%] h-[1px] bg-zinc-800/80 pointer-events-none" />
                          <div className="absolute inset-0 rotate-45 top-0 bottom-0 left-[50%] w-[1px] bg-zinc-800/80 pointer-events-none" />
                          <div className="absolute inset-0 rotate-45 left-0 right-0 top-[50%] h-[1px] bg-zinc-800/80 pointer-events-none" />

                          {/* Sector prizes indicators */}
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-extrabold pointer-events-none">
                            <span className="absolute top-1 transform rotate-0 text-pink-400">100💎</span>
                            <span className="absolute right-1 transform rotate-90 text-yellow-400">250💎</span>
                            <span className="absolute bottom-1 transform rotate-180 text-blue-400">1x🛡️</span>
                            <span className="absolute left-1 transform -rotate-90 text-teal-400">500💰</span>
                          </div>

                          {/* Wheel center pin */}
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-600 z-10 flex items-center justify-center shadow">
                            <span className="text-[8px]">⭐</span>
                          </div>
                        </div>
                      </div>

                      {/* Controls and rewards */}
                      <div className="space-y-2 w-full">
                        {wheelResult && (
                          <div className="p-1 px-2.5 rounded bg-pink-500/15 border border-pink-500/30 text-[11px] font-bold text-pink-300 animate-bounce">
                            Hai ottenuto: {wheelResult.text}! 🎉
                          </div>
                        )}
                        <button
                          disabled={isSpinning || (userState.lastLuckyWheelSpinDate === new Date().toDateString() && !userState.isPremium)}
                          onClick={spinLuckyWheel}
                          className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            isSpinning 
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                              : (userState.lastLuckyWheelSpinDate === new Date().toDateString() && !userState.isPremium)
                                ? 'bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-500/20 active:scale-95'
                          }`}
                        >
                          {isSpinning ? 'GIRO IN CORSO...' : userState.lastLuckyWheelSpinDate === new Date().toDateString() ? (userState.isPremium ? 'GIRA ANCORA (VIP) 🎡' : 'GIRO COMPLETATO') : 'GIRA LA RUOTA 🎡'}
                        </button>
                      </div>
                    </div>

                    {/* Column 3: Daily Transmission (Lore) & Trial Ship Of the Day */}
                    <div className="space-y-4">
                      {/* Daily Trial Ship */}
                      {(() => {
                        const trialShipId = getDailyRunShipId();
                        const trialShip = SHIPS.find(s => s.id === trialShipId) || SHIPS[0];
                        const isAlreadyTrialed = userState.trialShip?.shipId === trialShipId && Date.now() < (userState.trialShip?.expiresAt || 0);
                        const isOwned = userState.ownedShips.includes(trialShipId);

                        return (
                          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col justify-between h-[160px] relative overflow-hidden group">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold tracking-widest text-blue-400 uppercase bg-blue-500/15 px-2 py-0.5 rounded">
                                Nave in Prova del Giorno
                              </span>
                              <h3 className="text-sm font-black text-white mt-1">🚀 {trialShip.name.toUpperCase()}</h3>
                              <p className="text-[10px] text-gray-400 leading-normal">
                                Prova gratuitamente per 24 ore la leggendaria nave odierna prima di sbloccarla!
                              </p>
                            </div>

                            <div>
                              {isOwned ? (
                                <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/15 p-1 px-3 rounded block text-center border border-emerald-500/20">
                                  ✓ Già Posseduta
                                </span>
                              ) : isAlreadyTrialed ? (
                                <span className="text-[10px] text-yellow-400 font-extrabold uppercase bg-yellow-500/15 p-1 px-3 rounded block text-center border border-yellow-500/20">
                                  ✓ In Prova Attiva
                                </span>
                              ) : (
                                <button
                                  onClick={() => activateTrialShip(trialShipId)}
                                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase rounded-lg shadow transition-all active:scale-95 cursor-pointer"
                                >
                                  ATTIVA PROVA GRATIS (24h) 🔑
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Daily Intergalactic Transmission (Lore) */}
                      {(() => {
                        const todayLore = NeonLiveOpsSystem.getTodayLore();
                        const isLoreUnlocked = userState.unlockedLoreIds?.includes(todayLore.id);

                        return (
                          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col justify-between h-[160px] relative overflow-hidden group">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold tracking-widest text-violet-400 uppercase bg-violet-500/15 px-2 py-0.5 rounded">
                                Trasmissione Quotidiana
                              </span>
                              <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-extrabold text-white truncate">Da: {todayLore.sender}</h3>
                                <span className="text-[9px] text-gray-500 font-mono">{todayLore.transmissionTime || '12:00 UTC'}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 italic leading-snug line-clamp-2">
                                "{todayLore.text}"
                              </p>
                            </div>

                            <div>
                              {isLoreUnlocked ? (
                                <span className="text-[10px] text-zinc-500 font-extrabold uppercase bg-zinc-900/80 p-1 px-3 rounded block text-center border border-zinc-800/40">
                                  ✓ Registrata (+20 Gemme Claimed)
                                </span>
                              ) : (
                                <button
                                  onClick={() => claimTransmissionLore(todayLore.id)}
                                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-[10px] uppercase rounded-lg shadow transition-all active:scale-95 cursor-pointer"
                                >
                                  REGISTRA TRASMISSIONE 📡 (+20 💎)
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* LEFT column: Equipped Ship Showcase card */}
                  <div className="flex flex-col gap-6">
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-6 h-full">
                      <div>
                        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Astronave Equipaggiata</span>
                        <h2 className="text-2xl font-black text-white mt-1">
                          {SHIPS.find(s => s.id === userState.equippedShip)?.name}
                        </h2>
                        <p className="text-sm text-gray-400 mt-2">
                          {SHIPS.find(s => s.id === userState.equippedShip)?.description}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950 text-center">
                            <span className="text-[10px] text-gray-500 block uppercase">Velocità</span>
                            <span className="text-base font-black text-white">
                              {SHIPS.find(s => s.id === userState.equippedShip)?.speed}/10
                            </span>
                          </div>
                          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950 text-center">
                            <span className="text-[10px] text-gray-500 block uppercase">Cadenza</span>
                            <span className="text-base font-black text-white">
                              {((1000 - (SHIPS.find(s => s.id === userState.equippedShip)?.fireRate || 400)) / 100).toFixed(1)}/10
                            </span>
                          </div>
                          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950 text-center">
                            <span className="text-[10px] text-gray-500 block uppercase">Integrità</span>
                            <span className="text-base font-black text-white">
                              {SHIPS.find(s => s.id === userState.equippedShip)?.health} ❤️
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row gap-4 justify-between items-center mt-auto">
                        <div className="text-left w-full sm:w-auto">
                          {chaosModeSelected ? (
                            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                              <Flame className="w-4 h-4 animate-pulse" /> Punti Triplicati! 1 Vita fissa.
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Sei pronto per il decollo standard. Scegli i boost prima di partire!
                            </span>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => { audio.playClick(); setIsDailyRunMode(false); setIsPlaying(true); }}
                          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 text-sm uppercase tracking-wider transition-all animate-shake-glow hover:scale-105 active:scale-95"
                        >
                          DECOLLA ORA 🚀
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT column: Temporary Boosters & Daily Chest */}
                  <div className="flex flex-col gap-6">
                    {/* Pre-Match Booster setup utilizing optional rewarded video ads */}
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5">
                      <div>
                        <h3 className="font-bold text-lg text-white">Temporary Boosters</h3>
                        <p className="text-xs text-gray-400">Guarda brevi spot offline sponsorizzati per iniziare la run con un boost temporaneo della durata di 20 secondi!</p>
                      </div>

                      <div className="space-y-3">
                        
                        {/* Shield boost option */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <div>
                              <span className="text-xs font-bold block text-white">Scudo Protettivo</span>
                              <span className="text-[10px] text-gray-500">20s di invulnerabilità</span>
                            </div>
                          </div>
                          
                          {userState.isPremium ? (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-black">VIP FREE</span>
                          ) : tempShieldSelected ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">Attivo!</span>
                          ) : (
                            <button 
                              onClick={() => { audio.playClick(); setActiveAd({ type: 'rewarded', rewardType: 'shield_boost' }); }}
                              className="px-2.5 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Tv className="w-3.5 h-3.5" /> Ad + Boost
                            </button>
                          )}
                        </div>

                        {/* Fire rate boost option */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <div>
                              <span className="text-xs font-bold block text-white">Cadenza di Fuoco</span>
                              <span className="text-[10px] text-gray-500">Doppia cadenza</span>
                            </div>
                          </div>
                          
                          {userState.isPremium ? (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-black">VIP FREE</span>
                          ) : tempFireSelected ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">Attivo!</span>
                          ) : (
                            <button 
                              onClick={() => { audio.playClick(); setActiveAd({ type: 'rewarded', rewardType: 'fire_boost' }); }}
                              className="px-2.5 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Tv className="w-3.5 h-3.5" /> Ad + Boost
                            </button>
                          )}
                        </div>

                        {/* Magnet boost option */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <div>
                              <span className="text-xs font-bold block text-white">Calamita Gemme</span>
                              <span className="text-[10px] text-gray-500">Attira i tesori sparsi</span>
                            </div>
                          </div>
                          
                          {userState.isPremium ? (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-black">VIP FREE</span>
                          ) : tempMagnetSelected ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">Attivo!</span>
                          ) : (
                            <button 
                              onClick={() => { audio.playClick(); setActiveAd({ type: 'rewarded', rewardType: 'magnet_boost' }); }}
                              className="px-2.5 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Tv className="w-3.5 h-3.5" /> Ad + Boost
                            </button>
                          )}
                        </div>

                      </div>

                      {/* Chaos Mode Option (requires Premium Pass) */}
                      <div className="pt-4 border-t border-zinc-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-400">Modalità CHAOS (Triplo Punteggio!)</span>
                          {!userState.isPremium && !userState.chaosModeUnlocked ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-bold uppercase flex items-center gap-1 border border-yellow-500/20">
                              <Crown className="w-3 h-3" /> VIP Only
                            </span>
                          ) : (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={chaosModeSelected} 
                                onChange={(e) => { audio.playClick(); setChaosModeSelected(e.target.checked); }}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                            </label>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">I meteoriti viaggiano a velocità supersonica. Inizi con solo 1 vita e non puoi curarti, ma ogni punto guadagnato vale il triplo!</p>
                      </div>
                    </div>

                    {/* Daily Chest Gacha Card */}
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-5">
                      <div>
                        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Materiali Spaziali</span>
                        <h3 className="font-extrabold text-lg text-white mt-0.5">Cassa dei Frammenti 📦</h3>
                        <p className="text-xs text-gray-400 mt-1">Apri la cassa giornaliera per raccogliere gemme e frammenti. Raccogli 10 frammenti nel Garage per sbloccare le astronavi gratis!</p>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-950 bg-zinc-950/40">
                        <span className="text-4xl animate-pulse">📦</span>
                        <div className="space-y-1 min-w-0">
                          {!(userState.dailyChestClaimedTime ? new Date(userState.dailyChestClaimedTime).toDateString() === new Date().toDateString() : false) ? (
                            <>
                              <span className="text-xs font-black text-emerald-400 block uppercase">Cassa Gratuita Disponibile!</span>
                              <span className="text-[10px] text-gray-500 block">Apri per ricevere gemme e frammenti.</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-black text-zinc-400 block uppercase">Cassa Giornaliera Aperta</span>
                              <span className="text-[10px] text-gray-500 block">Apri casse extra tramite video premio.</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        {!(userState.dailyChestClaimedTime ? new Date(userState.dailyChestClaimedTime).toDateString() === new Date().toDateString() : false) ? (
                          <button 
                            onClick={() => handleOpenDailyChest(false)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                          >
                            APRI CASSA GIORNALIERA GRATUITA 📦
                          </button>
                        ) : (userState.dailyExtraAdChestsOpenedToday || 0) < 3 ? (
                          <div className="space-y-2">
                            <button 
                              onClick={() => { audio.playClick(); setActiveAd({ type: 'rewarded', rewardType: 'gacha_chest' as any }); }}
                              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Tv className="w-4 h-4" /> Apri Cassa Extra con Ad 📺 ({(userState.dailyExtraAdChestsOpenedToday || 0)}/3 oggi)
                            </button>
                            <p className="text-[10px] text-center text-gray-500">Sblocca fino a 3 casse premio extra al giorno guardando spot offline.</p>
                          </div>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-xs text-zinc-500 font-bold uppercase">
                            Casse Giornaliere Esaurite! Torna Domani ⏱️
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab: MISSIONS (Corsa Quotidiana e Missioni Attive) */}
            {activeTab === 'missions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Quartier Generale Missioni & Sfide</h2>
                  <p className="text-sm text-gray-400 font-medium">Completa la corsa quotidiana globale o porta a termine incarichi per ottenere preziose gemme.</p>
                </div>

                {/* NEON LIVE OPS - OBIETTIVI DELLA FLOTTA */}
                <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                    <span className="text-lg">⭐</span>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Missioni Neon Live del Giorno</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Daily Goal card */}
                    {(() => {
                      const todayGoal = NeonLiveOpsSystem.getTodayGoal();
                      const currentProgressVal = userState.dailyGoalProgress?.[todayGoal.id] || 0;
                      const isGoalFinished = currentProgressVal >= todayGoal.targetValue;
                      const isGoalClaimed = userState.dailyGoalClaimedDate === new Date().toDateString();
                      const progressPercentage = Math.min(100, Math.round((currentProgressVal / todayGoal.targetValue) * 100));

                      return (
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 space-y-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-yellow-400 uppercase tracking-widest">Obiettivo del Giorno</span>
                              <span className="text-[10px] font-mono text-zinc-500">{currentProgressVal}/{todayGoal.targetValue}</span>
                            </div>
                            <h4 className="text-sm font-black text-white">{todayGoal.title}</h4>
                            <p className="text-[11px] text-zinc-400">{todayGoal.description}</p>
                          </div>

                          <div className="space-y-2">
                            {/* Progress bar */}
                            <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase">Premio: <span className="text-yellow-400">100 💎</span></span>
                              {isGoalClaimed ? (
                                <span className="text-xs text-emerald-400 font-black flex items-center gap-1 uppercase">
                                  ✓ Riscattato
                                </span>
                              ) : isGoalFinished ? (
                                <button
                                  onClick={claimDailyGoal}
                                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-[10px] uppercase shadow-lg shadow-yellow-500/20 animate-pulse hover:scale-105 transition-all cursor-pointer"
                                >
                                  RISCATTA 💎
                                </button>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-extrabold uppercase">In Corso ({progressPercentage}%)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Daily Challenge card */}
                    {(() => {
                      const todayChallenge = NeonLiveOpsSystem.getTodayChallenge();
                      const isChallengeCompleted = userState.dailyChallengeCompletedDate === new Date().toDateString();
                      const isChallengeClaimed = userState.dailyChallengeClaimedDate === new Date().toDateString();

                      return (
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 space-y-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-widest">Sfida d'Élite del Giorno</span>
                              <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${isChallengeCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400 animate-pulse'}`}>
                                {isChallengeCompleted ? 'Completata' : 'Incompleta'}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white">{todayChallenge.title}</h4>
                            <p className="text-[11px] text-zinc-400">{todayChallenge.description}</p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Premio: <span className="text-pink-400">200 💎</span></span>
                            {isChallengeClaimed ? (
                              <span className="text-xs text-emerald-400 font-black flex items-center gap-1 uppercase">
                                ✓ Riscattato
                              </span>
                            ) : isChallengeCompleted ? (
                              <button
                                onClick={claimDailyChallenge}
                                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold text-[10px] uppercase shadow-lg shadow-pink-500/20 animate-pulse hover:scale-105 transition-all cursor-pointer"
                              >
                                RISCATTA 💎
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Affrontala in Volo!</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Daily Boss Card */}
                {(() => {
                  const todayBoss = DailyBossSystem.getTodayBoss();
                  const todayRewards = DailyBossSystem.getTodayBossRewards();
                  const isBossDefeatedToday = userState.dailyBossDefeatedDate === new Date().toDateString();
                  
                  return (
                    <div className={`p-6 rounded-2xl border ${
                      isBossDefeatedToday 
                        ? 'border-zinc-800 bg-zinc-900/10' 
                        : 'border-red-500/30 bg-red-950/10 shadow-lg shadow-red-900/10'
                    } flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                          isBossDefeatedToday ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        }`}>
                          😈
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                              isBossDefeatedToday ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/25 text-red-400 animate-pulse'
                            }`}>
                              {isBossDefeatedToday ? 'Sconfitto Oggi' : 'Boss Giornaliero Disponibile!'}
                            </span>
                            {!isBossDefeatedToday && (
                              <span className="text-[10px] bg-yellow-500/25 text-yellow-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                Raro
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-white truncate">
                            {todayBoss.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {isBossDefeatedToday 
                              ? "Hai abbattuto la minaccia spaziale odierna. Torna domani per una nuova epica sfida!" 
                              : "Sconfiggilo entro oggi per riscattare gemme, un frammento speciale e un distintivo leggendario!"
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
                        {/* Rewards preview if not defeated */}
                        {!isBossDefeatedToday && (
                          <div className="flex items-center justify-around gap-3 p-2 px-3 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs">
                            <span className="text-gray-500 uppercase font-black text-[9px]">Premio:</span>
                            <span className="font-extrabold text-pink-400 flex items-center gap-0.5" title="Gemme">
                              <Gem className="w-3.5 h-3.5" /> +{todayRewards.gems}
                            </span>
                            <span className="text-yellow-400 text-sm" title={`Distintivo: ${todayRewards.badge}`}>
                              🏆
                            </span>
                            <span className="font-extrabold text-blue-400 flex items-center gap-0.5" title="Frammento astronave">
                              🛸 +{todayRewards.fragmentCount}
                            </span>
                          </div>
                        )}

                        {isBossDefeatedToday ? (
                          <div className="text-center md:text-right space-y-1 p-2 bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4">
                            <span className="text-[10px] text-zinc-500 block font-bold uppercase">Prossimo Boss tra:</span>
                            <span className="text-sm font-black font-mono text-zinc-400 tracking-wider">
                              {timeLeftUntilMidnight || "00:00:00"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { audio.playClick(); setIsDailyBossRunMode(true); setIsPlaying(true); }}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            AFFRONTA IL BOSS ⚔️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Corsa Quotidiana */}
                  <div>
                    {/* Daily Run Card */}
                    <div className="p-6 rounded-2xl border border-violet-900/60 bg-violet-950/10 flex flex-col justify-between space-y-6 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-violet-400 font-extrabold uppercase tracking-wider block">Corsa del Giorno</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/25 text-violet-300 text-[10px] font-black uppercase flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Streak: {userState.dailyStreakConsecutive || 1}d
                          </span>
                        </div>
                        
                        <h2 className="text-2xl font-black text-white mt-1">
                          Corsa Quotidiana 🌌
                        </h2>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Competi con gli altri piloti sulla mappa fissa odierna con modificatori ambientali unici e navicelle prestabilite!
                        </p>

                        {/* Today's Setup */}
                        <div className="mt-5 p-3 rounded-xl border border-violet-900/40 bg-violet-950/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-violet-900/30 pb-2">
                            <span className="text-[10px] text-violet-300 font-bold uppercase">Nave Imposta:</span>
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              🚀 {SHIPS.find(s => s.id === getDailyRunShipId())?.name}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              MODIFICATORE: {getDailyModifier().name}
                            </div>
                            <p className="text-[11px] text-gray-400 leading-normal">
                              {getDailyModifier().desc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-900/40 mt-auto">
                        {userState.lastDailyRunDate === new Date().toDateString() ? (
                          <div className="space-y-3">
                            <div className="text-[11px] text-emerald-400 font-medium text-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                              ✅ Sfida completata per oggi! Progresso streak registrato (+75 Gemme).
                            </div>
                            <button 
                              onClick={() => { audio.playClick(); setIsDailyRunMode(true); setIsPlaying(true); }}
                              className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs uppercase transition-all"
                            >
                              Allenamento Libero 🚀
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1">
                              💰 Premio: <span className="font-bold text-pink-400 flex items-center gap-0.5"><Gem className="w-3.5 h-3.5" /> +75</span> + Bonus streak!
                            </div>
                            <button 
                              onClick={() => { audio.playClick(); setIsDailyRunMode(true); setIsPlaying(true); }}
                              className="w-full px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-lg shadow-violet-600/20 transition-all"
                            >
                              AVVIA SFIDA QUOTIDIANA 🚀
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Mission Tracker */}
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm space-y-5 h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-4">
                      <div className="flex items-center gap-2">
                        <Compass className="w-5 h-5 text-blue-500" />
                        <div>
                          <h3 className="font-extrabold text-base text-white tracking-wide uppercase">Missioni Attive</h3>
                          <p className="text-xs text-gray-400 font-medium">Completa compiti speciali per guadagnare gemme bonus.</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                          PROGRESSI SINC: <span className="text-emerald-400">IN TEMPO REALE</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {/* Giornaliere (Daily) */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black tracking-widest text-zinc-500 uppercase pb-1 border-b border-zinc-900/50">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          Missioni Giornaliere
                        </div>

                        <div className="space-y-3">
                          {MissionSystem.getMissions().filter(m => m.isDaily).map(mission => {
                            const progress = MissionSystem.getProgress(userState, mission);
                            const isCompleted = MissionSystem.isCompleted(userState, mission);
                            const isClaimed = MissionSystem.isClaimed(userState, mission.id);
                            const progressPercentage = Math.min(100, Math.round((progress / mission.target) * 100));

                            return (
                              <div key={mission.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors flex flex-col justify-between gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-extrabold text-white">{mission.title}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase border border-blue-500/20">GIORNALIERA</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-normal">{mission.description}</p>
                                  </div>
                                  <span className="text-xs font-black text-pink-400 flex items-center gap-1 shrink-0 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                                    <Gem className="w-3.5 h-3.5" /> +{mission.rewardGems}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-gray-500">Progresso</span>
                                    <span className={isCompleted ? "text-emerald-400" : "text-blue-400"}>
                                      {Math.min(progress, mission.target)} / {mission.target} ({progressPercentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isClaimed ? 'bg-zinc-700' : isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                      }`}
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Claim Button */}
                                <div>
                                  {isClaimed ? (
                                    <div className="w-full py-2 rounded-lg border border-zinc-850 bg-zinc-900/10 text-center text-[10px] text-zinc-500 font-bold uppercase flex items-center justify-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> Premio Riscattato
                                    </div>
                                  ) : isCompleted ? (
                                    <button
                                      onClick={() => handleClaimMission(mission.id)}
                                      className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-400" /> Riscatta {mission.rewardGems} Gemme
                                    </button>
                                  ) : (
                                    <div className="w-full py-2 rounded-lg border border-zinc-900/30 bg-zinc-950/20 text-center text-[10px] text-zinc-500 font-bold uppercase">
                                      In Corso...
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Settimanali (Weekly) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-xs font-black tracking-widest text-zinc-500 uppercase pb-1 border-b border-zinc-900/50">
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                          Missioni Settimanali
                        </div>

                        <div className="space-y-3">
                          {MissionSystem.getMissions().filter(m => !m.isDaily).map(mission => {
                            const progress = MissionSystem.getProgress(userState, mission);
                            const isCompleted = MissionSystem.isCompleted(userState, mission);
                            const isClaimed = MissionSystem.isClaimed(userState, mission.id);
                            const progressPercentage = Math.min(100, Math.round((progress / mission.target) * 100));

                            return (
                              <div key={mission.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors flex flex-col justify-between gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-extrabold text-white">{mission.title}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase border border-purple-500/20">SETTIMANALE</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-normal">{mission.description}</p>
                                  </div>
                                  <span className="text-xs font-black text-pink-400 flex items-center gap-1 shrink-0 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                                    <Gem className="w-3.5 h-3.5" /> +{mission.rewardGems}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-gray-500">Progresso</span>
                                    <span className={isCompleted ? "text-emerald-400" : "text-purple-400"}>
                                      {Math.min(progress, mission.target)} / {mission.target} ({progressPercentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isClaimed ? 'bg-zinc-700' : isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                      }`}
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Claim Button */}
                                <div>
                                  {isClaimed ? (
                                    <div className="w-full py-2 rounded-lg border border-zinc-850 bg-zinc-900/10 text-center text-[10px] text-zinc-500 font-bold uppercase flex items-center justify-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> Premio Riscattato
                                    </div>
                                  ) : isCompleted ? (
                                    <button
                                      onClick={() => handleClaimMission(mission.id)}
                                      className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-400" /> Riscatta {mission.rewardGems} Gemme
                                    </button>
                                  ) : (
                                    <div className="w-full py-2 rounded-lg border border-zinc-900/30 bg-zinc-950/20 text-center text-[10px] text-zinc-500 font-bold uppercase">
                                      In Corso...
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: GARAGE (Astronavi sbloccabili & Upgrades) */}
            {activeTab === 'garage' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Officina & Garage Retro-Futurista</h2>
                    <p className="text-sm text-gray-400">Sblocca nuove potenti astronavi o migliora i tuoi moduli di supporto permanenti.</p>
                  </div>

                  {/* Sub-tabs selector */}
                  <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start">
                    <button
                      onClick={() => { audio.playClick(); setGarageSubTab('ships'); }}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        garageSubTab === 'ships'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Flotta Astronavi
                    </button>
                    <button
                      onClick={() => { audio.playClick(); setGarageSubTab('upgrades'); }}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        garageSubTab === 'upgrades'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                      Moduli / Upgrade
                    </button>
                  </div>
                </div>

                {garageSubTab === 'ships' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SHIPS.map((ship) => {
                      const isTrialActive = userState.trialShip?.shipId === ship.id && Date.now() < (userState.trialShip?.expiresAt || 0);
                      const isOwned = userState.ownedShips.includes(ship.id) || isTrialActive;
                      const isEquipped = userState.equippedShip === ship.id;
                      const fragmentsCount = userState.shipFragments?.[ship.id] || 0;
                      
                      // Fleet stats
                      const shipFleet = userState.fleet?.[ship.id] || { level: 1, xp: 0, matchesPlayed: 0, enemiesDestroyed: 0 };
                      const nextLevelXp = NeonLiveOpsSystem.getShipNextLevelXp(shipFleet.level);
                      const xpPercentage = Math.min(100, Math.round((shipFleet.xp / nextLevelXp) * 100));

                      return (
                        <div 
                          key={ship.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isEquipped 
                              ? 'border-blue-500 bg-blue-950/10 shadow-lg shadow-blue-500/5' 
                              : isOwned 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700' 
                                : 'border-zinc-900 bg-zinc-950/40 opacity-80'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-lg text-white">{ship.name}</h3>
                                {ship.isPremium && (
                                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/25 text-yellow-400 text-[10px] font-black uppercase flex items-center gap-0.5">
                                    <Crown className="w-3 h-3" /> VIP
                                  </span>
                                )}
                                {isTrialActive && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 text-[10px] font-black uppercase flex items-center gap-1 border border-blue-500/30 animate-pulse">
                                    ⏱️ IN PROVA
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-blue-600/10 border border-blue-500/25 text-[10px] font-extrabold text-blue-400 uppercase">
                                  Flotta: Liv. {shipFleet.level}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{ship.description}</p>
                            </div>

                            <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                              <span className="text-2xl" style={{ color: ship.color }}>🚀</span>
                            </div>
                          </div>

                          {/* Stats mini bar with fleet active boosts */}
                          <div className="grid grid-cols-3 gap-3 my-4 p-2 bg-zinc-950/50 rounded-lg border border-zinc-900/50 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase">Velocità</span>
                              <span className="font-extrabold text-white">
                                {ship.speed}/10 
                                {shipFleet.level > 1 && (
                                  <span className="text-[10px] text-emerald-400 block font-normal">+{((shipFleet.level - 1) * 2)}%</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase">Cadenza</span>
                              <span className="font-extrabold text-white">
                                {((1000 - ship.fireRate) / 100).toFixed(1)}/10
                                {shipFleet.level > 1 && (
                                  <span className="text-[10px] text-emerald-400 block font-normal">+{((shipFleet.level - 1) * 1.5).toFixed(1)}%</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase">Salute</span>
                              <span className="font-extrabold text-white">
                                {ship.health} ❤️
                                {Math.floor((shipFleet.level - 1) / 3) > 0 && (
                                  <span className="text-[10px] text-emerald-400 block font-normal">+{Math.floor((shipFleet.level - 1) / 3)} ❤️</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Fleet XP Progress bar */}
                          <div className="my-3 space-y-1 bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-900/30">
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="text-zinc-500 uppercase">Esperienza Flotta (XP)</span>
                              <span className="text-blue-400">
                                {shipFleet.xp} / {nextLevelXp} XP
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/40">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${xpPercentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-zinc-500 font-medium pt-0.5">
                              <span>Partite: {shipFleet.matchesPlayed || 0}</span>
                              <span>Nemici Abbat.: {shipFleet.enemiesDestroyed || 0}</span>
                            </div>
                          </div>

                          {/* Ship Fragments progress bar if not starter */}
                          {ship.id !== 'starter' && (
                            <div className="my-3 space-y-1 bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/30">
                              <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-zinc-500 uppercase">Frammenti Di Assemblaggio</span>
                                <span className={fragmentsCount >= 10 ? "text-yellow-400 font-extrabold" : "text-gray-400"}>
                                  {fragmentsCount} / 10
                                </span>
                              </div>
                              <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    fragmentsCount >= 10 
                                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse' 
                                      : 'bg-zinc-700'
                                  }`}
                                  style={{ width: `${Math.min(100, (fragmentsCount / 10) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                            {isEquipped ? (
                              <span className="text-xs text-blue-400 font-extrabold flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4" /> Equipaggiato
                              </span>
                            ) : isOwned ? (
                              <button 
                                onClick={() => handleEquipShip(ship.id)}
                                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                              >
                                Equipaggia
                              </button>
                            ) : fragmentsCount >= 10 ? (
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs text-yellow-400 font-extrabold flex items-center gap-1">
                                  🛠️ 10/10 Frammenti pronti!
                                </span>
                                <button 
                                  onClick={() => handleCraftShip(ship.id)}
                                  className="px-4 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-md flex items-center gap-1 animate-pulse"
                                >
                                  Assembla Gratis 🛠️
                                </button>
                              </div>
                            ) : ship.isPremium ? (
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs text-yellow-400 font-medium">Sbloccabile con abbonamento VIP</span>
                                <button 
                                  onClick={() => { audio.playClick(); setIsShopOpen(true); }}
                                  className="px-4 py-1.5 text-xs font-black rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white flex items-center gap-1 shadow-md"
                                >
                                  <Crown className="w-3.5 h-3.5" /> Abbonati
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-bold text-pink-400 flex items-center gap-1 font-mono">
                                  <Gem className="w-3.5 h-3.5" /> {ship.priceGems}
                                </span>
                                <button 
                                  onClick={() => handleUnlockShip(ship.id, ship.priceGems)}
                                  disabled={userState.gems < ship.priceGems}
                                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    userState.gems >= ship.priceGems 
                                      ? 'bg-pink-600 hover:bg-pink-500 text-white' 
                                      : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  Sblocca
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {EconomySystem.getUpgrades(userState).map((upgrade) => {
                      const isMax = upgrade.currentLevel >= upgrade.maxLevel;
                      const cost = EconomySystem.getUpgradeCost(upgrade.baseCost, upgrade.currentLevel);
                      const canAfford = userState.gems >= cost;

                      // Choose icon and styles
                      let IconComponent = Zap;
                      let iconColor = 'text-yellow-400';
                      if (upgrade.id === 'magnet_range') {
                        IconComponent = Sparkles;
                        iconColor = 'text-emerald-400';
                      } else if (upgrade.id === 'shield_duration') {
                        IconComponent = Shield;
                        iconColor = 'text-blue-400';
                      }

                      return (
                        <div 
                          key={upgrade.id}
                          className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-5"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className={`p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 ${iconColor}`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-mono tracking-wider font-extrabold text-zinc-500 uppercase">
                                Modulo Permanente
                              </span>
                            </div>

                            <div>
                              <h3 className="font-extrabold text-base text-white">{upgrade.name}</h3>
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {upgrade.description}
                              </p>
                            </div>

                            {/* Level Visual indicator (pips) */}
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500">Grado Sviluppo</span>
                                <span className="font-black text-white font-mono">{upgrade.currentLevel} / {upgrade.maxLevel}</span>
                              </div>
                              <div className="flex gap-1">
                                {Array.from({ length: upgrade.maxLevel }).map((_, idx) => {
                                  const isActive = idx < upgrade.currentLevel;
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`h-2 flex-1 rounded-sm transition-all ${
                                        isActive 
                                          ? 'bg-blue-500 shadow-sm shadow-blue-500/50' 
                                          : 'bg-zinc-850'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-2">
                            {isMax ? (
                              <div className="w-full text-center py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs font-black text-zinc-500 uppercase tracking-widest">
                                GRADO MASSIMO 🏆
                              </div>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-pink-400 flex items-center gap-1 font-mono">
                                  <Gem className="w-4 h-4 animate-pulse" /> {cost}
                                </span>
                                <button
                                  onClick={() => handleUpgrade(upgrade.id)}
                                  disabled={!canAfford}
                                  className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                                    canAfford
                                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-600/20'
                                      : 'bg-zinc-850 text-zinc-600 cursor-not-allowed border border-zinc-900'
                                  }`}
                                >
                                  Migliora
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: ACHIEVEMENTS (Obiettivi e Sandbox options) */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Obiettivi & Statistiche Offline</h2>
                  <p className="text-sm text-gray-400">Raggiungi traguardi speciali per dimostrare la tua abilità o usa le opzioni sandbox di sviluppo fittizie per sbloccare tutto.</p>
                </div>

                {/* Daily Boss Badges Collection */}
                <div className="p-6 rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-950/5 to-zinc-950 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white uppercase tracking-wider">Distintivi Boss Giornalieri</h3>
                        <p className="text-xs text-gray-400">Sconfiggi ciascun boss nel suo giorno speciale per completare la bacheca leggendaria.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
                      <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold leading-none">Streak Globale</span>
                        <span className="text-sm font-black text-white leading-none font-mono">{userState.dailyStreakConsecutive || 1} Giorni</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                      { name: "Asteroid Colossus", day: "Lunedì", badge: "Colossus Crusher", icon: "🗿", color: "from-amber-600 to-yellow-500", text: "Polverizzatore di asteroidi titanici." },
                      { name: "Neon Serpent", day: "Martedì", badge: "Serpent Slayer", icon: "🐉", color: "from-emerald-600 to-green-400", text: "Tagliatore delle spire cibernetiche." },
                      { name: "Void Drone", day: "Mercoledì", badge: "Void Demolisher", icon: "🛸", color: "from-blue-600 to-indigo-400", text: "Smantellatore di sentinelle del vuoto." },
                      { name: "Plasma Core", day: "Giovedì", badge: "Core Overloader", icon: "☀️", color: "from-red-600 to-orange-400", text: "Disattivatore di reattori stellari." },
                      { name: "Quantum Crusher", day: "Venerdì", badge: "Quantum Disruptor", icon: "⚛️", color: "from-purple-600 to-pink-400", text: "Interruttore di singolarità quantistiche." },
                      { name: "Solar Leviathan", day: "Sabato", badge: "Leviathan Tamer", icon: "🐋", color: "from-yellow-600 to-amber-400", text: "Dominatore dei mari di fuoco solare." },
                      { name: "Abyss Titan", day: "Domenica", badge: "Titan Conqueror", icon: "👹", color: "from-rose-700 to-red-500", text: "Esorcista dei titani del profondo cosmo." }
                    ].map((bossItem, idx) => {
                      const hasBadge = (userState.dailyBossBadgesCollected || []).includes(bossItem.badge);
                      return (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all relative group ${
                            hasBadge 
                              ? 'border-red-500/30 bg-red-950/5 shadow-md shadow-red-500/5' 
                              : 'border-zinc-900 bg-zinc-900/10 opacity-40 hover:opacity-60'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2.5 relative ${
                            hasBadge 
                              ? `bg-gradient-to-br ${bossItem.color} shadow-lg text-white` 
                              : 'bg-zinc-800 text-zinc-600'
                          }`}>
                            {bossItem.icon}
                            {hasBadge && (
                              <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-[8px] font-black text-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-950">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">{bossItem.day}</span>
                          <span className="text-[11px] font-extrabold text-white truncate w-full mt-0.5" title={bossItem.name}>
                            {bossItem.name}
                          </span>
                          
                          {/* Tooltip detail */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-left text-[10px] hidden group-hover:block z-20 shadow-xl">
                            <span className="block font-extrabold text-white uppercase text-[9px] mb-0.5">{bossItem.badge}</span>
                            <span className="block text-zinc-400 leading-normal mb-1">{bossItem.text}</span>
                            <span className={`block font-bold uppercase text-[8px] ${hasBadge ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {hasBadge ? '✅ Sbloccato' : `❌ Affrontalo il ${bossItem.day}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats list */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                    <h3 className="font-bold text-base text-white">Punteggio Massimo Corrente</h3>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">RECORD ASSOLUTO</span>
                        <span className="text-2xl font-black text-white font-mono">{userState.highscore} punti</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 space-y-2 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Video pubblicitari guardati:</span>
                        <span className="font-bold text-white">{userState.adsWatchedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Abbonamento VIP attivo:</span>
                        <span className="font-bold text-yellow-400">{userState.isPremium ? 'Sì (GOLD)' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annunci rimossi:</span>
                        <span className="font-bold text-blue-400">{userState.isAdFree ? 'Sì (Senza Banner)' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox helper & developer controls to easily test monetization flow */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-white">Pannello Sandbox Sviluppatore</h3>
                      <p className="text-xs text-gray-400 mt-1">Strumenti rapidi per testare la monetizzazione offline, sbloccare valute o pulire la cache di archiviazione fittizia.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <button 
                        onClick={handleAddGemsCheat}
                        className="py-2.5 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Aggiungi +250 Gemme Offline gratis
                      </button>

                      <button 
                        onClick={handleResetProgress}
                        className="py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Resetta Completamente i Dati Locali
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: BATTLE PASS (Pass Battaglia Cyber Season) */}
            {activeTab === 'battlepass' && (
              <div className="space-y-6">
                
                {/* Header card */}
                <div className="p-6 rounded-3xl border border-pink-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900/40 to-pink-950/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* Glowing ambient dots */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                  
                  <div className="space-y-3 flex-1 w-full text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-400 font-extrabold text-[10px] uppercase rounded-full tracking-widest animate-pulse">
                        STAGIONE 1: CYBER SPEEDWAYS
                      </span>
                      {userState.isPremium ? (
                        <span className="px-3 py-1 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-extrabold text-[10px] uppercase rounded-full tracking-widest flex items-center gap-1">
                          <Crown className="w-3 h-3 text-yellow-400" /> PASS PREMIUM ATTIVO
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-850 border border-zinc-700 text-zinc-400 font-extrabold text-[10px] uppercase rounded-full tracking-widest">
                          PASS GRATUITO ATTIVO
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">
                      Pass Battaglia <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">Cyber Season</span>
                    </h2>
                    
                    <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                      Guadagna XP completando corse nello spazio! Ogni 100 XP sblocchi un nuovo livello e puoi riscattare favolosi premi sia gratuiti che esclusivi VIP.
                    </p>

                    {/* XP Progress breakdown */}
                    {(() => {
                      const totalXp = userState.battlePassXp || 0;
                      const currentLevel = Math.floor(totalXp / 100) + 1;
                      const xpInCurrentLevel = totalXp % 100;
                      const percent = Math.min(100, xpInCurrentLevel);
                      return (
                        <div className="pt-2 space-y-1.5 max-w-md w-full">
                          <div className="flex justify-between text-xs font-bold text-gray-300">
                            <span className="text-pink-400 font-black">LIVELLO {currentLevel} <span className="text-gray-500 font-normal">({totalXp} XP totali)</span></span>
                            <span>{xpInCurrentLevel} / 100 XP</span>
                          </div>
                          <div className="w-full h-3 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-600 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)] transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions / Shop button link */}
                  <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
                    {!userState.isPremium && (
                      <button
                        onClick={() => { audio.playClick(); setIsShopOpen(true); }}
                        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs uppercase rounded-xl shadow-lg shadow-yellow-500/15 transition-all flex items-center justify-center gap-2 border border-yellow-400/40"
                      >
                        <Crown className="w-4 h-4 fill-black" /> SBLOCCA PASS PREMIUM (VIP)
                      </button>
                    )}
                    <button
                      onClick={handleAddXpCheat}
                      className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-450 hover:text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-pink-500 animate-pulse" /> +150 XP Battaglia (Sandbox)
                    </button>
                  </div>
                </div>

                {/* Toast alerts for claiming rewards */}
                {bpAlert && (
                  <div className="p-3.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-200 text-xs font-black text-center animate-bounce shadow-xl shadow-pink-500/10">
                    🎉 {bpAlert}
                  </div>
                )}

                {/* Level rewards grid layout */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                    <span>LIVELLI E PREMI DISPONIBILI</span>
                    <span>GRATUITO VS PREMIUM (VIP)</span>
                  </div>

                  <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                    {BATTLE_PASS_TIERS.map((tier) => {
                      const totalXp = userState.battlePassXp || 0;
                      const currentLevel = Math.floor(totalXp / 100) + 1;
                      const isLevelUnlocked = currentLevel >= tier.level;
                      
                      const claimedFree = userState.claimedBattlePassRewardsFree || [];
                      const claimedPremium = userState.claimedBattlePassRewardsPremium || [];
                      
                      const isFreeClaimed = claimedFree.includes(tier.level);
                      const isPremiumClaimed = claimedPremium.includes(tier.level);
                      
                      const isPremiumUser = userState.isPremium;

                      // Conditions
                      const canClaimFree = isLevelUnlocked && !isFreeClaimed;
                      const canClaimPremium = isLevelUnlocked && isPremiumUser && !isPremiumClaimed;

                      return (
                        <div 
                          key={tier.level}
                          className={`p-4 rounded-2xl border transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${
                            isLevelUnlocked 
                              ? 'border-zinc-800 bg-zinc-900/20' 
                              : 'border-zinc-950 bg-zinc-950/40 opacity-60'
                          }`}
                        >
                          {/* LEVEL BADGE */}
                          <div className="md:col-span-2 flex flex-row md:flex-col items-center justify-between md:justify-center text-center gap-1.5 md:border-r border-zinc-800/60 md:pr-4">
                            <div className="text-left md:text-center">
                              <span className="text-[10px] text-zinc-500 font-extrabold uppercase block tracking-wider">LIVELLO</span>
                              <span className={`text-2xl font-black font-mono leading-none block ${isLevelUnlocked ? 'text-pink-500' : 'text-zinc-600'}`}>
                                {tier.level < 10 ? `0${tier.level}` : tier.level}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-[9px] font-bold">
                              {isLevelUnlocked ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest text-[8px]">
                                  SBLOCCATO
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase tracking-widest text-[8px]">
                                  {tier.xpNeeded} XP
                                </span>
                              )}
                            </div>
                          </div>

                          {/* REWARDS SPLIT */}
                          <div className="md:col-span-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* FREE REWARD PANEL */}
                            <div className={`p-3 rounded-xl border flex flex-col justify-between text-left gap-3 ${
                              isFreeClaimed 
                                ? 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500' 
                                : canClaimFree 
                                  ? 'bg-pink-950/5 border-pink-500/20 text-white shadow-sm' 
                                  : 'bg-zinc-900/10 border-zinc-900 text-zinc-400'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">PREMIO GRATUITO</span>
                                {isFreeClaimed && (
                                  <span className="text-[9px] font-bold text-zinc-600 uppercase flex items-center gap-1">✔️ Riscattato</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 py-1">
                                <span className="text-xl">🎁</span>
                                <span className={`text-xs font-extrabold ${isFreeClaimed ? 'line-through text-zinc-600' : 'text-white'}`}>
                                  {tier.freeReward.name}
                                </span>
                              </div>

                              <button
                                onClick={() => handleClaimBattlePassReward(tier.level, false)}
                                disabled={!canClaimFree}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                  canClaimFree 
                                    ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer shadow-md active:scale-95' 
                                    : isFreeClaimed 
                                      ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                                      : 'bg-zinc-850 text-zinc-500 cursor-not-allowed'
                                }`}
                              >
                                {isFreeClaimed ? 'Riscattato' : canClaimFree ? 'Riscatta Ora' : 'Bloccato'}
                              </button>
                            </div>

                            {/* PREMIUM REWARD PANEL */}
                            <div className={`p-3 rounded-xl border flex flex-col justify-between text-left gap-3 relative overflow-hidden ${
                              isPremiumClaimed 
                                ? 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500' 
                                : canClaimPremium 
                                  ? 'bg-yellow-950/10 border-yellow-500/30 text-white shadow shadow-yellow-500/5' 
                                  : 'bg-zinc-900/10 border-zinc-900 text-zinc-400'
                            }`}>
                              {/* Premium VIP glowing effect */}
                              {isPremiumUser && canClaimPremium && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500/5 rounded-full blur-xl animate-pulse" />
                              )}

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-yellow-500 animate-bounce" /> PREMIO VIP PREMIUM
                                </span>
                                {isPremiumClaimed ? (
                                  <span className="text-[9px] font-bold text-yellow-600 uppercase flex items-center gap-1">✔️ Riscattato</span>
                                ) : !isPremiumUser && (
                                  <span className="text-[9px] font-black text-yellow-500 uppercase flex items-center gap-1">🔓 Richiede VIP</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 py-1">
                                <span className="text-xl">👑</span>
                                <span className={`text-xs font-extrabold ${isPremiumClaimed ? 'line-through text-zinc-600' : 'text-white'}`}>
                                  {tier.premiumReward.name}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  if (isPremiumUser) {
                                    handleClaimBattlePassReward(tier.level, true);
                                  } else {
                                    audio.playClick();
                                    setIsShopOpen(true);
                                  }
                                }}
                                disabled={isLevelUnlocked ? false : true}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                  canClaimPremium 
                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer shadow-md active:scale-95 font-black' 
                                    : isPremiumClaimed 
                                      ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                                      : !isPremiumUser 
                                        ? 'bg-zinc-850 hover:bg-yellow-500/20 text-yellow-500 hover:text-white border border-yellow-500/15 cursor-pointer font-bold'
                                        : 'bg-zinc-850 text-zinc-500 cursor-not-allowed'
                                }`}
                              >
                                {isPremiumClaimed 
                                  ? 'Riscattato' 
                                  : canClaimPremium 
                                    ? 'Riscatta Ora' 
                                    : !isPremiumUser 
                                      ? 'Attiva VIP per Riscattare' 
                                      : 'Bloccato'}
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Banner Ad Overlay persistently at bottom on dashboard, hidden for Premium/VIP */}
      {!isPlaying && (
        <AdOverlay 
          type="banner"
          onClose={() => {}}
          isAdFree={userState.isAdFree}
          isPremium={userState.isPremium}
        />
      )}

      {/* Full screen video rewarded or interstitial advertisements */}
      {activeAd && (
        <AdOverlay 
          type={activeAd.type}
          rewardType={activeAd.rewardType}
          onClose={handleAdClose}
          isAdFree={userState.isAdFree}
          isPremium={userState.isPremium}
        />
      )}

      {/* Interactive In-App Purchases store Modal */}
      <ShopModal 
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        userState={userState}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      {/* Chest Rewards Gacha Reveal Modal */}
      {openedChestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl border border-yellow-500/30 bg-zinc-950/90 shadow-2xl shadow-yellow-500/10 text-center space-y-6 relative overflow-hidden">
            {/* Background glowing lights */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

            <div className="space-y-2">
              <div className="inline-flex p-3 bg-yellow-500/10 rounded-full text-yellow-400 border border-yellow-500/20 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-200">
                Scrigno Aperto!
              </h2>
              <p className="text-xs text-gray-400">Hai ottenuto i seguenti materiali rari:</p>
            </div>

            <div className="space-y-3 py-2">
              {/* Gems reward card */}
              <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💎</span>
                  <div className="text-left">
                    <span className="block font-black text-white text-sm">Gemme Di Neon</span>
                    <span className="text-[10px] text-pink-400 font-bold uppercase">Valuta Premium</span>
                  </div>
                </div>
                <span className="text-xl font-black text-pink-400 font-mono">+{openedChestResult.gemsReward}</span>
              </div>

              {/* Fragment reward card */}
              {openedChestResult.shipFragmentReward && (() => {
                const targetShip = SHIPS.find(s => s.id === openedChestResult.shipFragmentReward?.shipId);
                return (
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" style={{ color: targetShip?.color || '#ffffff' }}>🚀</span>
                      <div className="text-left">
                        <span className="block font-black text-white text-sm">Frammento di {targetShip?.name || 'Astronave'}</span>
                        <span className="text-[10px] text-blue-400 font-bold uppercase">Materiale Di Assemblaggio</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-blue-400 font-mono">+{openedChestResult.shipFragmentReward?.count}</span>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => {
                audio.playClick();
                setOpenedChestResult(null);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-md shadow-yellow-500/10 active:scale-95"
            >
              Raccogli Ricompense 📦
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
