import { UserState } from '../types';

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardGems: number;
  isDaily: boolean;
  metric: 'enemies' | 'gems' | 'distance' | 'matches' | 'highscore' | 'ads_watched' | 'near_misses' | 'boss_kills' | 'different_ships';
}

export class MissionSystem {
  /**
   * Returns the static definition of daily and weekly missions.
   */
  static getMissions(): Mission[] {
    return [
      {
        id: 'daily_destroy_30',
        title: 'Cacciatore Spaziale 💥',
        description: 'Polverizza 30 meteoriti nello spazio profondo oggi.',
        target: 30,
        rewardGems: 30,
        isDaily: true,
        metric: 'enemies'
      },
      {
        id: 'daily_gems_150',
        title: 'Febbre dell\'Oro 💎',
        description: 'Raccogli 150 gemme totali oggi.',
        target: 150,
        rewardGems: 40,
        isDaily: true,
        metric: 'gems'
      },
      {
        id: 'daily_distance_1500',
        title: 'Esploratore del Giorno 🚀',
        description: 'Raggiungi 1.500 metri di distanza cumulativi oggi.',
        target: 1500,
        rewardGems: 35,
        isDaily: true,
        metric: 'distance'
      },
      {
        id: 'daily_watch_ad',
        title: 'Sostenitore Neon 📺',
        description: 'Guarda 1 annuncio premiato (o riscatta una cassa con ad).',
        target: 1,
        rewardGems: 25,
        isDaily: true,
        metric: 'ads_watched'
      },
      {
        id: 'daily_near_miss_5',
        title: 'Pelo Stellare ⚡',
        description: 'Effettua 5 schivate ravvicinate (Near Miss) oggi.',
        target: 5,
        rewardGems: 30,
        isDaily: true,
        metric: 'near_misses'
      },
      {
        id: 'daily_boss_kill_1',
        title: 'Demolitore di Giganti 👾',
        description: 'Sconfiggi 1 Colosso Asteroide (mini-boss) oggi.',
        target: 1,
        rewardGems: 50,
        isDaily: true,
        metric: 'boss_kills'
      },
      {
        id: 'daily_different_ships_2',
        title: 'Pilota Versatile 🛸',
        description: 'Completa partite usando almeno 2 astronavi diverse oggi.',
        target: 2,
        rewardGems: 40,
        isDaily: true,
        metric: 'different_ships'
      },
      {
        id: 'daily_matches_3',
        title: 'Costanza Stellare 🎮',
        description: 'Completa 3 partite nello spazio profondo oggi.',
        target: 3,
        rewardGems: 30,
        isDaily: true,
        metric: 'matches'
      },
      // Weekly missions (More ambitious)
      {
        id: 'weekly_distance_25000',
        title: 'Pioniere dell\'Infinito 🌌',
        description: 'Percorri 25.000 metri totali nello spazio profondo.',
        target: 25000,
        rewardGems: 150,
        isDaily: false,
        metric: 'distance'
      },
      {
        id: 'weekly_destroy_600',
        title: 'Flagello Galattico ☄️',
        description: 'Distruggi 600 meteoriti cumulativamente.',
        target: 600,
        rewardGems: 200,
        isDaily: false,
        metric: 'enemies'
      },
      {
        id: 'weekly_gems_2500',
        title: 'Magnate Stellare 💰',
        description: 'Accumula 2.500 gemme totali nel corso della settimana.',
        target: 2500,
        rewardGems: 250,
        isDaily: false,
        metric: 'gems'
      },
      {
        id: 'weekly_boss_10',
        title: 'Sterminatore di Colossi ⚔️',
        description: 'Elimina 10 mini-boss Colossi Asteroide.',
        target: 10,
        rewardGems: 180,
        isDaily: false,
        metric: 'boss_kills'
      },
      {
        id: 'weekly_matches_20',
        title: 'Veterano dello Spazio 🎖️',
        description: 'Porta a termine 20 partite totali.',
        target: 20,
        rewardGems: 120,
        isDaily: false,
        metric: 'matches'
      },
      {
        id: 'weekly_watch_ads_5',
        title: 'Sponsor Ufficiale 🥇',
        description: 'Guarda 5 video sponsorizzati premiati.',
        target: 5,
        rewardGems: 100,
        isDaily: false,
        metric: 'ads_watched'
      }
    ];
  }

  /**
   * Calculates the current progress of a given mission.
   */
  static getProgress(user: UserState, mission: Mission): number {
    if (mission.isDaily) {
      switch (mission.metric) {
        case 'enemies':
          return user.dailyEnemiesDestroyed || 0;
        case 'gems':
          return user.dailyGemsCollected || 0;
        case 'distance':
          return Math.round(user.dailyDistanceTraveled || 0);
        case 'matches':
          return user.dailyMatchesPlayed || 0;
        case 'ads_watched':
          return user.dailyAdsWatched || 0;
        case 'near_misses':
          return user.dailyNearMisses || 0;
        case 'boss_kills':
          return user.dailyBossKills || 0;
        case 'different_ships':
          return (user.dailyDifferentShipsUsed || []).length;
        case 'highscore':
          return user.highscore || 0;
        default:
          return 0;
      }
    } else {
      // Weekly or overall cumulative progress
      switch (mission.metric) {
        case 'enemies':
          return user.totalEnemiesDestroyed || 0;
        case 'gems':
          return user.totalGemsCollected || 0;
        case 'distance':
          return Math.round(user.totalDistanceTraveled || 0);
        case 'matches':
          return user.totalMatchesPlayed || 0;
        case 'ads_watched':
          return user.adsWatchedCount || 0;
        case 'boss_kills':
          // We can fallback or track this cumulatively if desired
          return user.totalEnemiesDestroyed ? Math.floor(user.totalEnemiesDestroyed * 0.05) : 0; // estimate or use total
        default:
          return 0;
      }
    }
  }

  /**
   * Checks if a mission's progress is equal to or greater than its target.
   */
  static isCompleted(user: UserState, mission: Mission): boolean {
    return this.getProgress(user, mission) >= mission.target;
  }

  /**
   * Checks if a mission has already been claimed.
   */
  static isClaimed(user: UserState, missionId: string): boolean {
    return (user.claimedMissions || []).includes(missionId);
  }
}
