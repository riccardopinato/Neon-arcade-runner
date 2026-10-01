import { UserState } from '../types';

export interface DailyBossConfig {
  id: string;
  name: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ...
  dayName: string;
  description: string;
  maxHp: number;
  color: string;
  patternType: 'colossus' | 'serpent' | 'drone_summoner' | 'plasma_core' | 'quantum_crusher' | 'solar_leviathan' | 'abyss_titan';
  rewards: {
    gems: number;
    fragments: { shipId: string; count: number };
    badge: string;
  };
}

export const DAILY_BOSSES: DailyBossConfig[] = [
  {
    id: 'abyss_titan',
    name: 'Abyss Titan',
    dayIndex: 0,
    dayName: 'Domenica',
    description: 'Genera varchi gravitazionali e lancia sfere di energia oscura a movimento controllato.',
    maxHp: 130,
    color: '#3b82f6', // Royal Blue
    patternType: 'abyss_titan',
    rewards: {
      gems: 50,
      fragments: { shipId: 'dreadnought', count: 2 },
      badge: 'Abyss Titan Badge 🏆'
    }
  },
  {
    id: 'asteroid_colossus',
    name: 'Asteroid Colossus',
    dayIndex: 1,
    dayName: 'Lunedì',
    description: 'Mega-corazzato minerario che spara sventagliate laser a 3 vie ad alto impatto.',
    maxHp: 110,
    color: '#a855f7', // Purple/Violet
    patternType: 'colossus',
    rewards: {
      gems: 40,
      fragments: { shipId: 'velocity', count: 2 },
      badge: 'Colossus Annihilator Badge 🎖️'
    }
  },
  {
    id: 'neon_serpent',
    name: 'Neon Serpent',
    dayIndex: 2,
    dayName: 'Martedì',
    description: 'Flette e ondeggia da un lato all\'altro, seminando sferzate termiche continue.',
    maxHp: 90,
    color: '#10b981', // Emerald
    patternType: 'serpent',
    rewards: {
      gems: 40,
      fragments: { shipId: 'premium_quantum', count: 2 },
      badge: 'Serpent Slayer Badge 🐍'
    }
  },
  {
    id: 'void_drone',
    name: 'Void Drone',
    dayIndex: 3,
    dayName: 'Mercoledì',
    description: 'Droni protettivi ruotanti a barriera ed emissione periodica di impulsi quantistici.',
    maxHp: 85,
    color: '#22d3ee', // Cyan
    patternType: 'drone_summoner',
    rewards: {
      gems: 40,
      fragments: { shipId: 'premium_golden', count: 2 },
      badge: 'Void Demolisher Badge 🛰️'
    }
  },
  {
    id: 'plasma_core',
    name: 'Plasma Core',
    dayIndex: 4,
    dayName: 'Giovedì',
    description: 'Emette anelli gravitazionali rotanti e flussi alternati di laser ionizzanti.',
    maxHp: 100,
    color: '#eab308', // Amber/Yellow
    patternType: 'plasma_core',
    rewards: {
      gems: 45,
      fragments: { shipId: 'velocity', count: 2 },
      badge: 'Core Disrupter Badge ⚡'
    }
  },
  {
    id: 'quantum_crusher',
    name: 'Quantum Crusher',
    dayIndex: 5,
    dayName: 'Venerdì',
    description: 'Svanisce ed effettua traslazioni rapide, caricando missili a ricerca termo-ionici.',
    maxHp: 95,
    color: '#ec4899', // Pink
    patternType: 'quantum_crusher',
    rewards: {
      gems: 45,
      fragments: { shipId: 'premium_quantum', count: 2 },
      badge: 'Quantum Breaker Badge 🌀'
    }
  },
  {
    id: 'solar_leviathan',
    name: 'Solar Leviathan',
    dayIndex: 6,
    dayName: 'Sabato',
    description: 'Sfrutta flare solari ambientali ad area e scaglia colpi termici devastanti.',
    maxHp: 120,
    color: '#f97316', // Orange
    patternType: 'solar_leviathan',
    rewards: {
      gems: 50,
      fragments: { shipId: 'premium_golden', count: 2 },
      badge: 'Leviathan Exterminator Badge ☀️'
    }
  }
];

export class DailyBossSystem {
  static getTodayDateString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  static getTodayBoss(): DailyBossConfig {
    const day = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    const boss = DAILY_BOSSES.find(b => b.dayIndex === day);
    return boss || DAILY_BOSSES[0];
  }

  static getTodayBossRewards() {
    const boss = this.getTodayBoss();
    return {
      gems: boss.rewards.gems,
      fragmentShipId: boss.rewards.fragments.shipId,
      fragmentCount: boss.rewards.fragments.count,
      badge: boss.rewards.badge
    };
  }

  static isBossDefeatedToday(profile: UserState): boolean {
    if (!profile.dailyBossDefeatedDate) return false;
    const todayStr = this.getTodayDateString();
    return profile.dailyBossDefeatedDate === todayStr;
  }

  static getMsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  static getFormattedCountdown(): string {
    const ms = this.getMsUntilMidnight();
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }

  static applyRewards(profile: UserState, boss: DailyBossConfig): { updatedProfile: UserState; rewardsClaimed: { gems: number; fragmentShipId: string; fragmentCount: number; badge: string } } {
    const updatedProfile = { ...profile };
    const todayStr = this.getTodayDateString();
    
    // Mark as defeated
    updatedProfile.dailyBossDefeatedDate = todayStr;
    
    // Gems reward
    const gemsReward = boss.rewards.gems;
    updatedProfile.gems = (updatedProfile.gems || 0) + gemsReward;
    updatedProfile.totalGemsCollected = (updatedProfile.totalGemsCollected || 0) + gemsReward;
    
    // Fragments reward
    const fragShipId = boss.rewards.fragments.shipId;
    const fragCount = boss.rewards.fragments.count;
    if (!updatedProfile.shipFragments) {
      updatedProfile.shipFragments = {};
    }
    updatedProfile.shipFragments[fragShipId] = (updatedProfile.shipFragments[fragShipId] || 0) + fragCount;
    
    // Badge award
    const badgeName = boss.rewards.badge;
    if (!updatedProfile.dailyBossBadgesCollected) {
      updatedProfile.dailyBossBadgesCollected = [];
    }
    if (!updatedProfile.dailyBossBadgesCollected.includes(badgeName)) {
      updatedProfile.dailyBossBadgesCollected.push(badgeName);
    }

    // Daily Boss Kill Achievement/Stat count
    updatedProfile.dailyBossKills = (updatedProfile.dailyBossKills || 0) + 1;

    // Small Streak Bonus
    if (!updatedProfile.dailyStreakConsecutive) {
      updatedProfile.dailyStreakConsecutive = 1;
    }
    updatedProfile.dailyStreakConsecutive = updatedProfile.dailyStreakConsecutive + 1;
    
    return {
      updatedProfile,
      rewardsClaimed: {
        gems: gemsReward,
        fragmentShipId: fragShipId,
        fragmentCount: fragCount,
        badge: badgeName
      }
    };
  }
}
