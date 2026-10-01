import { GameStats, UserState } from '../types';

export interface Mission {
  id: string;
  description: string;
  target: number;
  progress: number;
  rewardGems: number;
  isDaily: boolean;
  isCompleted: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardGems: number;
  isUnlocked: boolean;
  category: 'score' | 'gems' | 'distance' | 'enemies';
}

export class ProgressionSystem {
  /**
   * Generates a list of Daily and Weekly Missions.
   */
  static getMissions(user: UserState): Mission[] {
    const claimed = user.claimedMissions || [];
    return [
      {
        id: 'daily_destroy',
        description: 'Polverizza 20 meteoriti nello spazio',
        target: 20,
        progress: user.totalEnemiesDestroyed || 0,
        rewardGems: 25,
        isDaily: true,
        isCompleted: (user.totalEnemiesDestroyed || 0) >= 20
      },
      {
        id: 'daily_gems',
        description: 'Raccogli 15 gemme in una sola partita',
        target: 15,
        progress: user.highestGemsSingleRun || 0,
        rewardGems: 30,
        isDaily: true,
        isCompleted: (user.highestGemsSingleRun || 0) >= 15
      },
      {
        id: 'weekly_distance',
        description: 'Sfreccia per oltre 1000 m complessivi',
        target: 1000,
        progress: Math.round(user.totalDistanceTraveled || 0),
        rewardGems: 75,
        isDaily: false,
        isCompleted: (user.totalDistanceTraveled || 0) >= 1000
      },
      {
        id: 'weekly_score',
        description: 'Raggiungi un punteggio di 500 in una run',
        target: 500,
        progress: user.highscore || 0,
        rewardGems: 100,
        isDaily: false,
        isCompleted: (user.highscore || 0) >= 500
      }
    ];
  }

  /**
   * Generates the achievement milestones for the player.
   */
  static getAchievements(user: UserState): Achievement[] {
    return [
      {
        id: 'ach_cadet',
        title: 'Cadetto Spaziale 🚀',
        description: 'Ottieni un punteggio massimo di 100 punti.',
        target: 100,
        progress: user.highscore,
        rewardGems: 50,
        isUnlocked: user.highscore >= 100,
        category: 'score'
      },
      {
        id: 'ach_commander',
        title: 'Comandante Galattico 👑',
        description: 'Ottieni un punteggio massimo di 500 punti.',
        target: 500,
        progress: user.highscore,
        rewardGems: 150,
        isUnlocked: user.highscore >= 500,
        category: 'score'
      },
      {
        id: 'ach_gem_hoarder',
        title: 'Collezionista di Stelle 💎',
        description: 'Guarda video premiati o raccogli gemme per arricchirti.',
        target: 10,
        progress: user.adsWatchedCount,
        rewardGems: 100,
        isUnlocked: user.adsWatchedCount >= 10,
        category: 'gems'
      },
      {
        id: 'ach_chaos',
        title: 'Sopravvissuto del Caos 💀',
        description: 'Sblocca e gioca nella modalità ad alta difficoltà Chaos.',
        target: 1,
        progress: user.chaosModeUnlocked ? 1 : 0,
        rewardGems: 50,
        isUnlocked: user.chaosModeUnlocked,
        category: 'distance'
      }
    ];
  }
}
