import { GameStats } from '../types';

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  timestamp: number;
  sessionId: string;
  runId?: string;
  gameVersion: string;
  saveVersion: number;
  platform: string;
  environment: string;
  eventProperties: Record<string, any>;
}

export interface EconomyTransaction {
  id: string;
  transactionType: 'credit' | 'debit';
  currencyType: 'gems' | 'coins' | 'prestige_stars' | 'fragments';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source?: string;
  sink?: string;
  timestamp: number;
  relatedEvent?: string;
  runId?: string;
  sessionId: string;
}

export interface AggregatedStats {
  totalSessions: number;
  totalSessionDurationMs: number;
  totalRuns: number;
  totalRunDurationSec: number;
  totalScore: number;
  totalDistance: number;
  totalEnemiesDestroyed: number;
  totalBossesDefeated: number;
  totalNearMisses: number;
  deathCauses: Record<string, number>;
  shipUsage: Record<string, number>;
  modeUsage: Record<string, number>;
  adsOffered: number;
  adsAccepted: number;
  adsCompleted: number;
  adsByRewardType: Record<string, { offered: number; accepted: number; completed: number }>;
  gemsGeneratedBySource: Record<string, number>;
  gemsConsumedBySink: Record<string, number>;
  totalGemsGenerated: number;
  totalGemsConsumed: number;
  unlockedShipsCount: number;
  averageUpgradeLevel: number;
}

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'Console';
  track(event: AnalyticsEvent): void {
    console.log(`[Analytics - Console] Event: ${event.eventName}`, event);
  }
}

export class FutureRemoteAnalyticsProvider implements AnalyticsProvider {
  name = 'FutureRemote (Firebase/GameAnalytics Mock)';
  track(event: AnalyticsEvent): void {
    // In future production steps, this would send a beacon to an endpoint
    // console.debug(`[Analytics - Remote Mock] Sending event to cloud: ${event.eventName}`);
  }
}

export class LocalAnalyticsProvider implements AnalyticsProvider {
  name = 'Local';
  private static STORAGE_KEY = 'neon_runner_analytics_events';
  private static AGGREGATED_KEY = 'neon_runner_analytics_aggregated';
  private static TRANSACTIONS_KEY = 'neon_runner_analytics_transactions';
  private static ACTIVE_DAYS_KEY = 'neon_runner_analytics_active_days';
  
  private eventsCache: AnalyticsEvent[] = [];
  private transactionsCache: EconomyTransaction[] = [];
  private aggregatedStats: AggregatedStats;
  private activeDays: string[] = []; // YYYY-MM-DD
  private registrationDate: string = '';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedEvents = localStorage.getItem(LocalAnalyticsProvider.STORAGE_KEY);
      this.eventsCache = savedEvents ? JSON.parse(savedEvents) : [];

      const savedTx = localStorage.getItem(LocalAnalyticsProvider.TRANSACTIONS_KEY);
      this.transactionsCache = savedTx ? JSON.parse(savedTx) : [];

      const savedAgg = localStorage.getItem(LocalAnalyticsProvider.AGGREGATED_KEY);
      this.aggregatedStats = savedAgg ? JSON.parse(savedAgg) : this.createInitialAggregatedStats();

      const savedDays = localStorage.getItem(LocalAnalyticsProvider.ACTIVE_DAYS_KEY);
      this.activeDays = savedDays ? JSON.parse(savedDays) : [];

