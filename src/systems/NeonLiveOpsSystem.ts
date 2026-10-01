import { UserState } from '../types';
import { SHIPS } from '../data';

export interface DailyEvent {
  id: string;
  name: string;
  dayName: string;
  description: string;
  emoji: string;
  badgeText: string;
  modifiers: {
    gemsMultiplier: number;
    scoreMultiplier: number;
    meteorSpeedMult: number;
    meteorSizeMult: number;
    spawnDelayMult: number;
    playerDamageMult: number;
    freeShield: boolean;
  };
}

export interface DailyOffer {
  id: string;
  title: string;
  description: string;
  originalGemsPrice: number;
  discountedGemsPrice: number;
  discountPct: number;
  skinName: string;
  skinColor: string;
  skinSecondaryColor: string;
  previewEmoji: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  targetType: 'destroy_meteors' | 'collect_gems' | 'travel_distance' | 'play_matches' | 'watch_ads';
  targetValue: number;
  rewardGems: number;
  description: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  restriction: 'no_gems' | 'base_laser_only' | 'no_shield' | 'no_damage_taken';
  rewardGems: number;
}

export interface SpaceWeather {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gameplayModifierText: string;
}

export interface GalacticLore {
  id: string;
  title: string;
  text: string;
  sender: string;
  transmissionTime?: string;
}

export const DAILY_EVENTS: Record<number, DailyEvent> = {
  0: { // Sunday
    id: 'shield_flux',
    name: 'SHIELD FLUX',
    dayName: 'Domenica',
    description: 'Anomalie magnetiche attivano gli scudi difensivi gratuitamente ad inizio partita.',
    emoji: '🛡️',
    badgeText: 'FREE SHIELD + COMET DAY',
    modifiers: { gemsMultiplier: 1.0, scoreMultiplier: 1.5, meteorSpeedMult: 1.2, meteorSizeMult: 1.0, spawnDelayMult: 0.9, playerDamageMult: 1, freeShield: true }
  },
  1: { // Monday
    id: 'meteor_storm',
    name: 'METEOR STORM',
    dayName: 'Lunedì',
    description: 'Una tempesta di detriti colossali riempie il settore. Più gemme ma i meteoriti sono giganti!',
    emoji: '🔥',
    badgeText: '+50% GEMME, METEORITI GIGANTI',
    modifiers: { gemsMultiplier: 1.5, scoreMultiplier: 1.0, meteorSpeedMult: 0.9, meteorSizeMult: 1.6, spawnDelayMult: 0.8, playerDamageMult: 1, freeShield: false }
  },
  2: { // Tuesday
    id: 'comet_day',
    name: 'COMET DAY',
    dayName: 'Martedì',
    description: 'Comete velocissime sfrecciano nello spazio aperto. Punteggio raddoppiato!',
    emoji: '☄️',
    badgeText: 'METEORITI VELOCI, SCORE x2',
    modifiers: { gemsMultiplier: 1.0, scoreMultiplier: 2.0, meteorSpeedMult: 1.45, meteorSizeMult: 0.85, spawnDelayMult: 1.1, playerDamageMult: 1, freeShield: false }
  },
  3: { // Wednesday
    id: 'gem_rush',
    name: 'GEM RUSH',
    dayName: 'Mercoledì',
    description: 'Rilevato un filone di gemme pure nel nucleo gravitazionale stellare. Rendita raddoppiata!',
    emoji: '💎',
    badgeText: 'GEMME DOPPIE, MINACCIA CRESCENTE',
    modifiers: { gemsMultiplier: 2.0, scoreMultiplier: 1.0, meteorSpeedMult: 1.1, meteorSizeMult: 1.0, spawnDelayMult: 0.85, playerDamageMult: 1, freeShield: false }
  },
  4: { // Thursday
    id: 'solar_storm',
    name: 'SOLAR STORM',
    dayName: 'Giovedì',
    description: 'La radiazione solare ionizza le armi a bordo delle navi. Laser incredibilmente potenti!',
    emoji: '☀️',
    badgeText: 'DANNO LASER RADDOPPIATO',
    modifiers: { gemsMultiplier: 1.0, scoreMultiplier: 1.2, meteorSpeedMult: 1.15, meteorSizeMult: 1.1, spawnDelayMult: 1.0, playerDamageMult: 2, freeShield: false }
  },
  5: { // Friday
    id: 'nebula_fog',
    name: 'NEBULA FOG',
    dayName: 'Venerdì',
    description: 'Una fitta nebbia cosmica rallenta la propagazione dei radar. Meteoriti compaiono più tardi!',
    emoji: '🌫️',
    badgeText: 'RITARDO APPARIZIONE NEMICI +30%',
    modifiers: { gemsMultiplier: 1.2, scoreMultiplier: 1.0, meteorSpeedMult: 0.8, meteorSizeMult: 0.9, spawnDelayMult: 1.5, playerDamageMult: 1, freeShield: false }
  },
  6: { // Saturday
    id: 'gravity_flux',
    name: 'GRAVITY FLUX',
    dayName: 'Sabato',
    description: 'Venti di gravità spingono la propulsione della nave oltre i limiti prestazionali di sicurezza.',
    emoji: '🌌',
    badgeText: 'NAVE ACCELERATA + AGILITÀ EXTREME',
    modifiers: { gemsMultiplier: 1.3, scoreMultiplier: 1.3, meteorSpeedMult: 1.2, meteorSizeMult: 1.0, spawnDelayMult: 0.9, playerDamageMult: 1, freeShield: false }
  }
};

