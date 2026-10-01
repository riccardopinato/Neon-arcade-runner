import { Ship, PurchaseItem } from './types';

export const SHIPS: Ship[] = [
  {
    id: 'starter',
    name: 'Neon Horizon',
    description: 'Nave standard con prestazioni bilanciate. Perfetta per principianti.',
    speed: 5,
    fireRate: 400, // ms
    health: 3,
    priceGems: 0,
    isPremium: false,
    color: '#3b82f6', // blue
    secondaryColor: '#60a5fa',
    bulletColor: '#38bdf8'
  },
  {
    id: 'velocity',
    name: 'Cyber Swift',
    description: 'Nave superveloce e agile. Ideale per schivare meteoriti ma ha meno salute.',
    speed: 7,
    fireRate: 300,
    health: 2,
    priceGems: 250,
    isPremium: false,
    color: '#10b981', // emerald
    secondaryColor: '#34d399',
    bulletColor: '#6ee7b7'
  },
  {
    id: 'dreadnought',
    name: 'Hyperion Shield',
    description: 'Un incrociatore pesante. Estremamente corazzato con più punti salute di base.',
    speed: 4,
    fireRate: 500,
    health: 5,
    priceGems: 500,
    isPremium: false,
    color: '#f59e0b', // amber
    secondaryColor: '#fbbf24',
    bulletColor: '#fde047'
  },
  {
    id: 'premium_golden',
    name: 'Aurum Eclipse (VIP)',
    description: '👑 Edizione Esclusiva Premium. Velocità fulminea, triplo laser e scudo magnetico integrato.',
    speed: 8,
    fireRate: 200,
    health: 4,
    priceGems: 0, // Unlocked only via Premium Subscription
    isPremium: true,
    color: '#eab308', // gold
    secondaryColor: '#fef08a',
    bulletColor: '#facc15'
  },
  {
    id: 'premium_quantum',
    name: 'Quantum Phantom (VIP)',
    description: '👑 Edizione Esclusiva Premium. Proiettili a ricerca e immunità temporanea migliorata.',
    speed: 6,
    fireRate: 150,
    health: 4,
    priceGems: 0, // Unlocked only via Premium Subscription
    isPremium: true,
    color: '#ec4899', // pink
    secondaryColor: '#fbcfe8',
    bulletColor: '#f472b6'
  }
];

export const STORE_PRODUCTS: PurchaseItem[] = [
  {
    id: 'noncons_neon_premium',
    title: 'Neon Premium Lifetime',
    description: 'Sblocca tutte le navi premium, la modalità Chaos, il raddoppio automatico delle gemme, il rientro VIP giornaliero e rimuove per sempre gli annunci interstitial.',
    price: '€5.99',
    type: 'non-consumable',
    icon: 'Crown'
  },
  {
    id: 'noncons_remove_ads',
    title: 'No Ads',
    description: 'Rimuove definitivamente gli annunci interstitial automatici. I video premio restano sempre opzionali.',
    price: '€2.99',
    type: 'non-consumable',
    icon: 'ShieldAlert'
  },
  {
    id: 'cons_gems_100',
    title: 'Sacchetto di Gemme (100)',
    description: 'Un piccolo carico di gemme lucenti per sbloccare rapidamente nuove astronavi dallo store offline.',
    price: '€0.99',
    type: 'consumable',
    gemsReward: 100,
    icon: 'Gem'
  },
  {
    id: 'cons_gems_500',
    title: 'Cassaforte di Gemme (500)',
    description: 'Ottimo rapporto qualità-prezzo. Sblocca istantaneamente navi potenti e potenziamenti.',
    price: '€2.49',
    type: 'consumable',
    gemsReward: 500,
    icon: 'Coins'
  },
  {
    id: 'cons_gems_1500',
    title: 'Cassa Galattica (1500)',
    description: 'Il tesoro supremo dell\'esploratore stellare. Diventa ricchissimo e sblocca tutto.',
    price: '€4.99',
    type: 'consumable',
    gemsReward: 1500,
    icon: 'TreasureChest'
  }
];

export interface MockAd {
  id: string;
  advertiser: string;
  headline: string;
  cta: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  visualEmoji: string;
}

export const MOCK_ADS: MockAd[] = [
  {
    id: 'ad_cyber_energy',
    advertiser: 'CyberGlow Energy ⚡',
    headline: 'Ottieni energia illimitata per le tue sessioni di gioco! Gusto Neon Lime.',
    cta: 'Acquista Ora a €1.99',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    visualEmoji: '🔋'
  },
  {
    id: 'ad_space_pizza',
    advertiser: 'Galactic Pizza Delivery 🍕',
    headline: 'Consegna in 15 minuti in tutta la galassia o è GRATIS! Prova la Margherita Spaziale.',
    cta: 'Ordina in Orbita',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    visualEmoji: '🍕'
  },
  {
    id: 'ad_robo_pet',
    advertiser: 'MyRoboPet AI 🐶',
    headline: 'Il cucciolo meccanico che non sporca e ti ama al 100%. Versione Chrome 2.0.',
    cta: 'Adotta un Robot',
    bgColor: 'bg-pink-950/40',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-400',
    visualEmoji: '🤖'
  },
  {
    id: 'ad_crypto_ship',
    advertiser: 'RocketCrypto 🚀',
    headline: 'Metti in staking le tue meteoriti e ottieni rendimenti stellari del 420% APY!',
    cta: 'Inizia il Mining',
    bgColor: 'bg-blue-950/40',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    visualEmoji: '💎'
  }
];
