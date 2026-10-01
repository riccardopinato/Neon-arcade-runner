export interface InputConfig {
  sensitivity: number;       // 0.5 to 2.5
  oneHandedMode: boolean;    // Whether one-hand control layout is active
}

export class InputSystem {
  private config: InputConfig = {
    sensitivity: 1.2,
    oneHandedMode: false
  };

  constructor(config?: Partial<InputConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public getSensitivity(): number {
    return this.config.sensitivity;
  }

  public setSensitivity(val: number) {
    this.config.sensitivity = Math.max(0.5, Math.min(3.0, val));
  }

  public isOneHanded(): boolean {
    return this.config.oneHandedMode;
  }

  public setOneHanded(val: boolean) {
    this.config.oneHandedMode = val;
  }

  /**
   * Calculates new position of the player ship based on pointer delta and sensitivity.
   */
  public calculateMove(
    clientX: number,
    clientY: number,
    startPointerX: number,
    startPointerY: number,
    startShipX: number,
    startShipY: number,
    boundsWidth: number,
    boundsHeight: number,
    shipWidth: number,
    shipHeight: number
  ): { x: number; y: number } {
    const halfWidth = shipWidth / 2;
    const halfHeight = shipHeight / 2;

    // Delta between current pointer position and start position
    const dx = (clientX - startPointerX) * this.config.sensitivity;
    const dy = (clientY - startPointerY) * this.config.sensitivity;

    let targetX = startShipX + dx;
    let targetY = startShipY + dy;

    // Apply boundary limits
    targetX = Math.max(halfWidth, Math.min(boundsWidth - halfWidth, targetX));
    targetY = Math.max(halfHeight, Math.min(boundsHeight - 50, targetY));

    return { x: targetX, y: targetY };
  }
}