      // Determine registration date
      if (this.activeDays.length > 0) {
        this.registrationDate = this.activeDays[0];
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        this.registrationDate = todayStr;
        this.activeDays.push(todayStr);
        this.saveActiveDays();
      }
    } catch (e) {
      console.error('[Analytics] Failed to load analytics data from storage. Reverting to empty.', e);
      this.eventsCache = [];
      this.transactionsCache = [];
      this.aggregatedStats = this.createInitialAggregatedStats();
      this.activeDays = [new Date().toISOString().split('T')[0]];
      this.registrationDate = this.activeDays[0];
    }
  }

  private createInitialAggregatedStats(): AggregatedStats {
    return {
      totalSessions: 0,
      totalSessionDurationMs: 0,
      totalRuns: 0,
      totalRunDurationSec: 0,
      totalScore: 0,
      totalDistance: 0,
      totalEnemiesDestroyed: 0,
      totalBossesDefeated: 0,
      totalNearMisses: 0,
      deathCauses: {},
      shipUsage: {},
      modeUsage: {},
      adsOffered: 0,
      adsAccepted: 0,
      adsCompleted: 0,
      adsByRewardType: {},
      gemsGeneratedBySource: {},
      gemsConsumedBySink: {},
      totalGemsGenerated: 0,
      totalGemsConsumed: 0,
      unlockedShipsCount: 1,
      averageUpgradeLevel: 1
    };
  }

  track(event: AnalyticsEvent): void {
    this.eventsCache.push(event);
    this.updateAggregation(event);

    // If cache gets too large (e.g., > 150 events), we prune old events
    // to preserve memory and local storage, whilst our aggregated stats
    // remain 100% accurate.
    if (this.eventsCache.length > 200) {
      this.eventsCache = this.eventsCache.slice(-100); // Keep last 100
    }
  }

  trackTransaction(tx: EconomyTransaction) {
    this.transactionsCache.push(tx);
    
    // Manage economy aggregation
    if (tx.currencyType === 'gems') {
      if (tx.transactionType === 'credit') {
        const src = tx.source || 'unknown';
        this.aggregatedStats.gemsGeneratedBySource[src] = (this.aggregatedStats.gemsGeneratedBySource[src] || 0) + tx.amount;
        this.aggregatedStats.totalGemsGenerated += tx.amount;
      } else {
        const sink = tx.sink || 'unknown';
        this.aggregatedStats.gemsConsumedBySink[sink] = (this.aggregatedStats.gemsConsumedBySink[sink] || 0) + tx.amount;
        this.aggregatedStats.totalGemsConsumed += tx.amount;
      }
    }

    if (this.transactionsCache.length > 200) {
      this.transactionsCache = this.transactionsCache.slice(-100); // Keep last 100
    }
  }

  private updateAggregation(event: AnalyticsEvent) {
    const props = event.eventProperties || {};
    
    switch (event.eventName) {
      case 'session_start':
        this.aggregatedStats.totalSessions += 1;
        // Track unique active days
        const todayStr = new Date(event.timestamp).toISOString().split('T')[0];
        if (!this.activeDays.includes(todayStr)) {
          this.activeDays.push(todayStr);
          this.activeDays.sort();
          this.saveActiveDays();
        }
        break;
      
      case 'session_end':
        if (props.session_duration) {
          this.aggregatedStats.totalSessionDurationMs += props.session_duration;
        }
        break;

      case 'run_completed':
      case 'run_abandoned':
        this.aggregatedStats.totalRuns += 1;
        if (props.run_duration) this.aggregatedStats.totalRunDurationSec += props.run_duration;
        if (props.run_score) this.aggregatedStats.totalScore += props.run_score;
        if (props.run_distance) this.aggregatedStats.totalDistance += props.run_distance;
        if (props.gems_collected) {
          // Handled via transactions too, but we can aggregate here
        }
        if (props.enemies_destroyed) this.aggregatedStats.totalEnemiesDestroyed += props.enemies_destroyed;
        if (props.bosses_defeated) this.aggregatedStats.totalBossesDefeated += props.bosses_defeated;
        if (props.near_misses) this.aggregatedStats.totalNearMisses += props.near_misses;

        if (props.selected_ship) {
          this.aggregatedStats.shipUsage[props.selected_ship] = (this.aggregatedStats.shipUsage[props.selected_ship] || 0) + 1;
        }
        if (props.run_mode) {
          this.aggregatedStats.modeUsage[props.run_mode] = (this.aggregatedStats.modeUsage[props.run_mode] || 0) + 1;
        }
        if (props.cause_of_death) {
          this.aggregatedStats.deathCauses[props.cause_of_death] = (this.aggregatedStats.deathCauses[props.cause_of_death] || 0) + 1;
        }
        break;

      case 'rewarded_ad_offered':
        this.aggregatedStats.adsOffered += 1;
        this.ensureAdByRewardTracked(props.reward_type).offered += 1;
        break;
      
      case 'rewarded_ad_accepted':
        this.aggregatedStats.adsAccepted += 1;
        this.ensureAdByRewardTracked(props.reward_type).accepted += 1;
        break;

      case 'rewarded_ad_completed':
        this.aggregatedStats.adsCompleted += 1;
        this.ensureAdByRewardTracked(props.reward_type).completed += 1;
        break;
    }
  }

  private ensureAdByRewardTracked(rewardType: string) {
    const rType = rewardType || 'unknown';
    if (!this.aggregatedStats.adsByRewardType[rType]) {
      this.aggregatedStats.adsByRewardType[rType] = { offered: 0, accepted: 0, completed: 0 };
    }
    return this.aggregatedStats.adsByRewardType[rType];
  }

  getEvents(): AnalyticsEvent[] {
    return this.eventsCache;
  }

  getTransactions(): EconomyTransaction[] {
    return this.transactionsCache;
  }

  getAggregatedStats(): AggregatedStats {
    return this.aggregatedStats;
  }

  getActiveDays(): string[] {
    return this.activeDays;
  }

  getRegistrationDate(): string {
    return this.registrationDate;
  }

  private saveActiveDays() {
    try {
      localStorage.setItem(LocalAnalyticsProvider.ACTIVE_DAYS_KEY, JSON.stringify(this.activeDays));
    } catch (e) {
      console.error('Storage full or unavailable while saving active days', e);
    }
  }

  flush() {
    try {
      localStorage.setItem(LocalAnalyticsProvider.STORAGE_KEY, JSON.stringify(this.eventsCache));
      localStorage.setItem(LocalAnalyticsProvider.TRANSACTIONS_KEY, JSON.stringify(this.transactionsCache));
      localStorage.setItem(LocalAnalyticsProvider.AGGREGATED_KEY, JSON.stringify(this.aggregatedStats));
      localStorage.setItem(LocalAnalyticsProvider.ACTIVE_DAYS_KEY, JSON.stringify(this.activeDays));
    } catch (error) {
      console.error('[Analytics] Failed to save batch to localStorage (possibly full)', error);
      // If full, let's clear half the eventsCache and transactionsCache to reclaim space
      if (this.eventsCache.length > 50) {
        this.eventsCache = this.eventsCache.slice(-30);
      }
      if (this.transactionsCache.length > 50) {
        this.transactionsCache = this.transactionsCache.slice(-30);
      }
      try {
        localStorage.setItem(LocalAnalyticsProvider.STORAGE_KEY, JSON.stringify(this.eventsCache));
        localStorage.setItem(LocalAnalyticsProvider.TRANSACTIONS_KEY, JSON.stringify(this.transactionsCache));
      } catch (retryError) {
        console.error('[Analytics] Critical: storage still full after partial clear.', retryError);
      }
    }
  }

  clear() {
    this.eventsCache = [];
    this.transactionsCache = [];
    this.aggregatedStats = this.createInitialAggregatedStats();
    this.activeDays = [new Date().toISOString().split('T')[0]];
    this.registrationDate = this.activeDays[0];
    localStorage.removeItem(LocalAnalyticsProvider.STORAGE_KEY);
    localStorage.removeItem(LocalAnalyticsProvider.TRANSACTIONS_KEY);
    localStorage.removeItem(LocalAnalyticsProvider.AGGREGATED_KEY);
    localStorage.removeItem(LocalAnalyticsProvider.ACTIVE_DAYS_KEY);
  }
}

