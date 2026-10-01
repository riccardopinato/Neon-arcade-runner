import { UserState } from '../types';

export type MonetizationMode = 'mock' | 'production';

export type RewardedAdRewardType =
  | 'revive'
  | 'shield_boost'
  | 'magnet_boost'
  | 'fire_boost'
  | 'double_rewards'
  | 'gacha_chest';

export type MonetizationProductAnalyticsId =
  | 'neon_premium'
  | 'no_ads'
  | 'gem_pack'
  | 'unknown';

export const MONETIZATION_CONFIG = {
  interstitial: {
    minCompletedRuns: 4,
    minIntervalMs: 150_000,
    minSessionAgeMs: 120_000
  },
  premium: {
    productId: 'noncons_neon_premium',
    legacyProductId: 'sub_vip',
    removeAdsProductId: 'noncons_remove_ads',
    grantedShipIds: ['starter', 'velocity', 'dreadnought', 'premium_golden', 'premium_quantum']
  }
} as const;

export interface MonetizationEntitlements {
  premium: boolean;
  noAds: boolean;
  premiumDailyRevive: boolean;
  automaticDoubleRunGems: boolean;
}

export interface InterstitialDecision {
  eligible: boolean;
  reason: 'eligible' | 'no_ads' | 'run_cap' | 'time_cap' | 'session_too_young';
  nextRunsSinceInterstitial: number;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  productIds: string[];
  error?: string;
}

export interface IMonetizationProvider {
  name: string;
  mode: MonetizationMode;
  isAvailable(): boolean;
  purchaseProduct(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
}

export interface IAdProvider {
  name: string;
  mode: MonetizationMode;
  isAvailable(): boolean;
  loadInterstitialAd(): Promise<void>;
  showInterstitialAd(onClose: () => void): Promise<void>;
  loadRewardedAd(): Promise<void>;
  showRewardedAd(onEarned: () => void, onClose: () => void): Promise<void>;
}

export class SimulatedMonetizationProvider implements IMonetizationProvider {
  name = 'Simulated Billing Provider';
  mode: MonetizationMode = 'mock';
  private static readonly STORAGE_KEY = 'neon_runner_mock_purchases';

  isAvailable(): boolean { return true; }

  private readMockPurchases(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SimulatedMonetizationProvider.STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (typeof localStorage !== 'undefined' && !productId.startsWith('cons_')) {
      const purchases = Array.from(new Set([...this.readMockPurchases(), productId]));
      localStorage.setItem(
        SimulatedMonetizationProvider.STORAGE_KEY,
        JSON.stringify(purchases)
      );
    }
    return { success: true };
  }

  async restorePurchases(): Promise<RestoreResult> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { success: true, productIds: this.readMockPurchases() };
  }
}

export class ProductionMonetizationProvider implements IMonetizationProvider {
  name = 'Google Play Billing / RevenueCat Bridge';
  mode: MonetizationMode = 'production';

  private getBridge(): any {
    if (typeof window === 'undefined') return undefined;
    return (window as any).AndroidPlayStoreBilling;
  }

  isAvailable(): boolean {
    const bridge = this.getBridge();
    return Boolean(bridge && typeof bridge.purchaseProduct === 'function');
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    const bridge = this.getBridge();
    if (!bridge || typeof bridge.purchaseProduct !== 'function') {
      return { success: false, error: 'Billing bridge non disponibile in questo runtime.' };
    }
    try {
      const result = await bridge.purchaseProduct(productId);
      if (typeof result === 'boolean') return { success: result };
      return {
        success: Boolean(result?.success),
        error: result?.error ? String(result.error) : undefined
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Acquisto non riuscito.' };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    const bridge = this.getBridge();
    if (!bridge || typeof bridge.restorePurchases !== 'function') {
      return { success: false, productIds: [], error: 'Restore bridge non disponibile.' };
    }

    try {
      const result = await bridge.restorePurchases();
      if (Array.isArray(result)) {
        return {
          success: true,
          productIds: result.filter((id): id is string => typeof id === 'string')
        };
      }

      const productIds = Array.isArray(result?.productIds)
        ? result.productIds.filter((id: unknown): id is string => typeof id === 'string')
        : [];

      return {
        success: Boolean(result?.success) && productIds.length > 0,
        productIds,
        error: result?.error ? String(result.error) : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        productIds: [],
        error: error?.message || 'Ripristino acquisti non riuscito.'
      };
    }
  }
}

export class SimulatedAdProvider implements IAdProvider {
  name = 'AdMob Mock';
  mode: MonetizationMode = 'mock';
  isAvailable(): boolean { return true; }
  async loadInterstitialAd(): Promise<void> {}
  async showInterstitialAd(onClose: () => void): Promise<void> { onClose(); }
  async loadRewardedAd(): Promise<void> {}
  async showRewardedAd(onEarned: () => void, onClose: () => void): Promise<void> {
    onEarned();
    onClose();
  }
}

export class ProductionAdProvider implements IAdProvider {
  name = 'AdMob Native Bridge';
  mode: MonetizationMode = 'production';

  private getBridge(): any {
    if (typeof window === 'undefined') return undefined;
    return (window as any).AndroidAdMobBridge;
  }

  isAvailable(): boolean {
    const bridge = this.getBridge();
    return Boolean(
      bridge &&
      typeof bridge.showInterstitialAd === 'function' &&
      typeof bridge.showRewardedAd === 'function'
    );
  }

  async loadInterstitialAd(): Promise<void> {
    const bridge = this.getBridge();
    if (bridge && typeof bridge.loadInterstitialAd === 'function') {
      await bridge.loadInterstitialAd();
    }
  }

  async showInterstitialAd(onClose: () => void): Promise<void> {
    const bridge = this.getBridge();
    if (!bridge || typeof bridge.showInterstitialAd !== 'function') {
      throw new Error('AdMob bridge non disponibile.');
    }
    await bridge.showInterstitialAd();
    onClose();
  }

  async loadRewardedAd(): Promise<void> {
    const bridge = this.getBridge();
    if (bridge && typeof bridge.loadRewardedAd === 'function') {
      await bridge.loadRewardedAd();
    }
  }

  async showRewardedAd(onEarned: () => void, onClose: () => void): Promise<void> {
    const bridge = this.getBridge();
    if (!bridge || typeof bridge.showRewardedAd !== 'function') {
      throw new Error('AdMob rewarded bridge non disponibile.');
    }
    const result = await bridge.showRewardedAd();
    if (result === true || result?.rewarded === true || result?.earned === true) {
      onEarned();
    }
    onClose();
  }
}

export class MonetizationSystem {
  private billingProvider: IMonetizationProvider;
  private adProvider: IAdProvider;

  constructor(isProductionMode: boolean = MonetizationSystem.isProductionRuntime()) {
    this.billingProvider = isProductionMode
      ? new ProductionMonetizationProvider()
      : new SimulatedMonetizationProvider();
    this.adProvider = isProductionMode
      ? new ProductionAdProvider()
      : new SimulatedAdProvider();
  }

  static isProductionRuntime(): boolean {
    const envMode = (import.meta as any).env?.VITE_MONETIZATION_MODE;
    if (envMode === 'production') return true;
    if (envMode === 'mock') return false;
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).AndroidPlayStoreBilling ||
      (window as any).AndroidAdMobBridge
    );
  }

