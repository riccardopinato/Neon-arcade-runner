import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ADS, MockAd } from '../data';
import { audio } from '../utils/audio';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Timer, 
  CheckCircle2, 
  Zap, 
  Heart, 
  X, 
  AlertTriangle 
} from 'lucide-react';

interface AdOverlayProps {
  type: 'banner' | 'interstitial' | 'rewarded';
  rewardType?: 'extra_life' | 'shield_boost' | 'magnet_boost' | 'fire_boost' | 'gems_double';
  onClose: (rewardGranted: boolean) => void;
  isAdFree: boolean;
  isPremium: boolean;
}

export const AdOverlay: React.FC<AdOverlayProps> = ({ 
  type, 
  rewardType, 
  onClose, 
  isAdFree, 
  isPremium 
}) => {
  const [currentAd, setCurrentAd] = useState<MockAd>(MOCK_ADS[0]);
  const [countdown, setCountdown] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const [interactiveScore, setInteractiveScore] = useState(0);
  const [adFinished, setAdFinished] = useState(false);
  const [showBannerUpsell, setShowBannerUpsell] = useState(false);
  const initialized = useRef(false);

  // Set up random ad on mount
  useEffect(() => {
    if (!initialized.current) {
      const randAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
      setCurrentAd(randAd);
      initialized.current = true;
    }
  }, []);

  // Set up countdown for interstitial and rewarded ads
  useEffect(() => {
    if (type === 'banner') return;

    if (countdown > 0 && !adFinished) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !adFinished) {
      setAdFinished(true);
      audio.playCollect(); // Chime for completion
    }
  }, [countdown, type, adFinished]);

  // If user is VIP (Premium) or purchased No-Ads, do not show Banner or Interstitial
  const skipAds = isPremium || isAdFree;
  if (skipAds && type !== 'rewarded') {
    return null;
  }

  const handleCloseAd = (rewardGranted: boolean) => {
    audio.playClick();
    onClose(rewardGranted);
  };

  const toggleMute = () => {
    audio.playClick();
    setIsMuted(!isMuted);
  };

  const handlePlayableClick = () => {
    audio.playLaser();
    setInteractiveScore(prev => prev + 1);
    if (interactiveScore + 1 >= 5 && countdown > 1) {
      // Faster completion if they play the mini-game!
      setCountdown(0);
      setAdFinished(true);
    }
  };

  // Render Banner Ad
  if (type === 'banner') {
    return (
      <div className="w-full bg-zinc-950 border-t border-blue-500/30 text-white relative select-none">
        {showBannerUpsell ? (
          <div className="flex items-center justify-between px-4 py-2 bg-yellow-950/20 text-yellow-400 border-b border-yellow-500/20 text-xs">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Sblocca la versione <strong>VIP Premium</strong> per rimuovere TUTTI i banner e raddoppiare i premi di gioco!
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => { audio.playClick(); setShowBannerUpsell(false); }}
                className="hover:underline font-bold"
              >
                Chiudi info
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-extrabold rounded tracking-wider uppercase flex-shrink-0 animate-pulse">
              SPONSOR
            </div>
            <span className="text-xl flex-shrink-0">{currentAd.visualEmoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate">{currentAd.advertiser}</p>
              <p className="text-sm text-white font-medium truncate">{currentAd.headline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a 
              href="#store" 
              onClick={(e) => { e.preventDefault(); audio.playClick(); }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-full text-white transition-all whitespace-nowrap"
            >
              {currentAd.cta}
            </a>
            <button 
              onClick={() => { audio.playClick(); setShowBannerUpsell(true); }}
              className="p-1 rounded hover:bg-zinc-800 text-gray-500 hover:text-white transition-colors"
              title="Rimuovi Annunci"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Screen Ads (Interstitial or Rewarded)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
      <div className="relative w-full max-w-lg overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-950 text-white shadow-2xl">
        
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-blue-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {type === 'rewarded' ? 'Annuncio Video Ricompensa' : 'Annuncio Pubblicitario Intermedio'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-gray-300"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {adFinished ? (
              <button 
                onClick={() => handleCloseAd(type === 'rewarded')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1 transition-all"
              >
                Chiudi ad <X className="w-3 h-3" />
              </button>
            ) : (
              <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 animate-spin" /> {countdown}s
              </div>
            )}
          </div>
        </div>

        {/* Ad Body */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className={`w-24 h-24 rounded-2xl border flex items-center justify-center text-5xl shadow-lg ${currentAd.borderColor} ${currentAd.bgColor}`}>
            {currentAd.visualEmoji}
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl text-white tracking-tight">{currentAd.advertiser}</h3>
            <p className="text-sm text-gray-400 px-4">{currentAd.headline}</p>
          </div>

          {/* Interactive Playable Mini-game */}
          {!adFinished ? (
            <div className="w-full p-4 rounded-xl border border-zinc-900 bg-zinc-900/40 space-y-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest block">Minigioco Interattivo (Clicca per saltare l'ad!)</span>
              <button 
                onClick={handlePlayableClick}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                🎯 Clicca Bersaglio ({interactiveScore}/5)
              </button>
              <span className="text-[10px] text-gray-500">Gioca per azzerare istantaneamente il timer di attesa dell'annuncio!</span>
            </div>
          ) : (
            <div className="w-full p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 flex flex-col items-center justify-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              <div>
                <h4 className="font-bold text-emerald-400 text-sm">Annuncio Completato con Successo!</h4>
                {type === 'rewarded' && rewardType && (
                  <p className="text-xs text-emerald-300/80 mt-1">
                    Hai sbloccato il premio: <span className="font-bold uppercase text-emerald-300">
                      {rewardType === 'extra_life' && '❤️ 1 Vita Extra'}
                      {rewardType === 'shield_boost' && '🛡️ Scudo Temporaneo (45s)'}
                      {rewardType === 'magnet_boost' && '🧲 Calamita Monete (45s)'}
                      {rewardType === 'fire_boost' && '⚡ Cadenza Fuoco Rapido (45s)'}
                      {rewardType === 'gems_double' && '💎 Raddoppio Gemme Raccolte'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bottom Info */}
          {type === 'rewarded' ? (
            <div className="text-xs text-gray-500 italic">
              *La ricompensa verrà applicata istantaneamente all'inizio della prossima partita.
            </div>
          ) : (
            <button 
              onClick={() => {
                audio.playClick();
                // Close ad without reward (it was standard interstitial)
                onClose(false);
              }}
              disabled={!adFinished}
              className={`w-full py-3 font-bold rounded-xl transition-all text-sm uppercase tracking-wider ${
                adFinished 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-zinc-900 border border-zinc-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {adFinished ? 'Continua al Gioco' : `Attendi ${countdown} secondi...`}
            </button>
          )}

          {!isPremium && !isAdFree && (
            <div className="pt-2">
              <span className="text-[11px] text-yellow-500/80 font-medium">
                👑 Rimuovi per sempre questi annunci acquistando il Premium nello Store offline!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