export class AnalyticsService {
  private static providers: AnalyticsProvider[] = [];
  private static localProvider: LocalAnalyticsProvider | null = null;
  private static sessionId: string = '';
  private static sessionStartTime: number = 0;
  private static initialized: boolean = false;
  private static batchTimer: any = null;

  static initialize() {
    if (this.initialized) return;
    
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    this.sessionStartTime = Date.now();

    // Setup Providers
    this.localProvider = new LocalAnalyticsProvider();
    this.providers = [
      this.localProvider,
      new ConsoleAnalyticsProvider(),
      new FutureRemoteAnalyticsProvider()
    ];

    this.initialized = true;

    // Track application open
    this.trackSessionStart();

    // Schedule automatic flush every 8 seconds (batch saving) to avoid frame-rate hits
    if (typeof window !== 'undefined') {
      this.batchTimer = setInterval(() => {
        this.flush();
      }, 8000);

      window.addEventListener('beforeunload', () => {
        this.trackSessionEnd();
        this.flush();
      });
    }
  }

  static getSessionId(): string {
    if (!this.sessionId) {
      this.initialize();
    }
    return this.sessionId;
  }

  static getLocalProvider(): LocalAnalyticsProvider {
    if (!this.localProvider) {
      this.initialize();
    }
    return this.localProvider!;
  }

  static trackEvent(eventName: string, properties: Record<string, any> = {}, runId?: string) {
    try {
      this.initialize(); // Ensure initialized
      
      const event: AnalyticsEvent = {
        id: 'evt_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        eventName,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        runId,
        gameVersion: '1.2.0',
        saveVersion: 1,
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS',
        environment: typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'development' : 'production',
        eventProperties: properties
      };

      this.providers.forEach(provider => {
        try {
          provider.track(event);
        } catch (pe) {
          console.error(`[Analytics] Error in provider ${provider.name}`, pe);
        }
      });
    } catch (err) {
      // "Nessun errore analytics deve bloccare il gioco."
      console.error('[Analytics] Error tracking event', err);
    }
  }

  static trackScreen(screenName: string) {
    this.trackEvent('screen_view', { screen_name: screenName });
  }

  static trackSessionStart() {
    const isReturning = localStorage.getItem('neon_runner_profile') !== null;
    this.trackEvent('session_start', {
      returning_player: isReturning,
      timestamp: this.sessionStartTime
    });
    this.trackEvent('application_open', {
      returning_player: isReturning
    });
  }

