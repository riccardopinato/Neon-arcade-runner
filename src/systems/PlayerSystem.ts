import { Ship } from '../types';

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  secondaryColor: string;
  bulletColor: string;
  isInvulnerable: boolean;
  invulnTimer: number;
  hp: number;
  maxHp: number;
}

export class PlayerSystem {
  private state: PlayerState;
  private ship: Ship;

  constructor(ship: Ship) {
    this.ship = ship;
    this.state = {
      x: 0,
      y: 0,
      width: 45,
      height: 45,
      speed: ship.speed,
      color: ship.color,
      secondaryColor: ship.secondaryColor,
      bulletColor: ship.bulletColor,
      isInvulnerable: false,
      invulnTimer: 0,
      hp: ship.health,
      maxHp: ship.health
    };
  }

  public getState(): PlayerState {
    return this.state;
  }

  public getShip(): Ship {
    return this.ship;
  }

  public updateInvulnerability() {
    if (this.state.invulnTimer > 0) {
      this.state.invulnTimer--;
      this.state.isInvulnerable = true;
    } else {
      this.state.isInvulnerable = false;
    }
  }

  public takeDamage(amount: number = 1): boolean {
    if (this.state.isInvulnerable) return false;
    
    this.state.hp = Math.max(0, this.state.hp - amount);
    // Grant short hit invulnerability (2 seconds / 120 frames at 60fps)
    this.state.invulnTimer = 120;
    this.state.isInvulnerable = true;
    return true;
  }

  public heal(amount: number = 1) {
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + amount);
  }

  /**
   * Determine weapons configurations. Premium ships or VIP subscribers can shoot multiple lasers!
   */
  public getWeaponsConfig(isPremiumUser: boolean): { type: 'single' | 'triple' | 'seeking'; fireRate: number } {
    const defaultFireRate = this.ship.fireRate;
    
    if (this.ship.id === 'premium_golden' || (isPremiumUser && this.ship.id === 'starter')) {
      return { type: 'triple', fireRate: defaultFireRate };
    }
    
    if (this.ship.id === 'premium_quantum') {
      return { type: 'seeking', fireRate: defaultFireRate };
    }

    return { type: 'single', fireRate: defaultFireRate };
  }
}
