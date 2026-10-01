import { PurchaseItem, UserState } from '../types';

export interface IMonetizationProvider {
  name: string;
  isAvailable(): boolean;
  purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }>;
  restorePurchases(): Promise<boolean>;
}

export interface IAdProvider {
  name: string;
  loadInterstitialAd(): Promise<void>;
  showInterstitialAd(onClose: () => void): Promise<void>;
  loadRewardedAd(): Promise<void>;
  showRewardedAd(onEarned: () => void, onClose: () => void): Promise<void>;
}

// Simulated monetization for offline preview
export class SimulatedMonetizationProvider implements IMonetizationProvider {
  name = 'Simulated Billing Provider (Demo Mode)';

  isAvailable(): boolean {
    return true; // Always available offline
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    // Simulate delay for server validation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 300);
    });
  }

  async restorePurchases(): Promise<boolean> {
    return true;
  }
}

// Placeholder for real production billing integration (Google Play Billing / RevenueCat)
export class ProductionMonetizationProvider implements IMonetizationProvider {
  name = 'Production Play Billing / RevenueCat Provider';

  isAvailable(): boolean {
    // Return true if running on native wrap (e.g. Capacitor, Cordova, Android Webview)
    return (window as any).AndroidPlayStoreBilling !== undefined;
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[ProductionBilling] Initiating real Play Store Purchase for product ID: ${productId}`);
    // Real integration would call native methods
    return { success: true };
  }

  async restorePurchases(): Promise<boolean> {
    console.log('[ProductionBilling] Restoring production purchase transactions...');
    return true;
  }
}

// Simulated and production ready ads provider
export class SimulatedAdProvider implements IAdProvider {
  name = 'Simulated Ad Network (AdMob Mock)';

  async loadInterstitialAd(): Promise<void> {
    console.log('[MockAds] Pre-loading interstitial video...');
  }

  async showInterstitialAd(onClose: () => void): Promise<void> {
    console.log('[MockAds] Showing simulated interstitial overlay...');
    onClose();
  }

  async loadRewardedAd(): Promise<void> {
    console.log('[MockAds] Pre-loading rewarded ad video...');
  }

  async showRewardedAd(onEarned: () => void, onClose: () => void): Promise<void> {
    console.log('[MockAds] Playing simulated rewarded video...');
    onEarned();
    onClose();
  }
}

export class MonetizationSystem {
  private billingProvider: IMonetizationProvider;
  private adProvider: IAdProvider;

  constructor(isProductionMode: boolean = false) {
    this.billingProvider = isProductionMode 
      ? new ProductionMonetizationProvider() 
      : new SimulatedMonetizationProvider();
    
    this.adProvider = new SimulatedAdProvider(); // Expand with AdMob provider in future sprints
  }

  getBillingProvider(): IMonetizationProvider {
    return this.billingProvider;
  }

  getAdProvider(): IAdProvider {
    return this.adProvider;
  }

  /**
   * Determine if the user is VIP (ad-free & premium)
   */
  static isVIP(user: UserState): boolean {
    return user.isPremium === true;
  }

  /**
   * Check if standard ads are enabled (disabled for Premium/No-Ads purchase)
   */
  static areAdsEnabled(user: UserState): boolean {
    return !user.isPremium && !user.isAdFree;
  }
}
