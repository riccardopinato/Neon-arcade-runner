export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay?: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export class GameEngine {
  /**
   * Generates sparks for hits or explosions (satisfying game-feel particle bursts)
   */
  static createSparks(
    particles: Particle[],
    x: number,
    y: number,
    count: number,
    color: string
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1.0,
        color,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }

  /**
   * Generates a circular pulse or expanding ring effect.
   */
  static createExplosionRing(
    particles: Particle[],
    x: number,
    y: number,
    color: string
  ) {
    const ringCount = 18;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: 3.0,
        alpha: 0.9,
        color,
        decay: 0.02
      });
    }
  }

  /**
   * Scroll and wrap starry backdrop for modern vertical parallax look.
   */
  static updateStars(stars: Star[], height: number, speedMultiplier: number = 1.0) {
    stars.forEach(star => {
      star.y += star.speed * speedMultiplier;
      if (star.y > height) {
        star.y = -5;
        star.x = Math.random() * 400; // Recenter horizontally
      }
    });
  }

  /**
   * Perform standard bounding box or circle collision checks.
   */
  static checkCircleCollision(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = Math.hypot(dx, dy);
    return dist < r1 + r2;
  }

  /**
   * Reduces screen-shake duration and computes horizontal/vertical vibration translation offsets.
   */
  static getShakeOffsets(shake: { intensity: number; duration: number }): { x: number; y: number } {
    if (shake.duration > 0) {
      shake.duration--;
      const dx = (Math.random() - 0.5) * shake.intensity;
      const dy = (Math.random() - 0.5) * shake.intensity;
      return { x: dx, y: dy };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Activates a screenshake event.
   */
  static triggerShake(shake: { intensity: number; duration: number }, intensity: number, duration: number) {
    shake.intensity = intensity;
    shake.duration = duration;
  }
}