export const DAILY_OFFERS: Record<number, DailyOffer> = {
  0: { id: 'off_0', title: 'Solar Dragon Edition', description: 'Skin termica solare arancione brillante per la tua flotta stellare.', originalGemsPrice: 300, discountedGemsPrice: 180, discountPct: 40, skinName: 'Solar Dragon 🔥', skinColor: '#f97316', skinSecondaryColor: '#fde047', previewEmoji: '🐉' },
  1: { id: 'off_1', title: 'Cosmic Emerald Cruiser', description: 'Estetica verde acido fluida con scia laser cromatica neon.', originalGemsPrice: 200, discountedGemsPrice: 120, discountPct: 40, skinName: 'Cosmic Emerald 🌌', skinColor: '#059669', skinSecondaryColor: '#10b981', previewEmoji: '🛸' },
  2: { id: 'off_2', title: 'Vortex Void Hunter', description: 'Livrea viola scuro del profondo cosmo con propulsori a impulsi viola.', originalGemsPrice: 250, discountedGemsPrice: 150, discountPct: 40, skinName: 'Vortex Void 🌀', skinColor: '#7c3aed', skinSecondaryColor: '#a78bfa', previewEmoji: '☄️' },
  3: { id: 'off_3', title: 'Carbon fiber Shadow', description: 'Nero opaco con dettagli carbonio per rendersi invisibili ai radar.', originalGemsPrice: 150, discountedGemsPrice: 90, discountPct: 40, skinName: 'Shadow Stealth 🕶️', skinColor: '#18181b', skinSecondaryColor: '#3f3f46', previewEmoji: '🚀' },
  4: { id: 'off_4', title: 'Plasma Supernova VIP', description: 'Skin ultra-riflettente rosa shock ed effetti magnetici potenziati.', originalGemsPrice: 350, discountedGemsPrice: 210, discountPct: 40, skinName: 'Plasma Supernova 💥', skinColor: '#db2777', skinSecondaryColor: '#f472b6', previewEmoji: '👾' },
  5: { id: 'off_5', title: 'Cyberpunk Cyberwave', description: 'Retro-futuristica estetica cyberpunk magenta e ciano fluorescente.', originalGemsPrice: 400, discountedGemsPrice: 240, discountPct: 40, skinName: 'Cyberwave ⚡', skinColor: '#ec4899', skinSecondaryColor: '#22d3ee', previewEmoji: '🎸' },
  6: { id: 'off_6', title: 'Golden Emperor Spec', description: 'Pregiato oro massiccio con scarico a energia solare purificata.', originalGemsPrice: 500, discountedGemsPrice: 300, discountPct: 40, skinName: 'Royal Gold 👑', skinColor: '#d97706', skinSecondaryColor: '#fbbf24', previewEmoji: '✨' }
};

