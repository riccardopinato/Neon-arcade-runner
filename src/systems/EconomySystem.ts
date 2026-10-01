import { UserState } from '../types';
import { AnalyticsService } from './AnalyticsService';

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
}

export interface TransactionDetails {
  transactionType: 'credit' | 'debit';
  currencyType: 'gems' | 'coins' | 'prestige_stars' | 'fragments';
  amount: number;
  source?: 'run_reward' | 'mission_reward' | 'daily_reward' | 'weekly_reward' | 'boss_reward' | 'chest_reward' | 'rewarded_ad' | 'premium_bonus' | 'live_event_reward' | 'achievement_reward' | string;
  sink?: 'ship_unlock' | 'ship_upgrade' | 'skin_unlock' | 'chest_open' | 'mission_reroll' | 'revive_token' | 'store_purchase' | 'crafting' | 'fleet_upgrade' | string;
  relatedEvent?: string;
  runId?: string;
}

export class EconomySystem {
  /**
   * Performs a structured economic transaction, updating the UserState and tracking the transaction in Analytics.
   */
  static transact(user: UserState, details: TransactionDetails): UserState {
    const { transactionType, currencyType, amount, source, sink, relatedEvent, runId } = details;
    
    let balanceBefore = 0;
    if (currencyType === 'gems') {
      balanceBefore = user.gems || 0;
    } else if (currencyType === 'coins') {
      balanceBefore = user.coins || 0;
    } else if (currencyType === 'prestige_stars') {
      balanceBefore = user.prestigeStars || 0;
    } else if (currencyType === 'fragments') {
      // In case we want to track fragment changes broadly
      balanceBefore = 0; // standard fallback
    }

    let balanceAfter = balanceBefore;
    if (transactionType === 'credit') {
      balanceAfter = balanceBefore + amount;
    } else {
      balanceAfter = Math.max(0, balanceBefore - amount);
    }

    // Prepare updated state
    const updatedUser = { ...user };
    if (currencyType === 'gems') {
      updatedUser.gems = balanceAfter;
    } else if (currencyType === 'coins') {
      updatedUser.coins = balanceAfter;
    } else if (currencyType === 'prestige_stars') {
      updatedUser.prestigeStars = balanceAfter;
    }

    // Call Analytics to track the transaction
    AnalyticsService.trackEconomyTransaction({
      transactionType,
      currencyType,
      amount,
      balanceBefore,
      balanceAfter,
      source,
      sink,
      relatedEvent,
      runId
    });

    return updatedUser;
  }

  /**
   * Calculates the final gem payout after multipliers are applied.
   */
  static calculateFinalGems(collected: number, isPremium: boolean): number {
    const multiplier = isPremium ? 2 : 1;
    return collected * multiplier;
  }

  /**
   * Determines if a user can afford a given purchase.
   */
  static canAfford(userGems: number, cost: number): boolean {
    return userGems >= cost;
  }

  /**
   * Spawns upgrade configuration models (ready for ship modifiers)
   */
  static getUpgrades(user: UserState): UpgradeConfig[] {
    const levels = user.upgradeLevels || { laser_damage: 1, magnet_range: 1, shield_duration: 1 };
    return [
      {
        id: 'laser_damage',
        name: 'Potenza Laser',
        description: 'Aumenta il danno del proiettile di base e la dimensione dei colpi.',
        currentLevel: levels.laser_damage || 1,
        maxLevel: 5,
        baseCost: 100
      },
      {
        id: 'magnet_range',
        name: 'Raggio Magnete',
        description: 'Espande la distanza di assorbimento delle gemme e delle ricariche.',
        currentLevel: levels.magnet_range || 1,
        maxLevel: 5,
        baseCost: 80
      },
      {
        id: 'shield_duration',
        name: 'Durata Scudo',
        description: 'Estende il tempo d\'uso dei potenziamenti scudo del 15% per livello.',
        currentLevel: levels.shield_duration || 1,
        maxLevel: 5,
        baseCost: 120
      }
    ];
  }

  /**
   * Calculates the cost of upgrading to the next level.
   */
  static getUpgradeCost(baseCost: number, level: number): number {
    return Math.round(baseCost * Math.pow(1.5, level - 1));
  }
}

