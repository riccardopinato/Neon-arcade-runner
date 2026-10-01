import { UserState } from '../types';

export const SAVE_KEY = 'neon_runner_profile';
export const SAVE_VERSION = 1;

export const DEFAULT_USER_STATE: UserState = {
  isPremium: false,
  isAdFree: false,
  gems: 50, // Start with some free gems
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
  upgradeLevels: { laser_damage: 1, magnet_range: 1, shield_duration: 1 },
  dailyStreak: 0,
  lastLoginDate: "",
  totalMatchesPlayed: 0,
  highestDistance: 0,
  highestCombo: 0,
  highestGemsSingleRun: 0,
  claimedMissions: [],
  totalGemsCollected: 0,
  totalEnemiesDestroyed: 0,
  totalDistanceTraveled: 0
};

export class StorageSystem {
  static loadProfile(): UserState {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) {
        return { ...DEFAULT_USER_STATE };
      }
      
      const parsed = JSON.parse(saved);
      
      // Basic migrations / upgrades if version differences arise
      if (parsed.version && parsed.version < SAVE_VERSION) {
        // Handle migration steps here when schemas change in production Sprints
      }

      // Merge deep objects carefully
      const activeBoosts = {
        ...DEFAULT_USER_STATE.activeBoosts,
        ...(parsed.activeBoosts || {})
      };

      return {
        ...DEFAULT_USER_STATE,
        ...parsed,
        activeBoosts
      };
    } catch (error) {
      console.error('Storage corruption detected! Reverting to safe fallback state.', error);
      return { ...DEFAULT_USER_STATE };
    }
  }

  static saveProfile(state: UserState): void {
    try {
      const dataToSave = {
        ...state,
        version: SAVE_VERSION,
        updatedAt: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to write save profile to localStorage', error);
    }
  }

  static resetProfile(): UserState {
    localStorage.removeItem(SAVE_KEY);
    return { ...DEFAULT_USER_STATE };
  }
}