export const DAILY_GOALS: Record<number, DailyGoal> = {
  0: { id: 'goal_0', title: 'Epurazione Settore', targetType: 'destroy_meteors', targetValue: 80, rewardGems: 150, description: 'Distruggi 80 meteoriti in qualsiasi partita.' },
  1: { id: 'goal_1', title: 'Cacciatore di Tesori', targetType: 'collect_gems', targetValue: 120, rewardGems: 200, description: 'Raccogli un totale di 120 gemme.' },
  2: { id: 'goal_2', title: 'Viaggio nell\'Iperspazio', targetType: 'travel_distance', targetValue: 3000, rewardGems: 180, description: 'Percorri una distanza complessiva di 3000 unità.' },
  3: { id: 'goal_3', title: 'Pilota Instancabile', targetType: 'play_matches', targetValue: 5, rewardGems: 120, description: 'Gioca 5 partite complete.' },
  4: { id: 'goal_4', title: 'Spettatore Consapevole', targetType: 'watch_ads', targetValue: 2, rewardGems: 200, description: 'Guarda 2 annunci o apri 2 casse Neon speciali.' },
  5: { id: 'goal_5', title: 'Esperto Schivate', targetType: 'destroy_meteors', targetValue: 50, rewardGems: 140, description: 'Distruggi 50 meteoriti.' },
  6: { id: 'goal_6', title: 'Collezionista di Frammenti', targetType: 'collect_gems', targetValue: 80, rewardGems: 160, description: 'Accumula 80 gemme durante i voli.' }
};

export const DAILY_CHALLENGES: Record<number, DailyChallenge> = {
  0: { id: 'chal_0', title: 'No Gems Challenge', description: 'Completa una partita segnando almeno 1000 punti SENZA raccogliere una singola gemma.', restriction: 'no_gems', rewardGems: 400 },
  1: { id: 'chal_1', title: 'Base Laser Only', description: 'Gioca una partita sopravvivendo almeno 40 secondi sparando solo con il laser base (niente booster di fuoco).', restriction: 'base_laser_only', rewardGems: 350 },
  2: { id: 'chal_2', title: 'No Shield Run', description: 'Ottieni almeno 800 punti senza MAI attivare uno scudo protettivo (raccoglierlo distruggerà la sfida!).', restriction: 'no_shield', rewardGems: 300 },
  3: { id: 'chal_3', title: 'Untouchable Ace', description: 'Percorri 1500 metri senza subire alcun danno di collisione durante la sessione.', restriction: 'no_damage_taken', rewardGems: 500 },
  4: { id: 'chal_4', title: 'No Magnet Orbit', description: 'Raggiungi 1200 punti senza raccogliere o attivare alcun potenziamento magnetico.', restriction: 'no_shield', rewardGems: 300 }, // using no_shield logic / similar
  5: { id: 'chal_5', title: 'Iron Wing Challenge', description: 'Resisti 60 secondi subendo al massimo 1 colpo.', restriction: 'no_damage_taken', rewardGems: 450 },
  6: { id: 'chal_6', title: 'Minimalist Fleet', description: 'Raggiungi 1500 punti usando solo la nave iniziale Neon Horizon.', restriction: 'base_laser_only', rewardGems: 400 }
};

