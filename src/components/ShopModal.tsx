import React, { useState } from 'react';
import { PurchaseItem, UserState } from '../types';
import { STORE_PRODUCTS } from '../data';
import { audio } from '../utils/audio';
import {
  Check,
  Crown,
  Gem,
  Loader,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  X
} from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  billingMode: 'mock' | 'production';
  onPurchase: (product: PurchaseItem) => Promise<{ success: boolean; error?: string }>;
  onRestorePurchases: () => Promise<boolean>;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  userState,
  billingMode,
  onPurchase,
  onRestorePurchases
}) => {
  const [selectedProduct, setSelectedProduct] = useState<PurchaseItem | null>(null);
  const [step, setStep] = useState<'browse' | 'confirm' | 'processing' | 'success'>('browse');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState(false);

  if (!isOpen) return null;

  const isOwned = (product: PurchaseItem) =>
    (product.id === 'noncons_neon_premium' && userState.isPremium) ||
    (product.id === 'noncons_remove_ads' && (userState.isAdFree || userState.isPremium));

  const iconFor = (product: PurchaseItem) => {
    if (product.id === 'noncons_neon_premium') {
      return <Crown className="w-6 h-6 text-yellow-400" />;
    }
    if (product.id === 'noncons_remove_ads') {
      return <ShieldAlert className="w-6 h-6 text-blue-400" />;
    }
    return <Gem className="w-6 h-6 text-pink-400" />;
  };

  const selectProduct = (product: PurchaseItem) => {
    if (isOwned(product)) return;
    audio.playClick();
    setSelectedProduct(product);
    setError('');
    setStep('confirm');
  };

  const buySelected = async () => {
    if (!selectedProduct) return;

    audio.playClick();
    setError('');
    setStatus(
      billingMode === 'production'
        ? 'Apertura acquisto sicuro Google Play...'
        : 'Simulazione acquisto sandbox...'
    );
    setStep('processing');

    const result = await onPurchase(selectedProduct);
    if (!result.success) {
      setError(result.error || 'Acquisto non riuscito.');
      setStep('confirm');
      return;
    }

    audio.playPremiumSuccess();
    setStep('success');
  };

  const restore = async () => {
    audio.playClick();
    setRestoring(true);
    setError('');

    const ok = await onRestorePurchases();

    setRestoring(false);
    if (!ok) {
      setError('Nessun acquisto ripristinabile trovato o provider non disponibile.');
      return;
    }
    setStatus('Ripristino acquisti completato.');
  };

  const close = () => {
    setSelectedProduct(null);
    setStep('browse');
    setStatus('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="font-black text-lg">Neon Store</h2>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                {billingMode === 'production' ? 'Google Play Billing' : 'Sandbox / mock billing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
            aria-label="Chiudi store"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {step === 'browse' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-yellow-500/25 bg-yellow-500/5 flex gap-3">
                <Crown className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-black text-yellow-300">Neon Premium Lifetime</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Pagamento una tantum: zero interstitial automatici, tutte le navi premium,
                    Chaos, gemme x2 e un rientro VIP gratuito al giorno.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {STORE_PRODUCTS.map(product => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    disabled={isOwned(product)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isOwned(product)
                        ? 'border-emerald-500/25 bg-emerald-500/5 cursor-default'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-black/30">{iconFor(product)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black">{product.title}</span>
                          {isOwned(product) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                              ATTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{product.description}</p>
                      </div>
                      <span className="font-black text-emerald-400 whitespace-nowrap">
                        {product.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={restore}
                disabled={restoring}
                className="w-full py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm font-bold flex items-center justify-center gap-2"
              >
                {restoring
                  ? <Loader className="w-4 h-4 animate-spin" />
                  : <RotateCcw className="w-4 h-4" />}
                Ripristina acquisti
              </button>

              <p className="text-[11px] text-zinc-500 flex gap-2 items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Nessun dato carta viene raccolto dall&apos;app. In produzione paga Google Play.
              </p>

              {status && <p className="text-xs text-emerald-400">{status}</p>}
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
          )}

          {step === 'confirm' && selectedProduct && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setStep('browse')}
                className="text-sm text-blue-400 hover:underline"
              >
                ← Torna allo store
              </button>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-black/30">{iconFor(selectedProduct)}</div>
                <div className="flex-1">
                  <h3 className="font-black text-xl">{selectedProduct.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{selectedProduct.description}</p>
                </div>
                <span className="text-2xl font-black text-emerald-400">
                  {selectedProduct.price}
                </span>
              </div>

              <p className="text-xs text-zinc-400">
                {billingMode === 'production'
                  ? 'Conferma per aprire il flusso ufficiale Google Play. L’entitlement viene applicato solo dopo esito positivo.'
                  : 'Modalità test: il pagamento è simulato per verificare UI ed entitlement senza denaro reale.'}
              </p>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="button"
                onClick={buySelected}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                {billingMode === 'production' ? 'Acquista con Google Play' : 'Simula acquisto test'}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-14 text-center space-y-4">
              <Loader className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
              <h3 className="font-black">Elaborazione...</h3>
              <p className="text-sm text-zinc-500">{status}</p>
            </div>
          )}

          {step === 'success' && selectedProduct && (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black">Acquisto completato</h3>
                <p className="text-zinc-400 mt-2">
                  {selectedProduct.title} è attivo.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black"
              >
                Torna al gioco
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
