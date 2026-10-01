export interface BalanceConfigType {
  gameplay: {
    initialMeteorSpeed: number;
    speedIncrement: number;
    initialHP: number;
    hpScaling: number;
    spawnFrequency: number; // in ms or frames
    bossFrequency: number;  // in meters or score
    powerupProbability: number; // 0 to 1
    powerupDuration: number;    // in ms
    laserDamage: number;
    laserFireRate: number;      // base fire rate
    postReviveInvulnerabilityDuration: number; // in ms
  };
  economy: {
    baseGemsPerRun: number;
    distanceBonusMultiplier: number;
    bossDefeatedBonus: number;
    nearMissBonus: number;
    dailyMissionRewardGems: number;
    weeklyCrateRewardGems: number;
    dailyStreakMultiplier: number;
    shipBasePrices: Record<string, number>;
    upgradeBaseCosts: Record<string, number>;
    skinPrices: Record<string, number>;
    missionRerollCost: number;
    premiumMultiplier: number;
    requiredFragmentsToCraft: number;
  };
  retention: {
    numberOfDailyMissions: number;
    numberOfWeeklyMissions: number;
    maxStreakDuration: number;
    chestFrequencyHours: number;
    maxDailySpins: number;
    shipTrialDurationMinutes: number;
    reviveLimitPerRun: number;
    rewardCooldownSeconds: number;
  };
  ads: {
    maxRevivesPerRun: number;
    doubleRewardAvailable: boolean;
    rewardedOfferFrequencySeconds: number;
    dailyRewardedLimit: number;
    futureInterstitialFrequencyMatches: number;
    matchesBeforeShowingOffers: number;
  };
}

export const DEFAULT_BALANCE_CONFIG: BalanceConfigType = {
  gameplay: {
    initialMeteorSpeed: 3,
    speedIncrement: 0.1,
    initialHP: 3,
    hpScaling: 1.2,
    spawnFrequency: 1000, // spawn meteor every 1000ms
    bossFrequency: 1500,  // spawn boss every 1500 meters
    powerupProbability: 0.15, // 15% chance
    powerupDuration: 8000,    // 8 seconds
    laserDamage: 1,
    laserFireRate: 350,       // 350ms between shots
    postReviveInvulnerabilityDuration: 3000, // 3 seconds
  },
  economy: {
    baseGemsPerRun: 10,
    distanceBonusMultiplier: 0.05, // 0.05 gems per meter/UA
    bossDefeatedBonus: 50,
    nearMissBonus: 5,
    dailyMissionRewardGems: 40,
    weeklyCrateRewardGems: 150,
    dailyStreakMultiplier: 1.1, // +10% per consecutive day
    shipBasePrices: {
      starter: 0,
      velocity: 150,
      dreadnought: 300,
      premium_quantum: 500,
      premium_golden: 1000,
    },
    upgradeBaseCosts: {
      laser_damage: 100,
      magnet_range: 80,
      shield_duration: 120,
    },
    skinPrices: {
      neon_classic: 0,
      cyberpunk_red: 50,
      synthwave_purple: 80,
      solar_gold: 150,
    },
    missionRerollCost: 15,
    premiumMultiplier: 2.0, // 2x rewards for premium
    requiredFragmentsToCraft: 10,
  },
  retention: {
    numberOfDailyMissions: 3,
    numberOfWeeklyMissions: 5,
    maxStreakDuration: 7, // 7 days streak target
    chestFrequencyHours: 12, // free chest every 12 hours
    maxDailySpins: 3, // lucky wheel daily spins limit
    shipTrialDurationMinutes: 10, // trial duration
    reviveLimitPerRun: 1,
    rewardCooldownSeconds: 30,
  },
  ads: {
    maxRevivesPerRun: 1,
    doubleRewardAvailable: true,
    rewardedOfferFrequencySeconds: 60,
    dailyRewardedLimit: 10,
    futureInterstitialFrequencyMatches: 3,
    matchesBeforeShowingOffers: 1,
  },
};

export class BalanceConfig {
  private static activeConfig: BalanceConfigType = { ...DEFAULT_BALANCE_CONFIG };

  static getConfig(): BalanceConfigType {
    return this.activeConfig;
  }

  static updateConfig(newConfig: Partial<BalanceConfigType>) {
    this.activeConfig = {
      ...this.activeConfig,
      ...newConfig,
    };
    this.validate();
  }