export const SPACE_WEATHERS: Record<number, SpaceWeather> = {
  0: { id: 'weather_0', name: 'Nebulosa della Calma', emoji: '🌫️', description: 'Una nebbia molecolare avvolge il settore. I meteoriti faticano a penetrare i radar.', gameplayModifierText: 'I meteoriti compaiono con +50% di intervallo (gioco più rilassante).' },
  1: { id: 'weather_1', name: 'Tempesta Elettromagnetica', emoji: '⚡', description: 'Fulmini solari caricano le piastre termiche e il cannone a ricarica rapida.', gameplayModifierText: 'La cadenza di fuoco di tutte le navi è accelerata del 25%!' },
  2: { id: 'weather_2', name: 'Flusso Gravitazionale Omega', emoji: '🌌', description: 'Variazioni costanti dei campi gravitazionali alterano i propulsori di coda.', gameplayModifierText: 'La velocità della nave aumenta del 35% e i movimenti sono ultra fluidi.' },
  3: { id: 'weather_3', name: 'Silenzio Cosmico', emoji: '🤫', description: 'Tutto sembra calmo e vuoto, le radiazioni di fondo sono ridotte a zero.', gameplayModifierText: 'Minore frequenza di meteoriti veloci ma magnetismo ridotto.' },
  4: { id: 'weather_4', name: 'Flare Solare Attivo', emoji: '🔥', description: 'Il Sole è in fase di eruzione coronale intensa. Radiazioni termiche instabili.', gameplayModifierText: 'Laser del giocatore raddoppiati in danno, ma fumo e sfarfallio visivo.' },
  5: { id: 'weather_5', name: 'Vento di Asteroidi', emoji: '☄️', description: 'Un vento cosmico trascina detriti d\'oro puro. Più fruttuoso del solito.', gameplayMultiplierText: 'Ogni gemma raccolta vale il doppio dei punti!', gameplayModifierText: 'Tutti i generatori rilasciano +40% gemme.' } as any,
  6: { id: 'weather_6', name: 'Micro-Singolarità Quantistica', emoji: '⚛️', description: 'Piccole deformazioni spazio-temporali creano barriere protettive naturali.', gameplayModifierText: 'Inizi con un prototipo di scudo gravitazionale attivo.' }
};

export const LORE_TRANSMISSIONS: Record<number, GalacticLore> = {
  0: { id: 'lore_0', title: 'SETTORE DELTA ALLERTA', text: 'Trasmissione ricevuta dalla Flotta di Ricognizione Delta: "Le navi madre della Coalizione stanno schierando droni d\'assedio. State all\'erta, i settori di transito minerario sono compromessi."', sender: 'Cmd. Vance [Incrociatore Ares]', transmissionTime: '08:42 UTC' },
  1: { id: 'lore_1', title: 'COLLASSO DELLE MINIERE OMEGA', text: 'Rapporto di Sicurezza: "Il reattore termico delle miniere di silicio del settore Omega ha avuto un cedimento critico. Enormi meteoriti di scarto si stanno dirigendo verso l\'orbita civile."', sender: 'IA Centrale Aegis', transmissionTime: '11:15 UTC' },
  2: { id: 'lore_2', title: 'IL MISTERO DI AURUM ECLIPSE', text: 'Diario d\'Esplorazione: "Abbiamo individuato una scia d\'oro puro vicino ad una stella di neutroni. Sembra la traccia della mitica Aurum Eclipse... È possibile che qualcuno la stia pilotando?"', sender: 'Sondatore Solitario Kael', transmissionTime: '14:30 UTC' },
  3: { id: 'lore_3', title: 'SEGNALI DAL VUOTO', text: 'Intercettazione Criptata: "Il nucleo quantistico sta rispondendo... Esseri fatti di pura energia plasma stanno convertendo gli asteroidi in cannoni d\'assedio gravitazionali. Devono essere fermati."', sender: 'Ufficiale Scientifico Nyx', transmissionTime: '17:05 UTC' },
  4: { id: 'lore_4', title: 'PREPARATIVI AL SALTO IPERSPAZIALE', text: 'Messaggio Amministrativo: "Tutti i piloti indipendenti sono pregati di accumulare quante più Gemme Neon possibili. La flotta federale ha bisogno di carburante ionico per il salto."', sender: 'Consiglio dei Settori Uniti', transmissionTime: '19:10 UTC' },
  5: { id: 'lore_5', title: 'ATTACCO DEI SERPENTI DI NEON', text: 'Radio di Emergenza: "I cacciatori di taglie del Neon Serpent hanno teso un\'imboscata al convoglio merci. Le navi cargo sono distrutte, i boss controllano le via commerciali!"', sender: 'Capitano Marcus [Nave Cargo Beta]', transmissionTime: '21:55 UTC' },
  6: { id: 'lore_6', title: 'PROSPETTIVE PRESTIGE', text: 'Documento d\'Archivio: "I piloti leggendari che raggiungono il grado di Master possono convertire le loro flotte in Stelle Prestige, sbloccando le leggendarie costellazioni di vernici metalliche."', sender: 'Accademia di Volo di Neon', transmissionTime: '23:15 UTC' }
};

