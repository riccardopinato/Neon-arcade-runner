export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  size: number;
  hp: number;
  maxHp: number;
  color: string;
  isTracking: boolean;
  type: 'standard' | 'tracking' | 'tank' | 'splitter' | 'mini_boss' | 'drone';
  behaviorTimer?: number; // Mini-boss and drones shoot occasionally
}

export class EnemySystem {
  static createEnemy(
    score: number,
    chaosMode: boolean,
    width: number
  ): Enemy {
    const roll = Math.random();
    const scoreBonusHP = Math.floor(score / 500);
    const id = Math.random().toString(36).substring(2, 9);

    // --- ENEMY SCALING VARIETIES ---
    if (roll < 0.15 && score > 300) {
      // 1. Mini Boss / drone (Spawns above 300 score)
      const hp = 15 + scoreBonusHP * 2;
      return {
        id,
        x: Math.random() * (width - 80) + 40,
        y: -50,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0.5,
        speed: 0.6 + Math.min(0.4, score * 0.00002),
        size: 32,
        hp,
        maxHp: hp,
        color: '#a855f7', // Deep Violet / Purple
        isTracking: true,
        type: 'mini_boss',
        behaviorTimer: 0
      };
    } else if (roll < 0.35 && score > 150) {
      // 2. Splitter Meteor (Spawns above 150 score)
      const hp = 4 + scoreBonusHP;
      return {
        id,
        x: Math.random() * (width - 40) + 20,
        y: -40,
        vx: (Math.random() - 0.5) * 2.0,
        vy: 0,
        speed: Math.random() * 0.8 + (chaosMode ? 2.2 : 1.1),
        size: 24,
        hp,
        maxHp: hp,
        color: '#f97316', // Orange
        isTracking: false,
        type: 'splitter'
      };
    } else if (roll < 0.55) {
      // 3. Tank Meteor (Large, heavy meteor)
      const hp = 8 + scoreBonusHP;
      return {
        id,
        x: Math.random() * (width - 50) + 25,
        y: -40,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0,
        speed: Math.random() * 0.6 + (chaosMode ? 1.8 : 0.7) + Math.min(0.6, score * 0.00002),
        size: 30,
        hp,
        maxHp: hp,
        color: '#f43f5e', // Rose
        isTracking: true,
        type: 'tank'
      };
    } else if (roll < 0.75) {
      // 4. Tracking Meteor (Smaller, pursues player aggressively)
      const hp = 2 + Math.floor(scoreBonusHP / 2);
      return {
        id,
        x: Math.random() * (width - 40) + 20,
        y: -40,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0,
        speed: Math.random() * 0.8 + (chaosMode ? 2.2 : 1.3) + Math.min(1.0, score * 0.00003),
        size: 16,
        hp,
        maxHp: hp,
        color: '#a855f7', // Purple
        isTracking: true,
        type: 'tracking'
      };
    } else {
      // 5. Standard Meteor
      const hp = 2 + Math.floor(scoreBonusHP / 2);
      return {
        id,
        x: Math.random() * (width - 40) + 20,
        y: -40,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 0,
        speed: Math.random() * 1.0 + (chaosMode ? 2.2 : 1.1) + Math.min(1.0, score * 0.00002),
        size: Math.random() * 10 + 12,
        hp,
        maxHp: hp,
        color: '#94a3b8', // Slate grey
        isTracking: false,
        type: 'standard'
      };
    }
  }

  /**
   * Split a splitter meteorite into 2 smaller fragments
   */
  static splitMeteor(parent: Enemy): Enemy[] {
    const subHp = 1;
    const fragment1: Enemy = {
      id: Math.random().toString(36).substring(2, 9),
      x: parent.x - 12,
      y: parent.y,
      vx: -2.0,
      vy: 0,
      speed: parent.speed + 0.5,
      size: 12,
      hp: subHp,
      maxHp: subHp,
      color: '#fb923c', // Lighter orange
      isTracking: false,
      type: 'standard'
    };
    const fragment2: Enemy = {
      id: Math.random().toString(36).substring(2, 9),
      x: parent.x + 12,
      y: parent.y,
      vx: 2.0,
      vy: 0,
      speed: parent.speed + 0.5,
      size: 12,
      hp: subHp,
      maxHp: subHp,
      color: '#fb923c',
      isTracking: false,
      type: 'standard'
    };
    return [fragment1, fragment2];
  }
}
