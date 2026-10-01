export interface Ship {
  id: string;
  name: string;
  description: string;
  speed: number;
  fireRate: number;
  health: number;
  priceGems: number;
  isPremium: boolean;
  color: string;
  secondaryColor: string;
  bulletColor: string;
}

export interface UserState {
  isPremium: boolean;
  isAdFree: boolean;
  gems: number;
  coins: number;
  highscore: number;
  equippedShip: string;
  ownedShips: string[];
  activeBoosts: {
    shieldUntil: number; // timestamp in ms
    magnetUntil: number; // timestamp in ms
    fireBoostUntil: number; // timestamp in ms
  };
  hasExtraLife: boolean;
  adsWatchedCount: number;
  chaosModeUnlocked: boolean;
  upgradeLevels?: Record<string, number>;
  dailyStreak?: number;
  lastLoginDate?: string;
  totalMatchesPlayed?: number;
  highestDistance?: number;
  highestCombo?: number;
  highestGemsSingleRun?: number;
  claimedMissions?: string[];
  totalGemsCollected?: number;
  totalEnemiesDestroyed?: number;
  totalDistanceTraveled?: number;
  // SPRINT: MOBILE RETENTION & MONETIZATION
  dailyRunCompletedDate?: string; // Date of last completed daily run ("YYYY-MM-DD")
  dailyRunStreak?: number; // Consecutive daily run days completed
  lastDailyRunDate?: string; // Date of last daily run attempt
  dailyChestClaimedTime?: number; // Timestamp of last claimed daily chest
  postRunMatchesCount?: number; // Games played since last post-run chest (0-5)
  shipFragments?: Record<string, number>; // shipId -> current fragments count
  dailyRunLocalLeaderboards?: Record<string, Array<{ name: string; score: number; ship: string }>>; // key: date, value: leaderboards
  trialShip?: {
    shipId: string;
    expiresAt: number; // timestamp in ms
  } | null;
  // Daily mission counters (reset on day change)
  dailyEnemiesDestroyed?: number;
  dailyGemsCollected?: number;
  dailyDistanceTraveled?: number;
  dailyMatchesPlayed?: number;
  dailyAdsWatched?: number;
  dailyNearMisses?: number;
  dailyBossKills?: number;
  dailyDifferentShipsUsed?: string[];
  claimedDailyChestToday?: boolean;
  claimedWeeklyCrateThisWeek?: boolean;
  vipFreeReviveUsedToday?: boolean;
  dailyExtraAdChestsOpenedToday?: number;
  dailyStreakConsecutive?: number;
  dailyRunsCompleted?: number;
  dailyBossDefeatedDate?: string; // Date of last defeated daily boss ("YYYY-MM-DD")
  dailyBossBadgesCollected?: string[]; // Badges awarded for beating daily bosses
  // BATTLE PASS SPRINT
  battlePassXp?: number;
  claimedBattlePassRewardsFree?: number[];
  claimedBattlePassRewardsPremium?: number[];
  // NEON LIVE SYSTEM SPRINT
  dailyGoalProgress?: Record<string, number>; // goalId -> progress
  dailyGoalClaimedDate?: string; // Date of last claimed daily goal
  dailyChallengeCompletedDate?: string; // Date of last completed challenge
  dailyChallengeClaimedDate?: string; // Date of last claimed challenge reward
  lastLuckyWheelSpinDate?: string; // Date of last free spin
  prestigeLevel?: number; // Current prestige level
  prestigeStars?: number; // Prestige stars to spend on unique prestige items/skins
  fleet?: Record<string, { level: number; xp: number; matchesPlayed: number; enemiesDestroyed: number }>;
  unlockedLoreIds?: string[]; // Log of unlocked/read daily transmission IDs
  unlockedArchivioIds?: string[]; // Galactic Archive discovered items
  // FTUE AND RETENTION SPRINT
  ftueCompleted?: boolean;
  ftueStep?: 'intro' | 'welcome' | 'guided_run' | 'garage_intro' | 'store_intro' | 'completed';
  firstUpgradeFreeUsed?: boolean;
  firstLuckyWheelSpinClaimed?: boolean;
  firstChestClaimed?: boolean;
  premiumTrialUsed?: boolean;
  premiumTrialCompleted?: boolean;
  ratingState?: 'none' | 'answered_no' | 'answered_yes' | 'reviewed';
  ratingRequestedCount?: number;
  avatar?: string;
  nickname?: string;
  hudColor?: string;
  colorblindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  controlsSensitivity?: number; // scale from 0.5 to 2.0
  vibrationEnabled?: boolean;
  volumeMusic?: number; // 0 to 100
  volumeSfx?: number; // 0 to 100
  reducedParticles?: boolean;
  batterySaverMode?: boolean;
}

export interface PurchaseItem {
  id: string;
  title: string;
  description: string;
  price: string;
  type: 'subscription' | 'non-consumable' | 'consumable';
  gemsReward?: number;
  icon: string;
}

export interface GameStats {
  score: number;
  gemsCollected: number;
  distance: number;
  enemiesDestroyed: number;
  collectedFragment?: string; // Optional ship ID of fragment collected this run
  nearMisses?: number;
  bossKills?: number;
  dailyBossDefeated?: boolean; // True if the daily boss of today was defeated in this run
}