export class NeonLiveOpsSystem {
  static getTodayDayIndex(): number {
    return new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  }

  static getTodayEvent(): DailyEvent {
    const day = this.getTodayDayIndex();
    return DAILY_EVENTS[day] || DAILY_EVENTS[1];
  }

  static getTodayOffer(): DailyOffer {
    const day = this.getTodayDayIndex();
    return DAILY_OFFERS[day] || DAILY_OFFERS[0];
  }

  static getTodayGoal(): DailyGoal {
    const day = this.getTodayDayIndex();
    return DAILY_GOALS[day] || DAILY_GOALS[0];
  }

  static getTodayChallenge(): DailyChallenge {
    const day = this.getTodayDayIndex();
    return DAILY_CHALLENGES[day] || DAILY_CHALLENGES[0];
  }

  static getSpaceWeather(): SpaceWeather {
    const day = this.getTodayDayIndex();
    return SPACE_WEATHERS[day] || SPACE_WEATHERS[0];
  }

  static getTodayLore(): GalacticLore {
    const day = this.getTodayDayIndex();
    return LORE_TRANSMISSIONS[day] || LORE_TRANSMISSIONS[0];
  }

  // Nave del giorno trial rotate
  static getTodayTrialShipId(): string {
    const shipsWithPremium = ['premium_quantum', 'premium_golden', 'dreadnought', 'velocity'];
    const day = this.getTodayDayIndex();
    return shipsWithPremium[day % shipsWithPremium.length];
  }

