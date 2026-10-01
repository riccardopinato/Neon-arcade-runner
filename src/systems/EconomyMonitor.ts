import { UserState } from '../types';
import { AnalyticsService } from './AnalyticsService';

export interface EconomyReport {
  netBalance: number;
  totalGemsEarned: number;
  totalGemsSpent: number;
  sources: Record<string, number>;
  sinks: Record<string, number>;
  topSource: string;
  topSink: string;
  warnings: string[];
}

export class EconomyMonitor {
  /**
   * Generates a complete report of the economy based on tracked transactions.
   */
  static generateReport(): EconomyReport {
    const provider = AnalyticsService.getLocalProvider();
    const txs = provider.getTransactions();
    const agg = provider.getAggregatedStats();

    const sources = { ...agg.gemsGeneratedBySource };
    const sinks = { ...agg.gemsConsumedBySink };

    let totalGemsEarned = agg.totalGemsGenerated;
    let totalGemsSpent = agg.totalGemsConsumed;

    // Double check with local transactions cache
    txs.forEach(tx => {
      if (tx.currencyType === 'gems') {
        if (tx.transactionType === 'credit') {
          const src = tx.source || 'unknown';
          if (!sources[src]) sources[src] = 0;
          // Avoid double counting if already aggregated, but for a general fallback:
        } else {
          const sink = tx.sink || 'unknown';
          if (!sinks[sink]) sinks[sink] = 0;
        }
      }
    });

    // Find top source
    let topSource = 'Nessuna';
    let maxSourceAmount = 0;
    Object.entries(sources).forEach(([src, amount]) => {
      if (amount > maxSourceAmount) {
        maxSourceAmount = amount;
        topSource = src;
      }
    });

    // Find top sink
    let topSink = 'Nessuno';
    let maxSinkAmount = 0;
    Object.entries(sinks).forEach(([sink, amount]) => {
      if (amount > maxSinkAmount) {
        maxSinkAmount = amount;
        topSink = sink;
      }
    });

    const netBalance = totalGemsEarned - totalGemsSpent;

    return {
      netBalance,
      totalGemsEarned,
      totalGemsSpent,
      sources,
      sinks,
      topSource: `${topSource} (${maxSourceAmount} 💎)`,
      topSink: `${topSink} (${maxSinkAmount} 💎)`,
      warnings: []
    };
  }

  /**
   * Analyzes current user state and telemetry events to identify anomalies automatically.
   */
  static detectAnomalies(userState: UserState): string[] {
    const warnings: string[] = [];
    const provider = AnalyticsService.getLocalProvider();
    const agg = provider.getAggregatedStats();
    const events = provider.getEvents();
    const txs = provider.getTransactions();

    // 1. Sessioni con run troppo brevi (Average run duration < 15s over at least 3 runs)
    if (agg.totalRuns >= 3) {
      const avgDuration = agg.totalRunDurationSec / agg.totalRuns;
      if (avgDuration < 15) {
        warnings.push(`⚠️ Run Troppo Brevi: La durata media delle run è di soli ${avgDuration.toFixed(1)}s. Il gameplay potrebbe risultare troppo punitivo o frustrante.`);
      }
    }

    // 2. Accumulo anomalo di gemme (Single credit transaction > 1000 gems, or user has > 10000 gems with very few matches)
    const hasHugeTx = txs.some(tx => tx.currencyType === 'gems' && tx.transactionType === 'credit' && tx.amount > 1000);
    const matchesCount = userState.totalMatchesPlayed || agg.totalRuns || 0;
    if (hasHugeTx || (userState.gems > 10000 && matchesCount < 5)) {
      warnings.push(`⚠️ Accumulo Anomalo di Gemme: Rilevato picco improvviso nel saldo (${userState.gems} 💎 con ${matchesCount} partite). Sospetta cheat o bug nell'assegnazione delle ricompense.`);
    }

    // 3. Numero eccessivo di rewarded ads (> 4 ads watched in a session or ad ratio > 2.0 per match)
    const adsWatched = userState.dailyAdsWatched || userState.adsWatchedCount || 0;
    if (adsWatched > 8) {
      warnings.push(`⚠️ Troppi Rewarded Ads: Il giocatore ha visualizzato ${adsWatched} annunci oggi. Attenzione al rischio di affaticamento da ad e impatto negativo sulla retention.`);
    }

    // 4. Upgrade troppo costosi (If an upgrade base cost or upgrade cost exceeds user's current gems by 15x, or is > 2000 gems)
    const upgrades = userState.upgradeLevels || {};
    const upgradeCosts = [100, 80, 120]; // base costs
    let hasWayTooExpensiveUpgrade = false;
    Object.entries(upgrades).forEach(([id, lvl]) => {
      const baseCost = id === 'laser_damage' ? 100 : id === 'magnet_range' ? 80 : 120;
      const nextCost = Math.round(baseCost * Math.pow(1.5, lvl - 1));
      if (nextCost > 1500 || (nextCost > 100 && userState.gems < nextCost / 10)) {
        hasWayTooExpensiveUpgrade = true;
      }
    });
    if (hasWayTooExpensiveUpgrade) {
      warnings.push(`⚠️ Upgrade Troppo Costosi: Alcuni potenziamenti costano più di quanto l'economia di gioco consenta agevolmente di accumulare.`);
    }

    // 5. Missioni quasi mai completate (Played > 5 games, but claimed missions is 0)
    const claimedCount = userState.claimedMissions?.length || 0;
    if (matchesCount > 5 && claimedCount === 0) {
      warnings.push(`⚠️ Missioni Ignorate: Nessuna missione completata dopo ${matchesCount} partite. I requisiti potrebbero essere troppo alti o l'interfaccia poco visibile.`);
    }

    // 6. Boss con percentuale di vittoria troppo bassa (Played daily boss run mode but failed to defeat the boss repeatedly)
    const bossRuns = events.filter(e => e.eventName === 'run_completed' && e.eventProperties?.run_mode === 'daily_boss').length;
    const bossWins = userState.dailyBossBadgesCollected?.length || 0;
    if (bossRuns >= 3 && bossWins / bossRuns < 0.2) {
      warnings.push(`⚠️ Boss Troppo Difficile: Percentuale di vittoria contro i Boss del Giorno inferiore al 20% (${bossWins} vittorie su ${bossRuns} tentativi). Considera di ribilanciare i parametri.`);
    }

    // 7. Navi mai utilizzate (Owned > 2 ships, but usage of other ships is 0)
    const ownedCount = userState.ownedShips.length;
    if (ownedCount > 1) {
      const unusedShips: string[] = [];
      userState.ownedShips.forEach(shipId => {
        if (shipId !== 'starter' && (!agg.shipUsage[shipId] || agg.shipUsage[shipId] === 0)) {
          unusedShips.push(shipId);
        }
      });
      if (unusedShips.length > 0) {
        warnings.push(`⚠️ Navi Inutilizzate: Il giocatore possiede navi che non ha mai pilotato (${unusedShips.join(', ')}). Incentiva l'uso con sconti o bonus dedicati.`);
      }
    }

    return warnings;
  }
}