  static trackSessionEnd() {
    const duration = Date.now() - this.sessionStartTime;
    this.trackEvent('session_end', {
      session_duration: duration
    });
    this.trackEvent('application_close', {
      session_duration: duration
    });
  }

  static trackRunStart(runId: string, properties: {
    run_mode: string;
    selected_ship: string;
    selected_skin: string;
    selected_boosters: string[];
    active_live_event?: string;
    active_space_weather?: string;
  }) {
    this.trackEvent('run_started', properties, runId);
  }

  static trackRunEnd(runId: string, status: 'completed' | 'abandoned', properties: {
    run_duration: number;
    run_score: number;
    run_distance: number;
    run_mode: string;
    selected_ship: string;
    cause_of_death?: string;
    number_of_revives: number;
    rewarded_revive_used: boolean;
    gems_collected: number;
    enemies_destroyed: number;
    bosses_defeated: number;
    near_misses: number;
    maximum_combo: number;
  }) {
    const eventName = status === 'completed' ? 'run_completed' : 'run_abandoned';
    this.trackEvent(eventName, properties, runId);
  }

  static trackDeath(runId: string, properties: {
    cause_of_death: 'meteor_collision' | 'enemy_projectile' | 'boss_attack' | 'environmental_hazard' | 'unknown';
    distance: number;
    run_duration: number;
    selected_ship: string;
    health_before_impact: number;
    shield_active: boolean;
    active_difficulty: number;
    revive_available: boolean;
    revive_already_used: boolean;
  }) {
    this.trackEvent('player_died', properties, runId);
  }

  static trackRewardedAd(properties: {
    ad_state: 'offered' | 'accepted' | 'declined' | 'started' | 'completed' | 'failed' | 'reward_granted';
    reward_type: 'revive' | 'double_rewards' | 'booster' | 'premium_ship_trial' | 'extra_chest' | 'lucky_wheel_spin' | 'streak_freeze';
    runId?: string;
  }) {
    const eventName = `rewarded_ad_${properties.ad_state}`;
    this.trackEvent(eventName, {
      reward_type: properties.reward_type,
      run_id: properties.runId
    }, properties.runId);
  }

  static trackPurchase(properties: {
    purchase_state: 'opened' | 'viewed' | 'started' | 'completed' | 'cancelled' | 'failed' | 'restore_started' | 'restore_completed';
    product_id?: 'no_ads' | 'full_game_unlock' | 'vip_gold_pass' | 'starter_pack' | 'skin_pack' | 'gem_pack';
  }) {
    let eventName = '';
    if (properties.purchase_state === 'opened') {
      eventName = 'store_opened';
    } else if (properties.purchase_state === 'viewed') {
      eventName = 'product_viewed';
    } else if (properties.purchase_state.startsWith('restore')) {
      eventName = properties.purchase_state === 'restore_started' ? 'restore_purchases_started' : 'restore_purchases_completed';
    } else {
      eventName = `purchase_${properties.purchase_state}`;
    }
    
    this.trackEvent(eventName, {
      product_id: properties.product_id
    });
  }

  static trackEconomyTransaction(tx: Omit<EconomyTransaction, 'id' | 'timestamp' | 'sessionId'>) {
    try {
      this.initialize();
      const transaction: EconomyTransaction = {
        ...tx,
        id: 'tx_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        timestamp: Date.now(),
        sessionId: this.sessionId
      };

      if (this.localProvider) {
        this.localProvider.trackTransaction(transaction);
      }
      
      // Also log as an event for wider analytical funnels
      this.trackEvent('economy_transaction', {
        transaction_type: tx.transactionType,
        currency_type: tx.currencyType,
        amount: tx.amount,
        balance_before: tx.balanceBefore,
        balance_after: tx.balanceAfter,
        source: tx.source,
        sink: tx.sink,
        related_event: tx.relatedEvent
      }, tx.runId);
    } catch (e) {
      console.error('[Analytics] Failed to track economy transaction', e);
    }
  }

  static trackMissionProgress(missionId: string, progress: number, target: number) {
    this.trackEvent('mission_progress', {
      mission_id: missionId,
      progress,
      target
    });
  }

  static trackLiveEventInteraction(eventId: string, interactionType: 'view' | 'play' | 'claim', properties: Record<string, any> = {}) {
    this.trackEvent('live_event_interaction', {
      event_id: eventId,
      interaction_type: interactionType,
      ...properties
    });
  }

  static flush() {
    if (this.localProvider) {
      this.localProvider.flush();
    }
  }

  static clearAnalyticsData() {
    if (this.localProvider) {
      this.localProvider.clear();
    }
  }
}