  // Galactic Archive collections configuration
  static getArchiveData() {
    return {
      enemies: [
        { id: 'meteor_s', name: 'Meteora Comune', desc: 'Piccolo frammento roccioso rapido.', icon: '☄️', rarity: 'Comune' },
        { id: 'meteor_m', name: 'Meteora Media', desc: 'Massa rocciosa standard con discreta resistenza.', icon: '🪨', rarity: 'Comune' },
        { id: 'meteor_l', name: 'Meteora Gigante', desc: 'Mega asteroide devastante. Rilascia gemme.', icon: '🪐', rarity: 'Raro' },
        { id: 'drone', name: 'Drone Sentinella', desc: 'Dispositivo robotico che blocca i laser.', icon: '🛰️', rarity: 'Raro' },
        { id: 'gravity_well', name: 'Varco Gravitazionale', desc: 'Distorce la traiettoria di volo e attrae i proiettili.', icon: '🌀', rarity: 'Epico' }
      ],
      bosses: [
        { id: 'abyss_titan', name: 'Abyss Titan', desc: 'Boss domenicale. Crea varchi energetici.', icon: '👹', rarity: 'Leggendario' },
        { id: 'asteroid_colossus', name: 'Asteroid Colossus', desc: 'Boss del lunedì. Sventagliate laser mortali.', icon: '🗿', rarity: 'Leggendario' },
        { id: 'neon_serpent', name: 'Neon Serpent', desc: 'Boss del martedì. Movimenti serpentini termici.', icon: '🐉', rarity: 'Leggendario' },
        { id: 'void_drone', name: 'Void Drone', desc: 'Boss del mercoledì. Evoca scudi protettivi rotanti.', icon: '🛸', rarity: 'Leggendario' },
        { id: 'plasma_core', name: 'Plasma Core', desc: 'Boss del giovedì. Anelli laser instabili.', icon: '☀️', rarity: 'Leggendario' },
        { id: 'quantum_crusher', name: 'Quantum Crusher', desc: 'Boss del venerdì. Svanisce e lancia missili termici.', icon: '⚛️', rarity: 'Leggendario' },
        { id: 'solar_leviathan', name: 'Solar Leviathan', desc: 'Boss del sabato. Sfrutta flare solari mortali.', icon: '🐋', rarity: 'Leggendario' }
      ],
      skins: [
        { id: 'off_0', name: 'Solar Dragon 🔥', desc: 'Verniciatura arancione fluorescente super sportiva.', icon: '🐉', rarity: 'Raro' },
        { id: 'off_1', name: 'Cosmic Emerald 🌌', desc: 'Copertura verde spaziale brillante.', icon: '🛸', rarity: 'Raro' },
        { id: 'off_2', name: 'Vortex Void 🌀', desc: 'Livrea viola e scia cangiante.', icon: '☄️', rarity: 'Epico' },
        { id: 'off_3', name: 'Shadow Stealth 🕶️', desc: 'Nero opaco ad assorbimento luminoso completo.', icon: '🚀', rarity: 'Epico' },
        { id: 'off_4', name: 'Plasma Supernova 💥', desc: 'Cromatura rosa fluida con scia termica neon.', icon: '👾', rarity: 'Leggendario' },
        { id: 'off_5', name: 'Cyberwave ⚡', desc: 'Design cyberpunk magenta e azzurro fluorescente.', icon: '🎸', rarity: 'Leggendario' },
        { id: 'off_6', name: 'Royal Gold 👑', desc: 'Oro massiccio 24k d\'eccellenza federale.', icon: '✨', rarity: 'Epico' }
      ],
      ships: SHIPS.map(s => ({
        id: s.id,
        name: s.name,
        desc: s.description,
        icon: s.id === 'starter' ? '🚀' : s.id === 'velocity' ? '⚡' : s.id === 'dreadnought' ? '🛡️' : '👑',
        rarity: s.isPremium ? 'Epico' : 'Comune'
      }))
    };
  }

  // Badges lists
  static getBadgesList() {
    return [
      { id: 'veteran', name: 'Veterano Spaziale', requirement: 'Raggiungi una streak globale di 3 giorni', icon: '🔥', reward: '300 Gemme', key: 'streak', target: 3 },
      { id: 'boss_hunter', name: 'Boss Hunter Legend', requirement: 'Sconfiggi 5 Boss Giornalieri', icon: '🏆', reward: 'Skin Royal Gold Gratis', key: 'boss_kills', target: 5 },
      { id: 'neon_master', name: 'Neon Miner', requirement: 'Raccogli un totale di 2000 Gemme', icon: '💎', reward: 'Titolo Pilota Onorario', key: 'total_gems', target: 2000 },
      { id: 'prestige_pilot', name: 'Prestige Pilot', requirement: 'Effettua il Prestige della tua flotta', icon: '⭐', reward: 'Prestige Stars Special', key: 'prestige', target: 1 }
    ];
  }