  getMode(): MonetizationMode { return this.billingProvider.mode; }
  getBillingProvider(): IMonetizationProvider { return this.billingProvider; }
  getAdProvider(): IAdProvider { return this.adProvider; }

  static getEntitlements(user: UserState): MonetizationEntitlements {
    const premium = user.isPremium === true;
    return {
      premium,
      noAds: premium || user.isAdFree === true,
      premiumDailyRevive: premium,
      automaticDoubleRunGems: premium
    };
  }

  static isVIP(user: UserState): boolean {
    return MonetizationSystem.getEntitlements(user).premium;
  }

  static areAdsEnabled(user: UserState): boolean {
    return !MonetizationSystem.getEntitlements(user).noAds;
  }

  static applyProductEntitlement(user: UserState, productId: string): UserState {
    if (
      productId === MONETIZATION_CONFIG.premium.productId ||
      productId === MONETIZATION_CONFIG.premium.legacyProductId
    ) {
      return {
        ...user,
        isPremium: true,
        isAdFree: true,
        chaosModeUnlocked: true,
        ownedShips: Array.from(
          new Set([...user.ownedShips, ...MONETIZATION_CONFIG.premium.grantedShipIds])
        )
      };
    }
    if (productId === MONETIZATION_CONFIG.premium.removeAdsProductId) {
      return { ...user, isAdFree: true };
    }
    return user;
  }

  static normalizeAnalyticsProductId(productId: string): MonetizationProductAnalyticsId {
    if (
      productId === MONETIZATION_CONFIG.premium.productId ||
      productId === MONETIZATION_CONFIG.premium.legacyProductId
    ) return 'neon_premium';
    if (productId === MONETIZATION_CONFIG.premium.removeAdsProductId) return 'no_ads';
    if (productId.startsWith('cons_gems_')) return 'gem_pack';
    return 'unknown';
  }

  static evaluatePostRunInterstitial(
    user: UserState,
    sessionStartedAt: number,
    now: number = Date.now()
  ): InterstitialDecision {
    if (!MonetizationSystem.areAdsEnabled(user)) {
      return { eligible: false, reason: 'no_ads', nextRunsSinceInterstitial: 0 };
    }

    const nextRuns = Math.max(0, user.runsSinceInterstitial || 0) + 1;

    if (now - sessionStartedAt < MONETIZATION_CONFIG.interstitial.minSessionAgeMs) {
      return { eligible: false, reason: 'session_too_young', nextRunsSinceInterstitial: nextRuns };
    }

    if (nextRuns < MONETIZATION_CONFIG.interstitial.minCompletedRuns) {
      return { eligible: false, reason: 'run_cap', nextRunsSinceInterstitial: nextRuns };
    }

    const lastInterstitialAt = Math.max(0, user.lastInterstitialAt || 0);
    if (
      lastInterstitialAt > 0 &&
      now - lastInterstitialAt < MONETIZATION_CONFIG.interstitial.minIntervalMs
    ) {
      return { eligible: false, reason: 'time_cap', nextRunsSinceInterstitial: nextRuns };
    }

    return { eligible: true, reason: 'eligible', nextRunsSinceInterstitial: nextRuns };
  }

  static markInterstitialShown(user: UserState, now: number = Date.now()): UserState {
    return {
      ...user,
      runsSinceInterstitial: 0,
      lastInterstitialAt: now,
      interstitialsShown: (user.interstitialsShown || 0) + 1
    };
  }
}