  static validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const cfg = this.activeConfig;

    // Validate Gameplay
    if (cfg.gameplay.initialMeteorSpeed <= 0) {
      errors.push("initialMeteorSpeed dev'essere maggiore di zero. Reimpostato a default.");
      cfg.gameplay.initialMeteorSpeed = DEFAULT_BALANCE_CONFIG.gameplay.initialMeteorSpeed;
    }
    if (cfg.gameplay.initialHP <= 0) {
      errors.push("initialHP dev'essere maggiore di zero. Reimpostato a default.");
      cfg.gameplay.initialHP = DEFAULT_BALANCE_CONFIG.gameplay.initialHP;
    }
    if (cfg.gameplay.spawnFrequency <= 100) {
      errors.push("spawnFrequency dev'essere almeno 100ms. Reimpostato a default.");
      cfg.gameplay.spawnFrequency = DEFAULT_BALANCE_CONFIG.gameplay.spawnFrequency;
    }
    if (cfg.gameplay.bossFrequency <= 100) {
      errors.push("bossFrequency dev'essere almeno 100 metri. Reimpostato a default.");
      cfg.gameplay.bossFrequency = DEFAULT_BALANCE_CONFIG.gameplay.bossFrequency;
    }
    if (cfg.gameplay.powerupProbability < 0 || cfg.gameplay.powerupProbability > 1) {
      errors.push("powerupProbability dev'essere compresa tra 0 e 1. Reimpostato a default.");
      cfg.gameplay.powerupProbability = DEFAULT_BALANCE_CONFIG.gameplay.powerupProbability;
    }
    if (cfg.gameplay.powerupDuration <= 0) {
      errors.push("powerupDuration dev'essere maggiore di zero. Reimpostato a default.");
      cfg.gameplay.powerupDuration = DEFAULT_BALANCE_CONFIG.gameplay.powerupDuration;
    }
    if (cfg.gameplay.laserFireRate <= 50) {
      errors.push("laserFireRate dev'essere maggiore di 50ms per motivi di performance. Reimpostato a default.");
      cfg.gameplay.laserFireRate = DEFAULT_BALANCE_CONFIG.gameplay.laserFireRate;
    }

    // Validate Economy
    if (cfg.economy.baseGemsPerRun < 0) {
      errors.push("baseGemsPerRun non può essere negativa. Reimpostato a default.");
      cfg.economy.baseGemsPerRun = DEFAULT_BALANCE_CONFIG.economy.baseGemsPerRun;
    }
    if (cfg.economy.premiumMultiplier <= 1) {
      errors.push("premiumMultiplier dev'essere maggiore di 1. Reimpostato a default.");
      cfg.economy.premiumMultiplier = DEFAULT_BALANCE_CONFIG.economy.premiumMultiplier;
    }
    if (cfg.economy.requiredFragmentsToCraft <= 0) {
      errors.push("requiredFragmentsToCraft dev'essere maggiore di zero. Reimpostato a default.");
      cfg.economy.requiredFragmentsToCraft = DEFAULT_BALANCE_CONFIG.economy.requiredFragmentsToCraft;
    }

    // Validate Retention
    if (cfg.retention.maxDailySpins <= 0) {
      errors.push("maxDailySpins dev'essere maggiore di zero. Reimpostato a default.");
      cfg.retention.maxDailySpins = DEFAULT_BALANCE_CONFIG.retention.maxDailySpins;
    }
    if (cfg.retention.shipTrialDurationMinutes <= 0) {
      errors.push("shipTrialDurationMinutes dev'essere maggiore di zero. Reimpostato a default.");
      cfg.retention.shipTrialDurationMinutes = DEFAULT_BALANCE_CONFIG.retention.shipTrialDurationMinutes;
    }

    // Validate Ads
    if (cfg.ads.dailyRewardedLimit < 0) {
      errors.push("dailyRewardedLimit non può essere negativo. Reimpostato a default.");
      cfg.ads.dailyRewardedLimit = DEFAULT_BALANCE_CONFIG.ads.dailyRewardedLimit;
    }

    if (errors.length > 0) {
      console.warn("[BalanceConfig] Errori di validazione riscontrati e corretti:", errors);
    } else {
      console.log("[BalanceConfig] Configurazione validata correttamente.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Automatic validation on module load
BalanceConfig.validate();