  // Update Daily Goal Progress
  static updateGoalProgress(profile: UserState, stats: { enemiesDestroyed: number; gemsCollected: number; distance: number; matchPlayed: boolean; adWatched?: boolean }) {
    const updated = { ...profile };
    if (!updated.dailyGoalProgress) {
      updated.dailyGoalProgress = {};
    }
    const todayGoal = this.getTodayGoal();
    const currentVal = updated.dailyGoalProgress[todayGoal.id] || 0;
    
    let added = 0;
    if (todayGoal.targetType === 'destroy_meteors') added = stats.enemiesDestroyed;
    if (todayGoal.targetType === 'collect_gems') added = stats.gemsCollected;
    if (todayGoal.targetType === 'travel_distance') added = Math.floor(stats.distance);
    if (todayGoal.targetType === 'play_matches' && stats.matchPlayed) added = 1;
    if (todayGoal.targetType === 'watch_ads' && stats.adWatched) added = 1;

    updated.dailyGoalProgress[todayGoal.id] = Math.min(todayGoal.targetValue, currentVal + added);
    return updated;
  }

  // Prestige Engine
  static canPrestige(profile: UserState): boolean {
    // Requires a great highscore (> 1200 points) and owning at least 3 ships, or high gems count
    return (profile.highscore >= 1000 && (profile.ownedShips || []).length >= 2);
  }

  static performPrestige(profile: UserState): UserState {
    if (!this.canPrestige(profile)) return profile;

    const currentPrestige = profile.prestigeLevel || 0;
    const currentStars = profile.prestigeStars || 0;

    return {
      ...profile,
      prestigeLevel: currentPrestige + 1,
      prestigeStars: currentStars + 3, // 3 Prestige Stars granted per reset!
      gems: 100, // Reset gems but give starter package
      ownedShips: ['starter'], // Reset unlocked ships to standard
      equippedShip: 'starter',
      upgradeLevels: { laser_damage: 1, magnet_range: 1, shield_duration: 1 } // reset upgrades
    };
  }

  // Fleet Upgrade Engine
  static getFleetUpgradeCost(level: number): number {
    return Math.floor(50 * Math.pow(1.35, level - 1));
  }

  static getFleetLevelUpXp(level: number): number {
    return Math.floor(100 * Math.pow(1.25, level - 1));
  }

  static addFleetShipXp(profile: UserState, shipId: string, xpAmount: number): { updatedProfile: UserState; leveledUp: boolean } {
    const updated = { ...profile };
    if (!updated.fleet) {
      updated.fleet = {};
    }

    if (!updated.fleet[shipId]) {
      updated.fleet[shipId] = { level: 1, xp: 0, matchesPlayed: 0, enemiesDestroyed: 0 };
    }

    const shipStats = updated.fleet[shipId];
    shipStats.xp += xpAmount;
    shipStats.matchesPlayed += 1;

    let leveledUp = false;
    let xpNeeded = this.getFleetLevelUpXp(shipStats.level);

    while (shipStats.xp >= xpNeeded) {
      shipStats.xp -= xpNeeded;
      shipStats.level += 1;
      leveledUp = true;
      xpNeeded = this.getFleetLevelUpXp(shipStats.level);
    }

    return { updatedProfile: updated, leveledUp };
  }

  // Get active stats boost for ship level
  static getShipLevelBoosts(level: number) {
    const speedBoost = (level - 1) * 0.15; // +0.15 speed per level
    const fireRateReduction = (level - 1) * 12; // -12ms laser delay per level
    const healthBoost = Math.floor((level - 1) / 5); // +1 Max HP every 5 levels
    return { speedBoost, fireRateReduction, healthBoost };
  }

  static getShipNextLevelXp(level: number): number {
    return this.getFleetLevelUpXp(level);
  }

  static LUCKY_WHEEL_SECTOR_PRIZES = [
    { text: '100 💎', value: 100, type: 'gems' },
    { text: '250 💎', value: 250, type: 'gems' },
    { text: '1x Scudo 🛡️', value: 1, type: 'shield_boost' },
    { text: '500 💰', value: 500, type: 'coins' },
    { text: '50 💎', value: 50, type: 'gems' },
    { text: '2x Frammenti 📦', value: 2, type: 'fragments' },
    { text: '150 💎', value: 150, type: 'gems' },
    { text: '300 💰', value: 300, type: 'coins' },
  ];
}
