import React, { useState } from 'react';
import { PurchaseItem, UserState } from '../types';
import { STORE_PRODUCTS } from '../data';
import { audio } from '../utils/audio';
import { 
  Crown, 
  ShieldAlert, 
  Gem, 
  Coins, 
  CreditCard, 
  Check, 
  X, 
  ShieldCheck, 
  Download, 
  Loader, 
  Sparkles 
} from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onPurchaseSuccess: (product: PurchaseItem) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ 
  isOpen, 
  onClose, 
  userState, 
  onPurchaseSuccess 
}) => {
  const [selectedProduct, setSelectedProduct] = useState<PurchaseItem | null>(null);
  const [paymentStep, setPaymentStep] = useState<'browse' | 'checkout' | 'processing' | 'success'>('browse');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

  if (!isOpen) return null;

  const handleProductSelect = (product: PurchaseItem) => {
    audio.playClick();
    setSelectedProduct(product);
    setPaymentStep('checkout');
    setPaymentError('');
    // Prefill with safe mock values to make it easy for user
    setCardNumber('4242424242424242');
    setExpiry('12/28');
    setCvv('123');
    setCardName('Rider Spaziale');
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playClick();

    if (cardNumber.replace(/\s/g, '').length < 13) {
      setPaymentError('Numero carta non valido.');
      return;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      setPaymentError('Scadenza non valida (usa MM/AA).');
      return;
    }
    if (cvv.length < 3) {
      setPaymentError('Codice CVV non valido.');
      return;
    }
    if (cardName.trim() === '') {
      setPaymentError('Inserisci il nome del titolare.');
      return;
    }

    setPaymentStep('processing');
    setPaymentError('');

    const statuses = [
      'Inizializzazione gateway di pagamento sicuro...',
      'Verifica dei dettagli della carta...',
      'Elaborazione della transazione offline sicura...',
      'Firma digitale della licenza Premium...'
    ];

    let currentStatusIdx = 0;
    setProcessingStatus(statuses[0]);

    const interval = setInterval(() => {
      currentStatusIdx++;
      if (currentStatusIdx < statuses.length) {
        setProcessingStatus(statuses[currentStatusIdx]);
      } else {
        clearInterval(interval);
        setPaymentStep('success');
        audio.playPremiumSuccess();
        if (selectedProduct) {
          onPurchaseSuccess(selectedProduct);
        }
      }
    }, 900);
  };

  const downloadInvoice = () => {
    audio.playClick();
    if (!selectedProduct) return;

    const invoiceContent = `
========================================
     NEON RETRO ARCADE - INVOICE
========================================
Transazione ID: TXN-${Math.floor(Math.random() * 900000 + 100000)}
Data: ${new Date().toLocaleDateString('it-IT')}
Metodo: Carta di Credito (MOCK *${cardNumber.slice(-4)})
----------------------------------------
Prodotto: ${selectedProduct.title}
Tipo: ${selectedProduct.type.toUpperCase()}
Prezzo: ${selectedProduct.price}
Tasse: €0.00 (Incluso)
----------------------------------------
TOTALE PAGATO: ${selectedProduct.price}
Stato: PAGAMENTO COMPLETATO CON SUCCESSO
----------------------------------------
Grazie per aver supportato gli sviluppatori!
Licenza digitale offline attiva.
========================================
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ricevuta-${selectedProduct.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown id="icon-crown" className="w-8 h-8 text-yellow-400 animate-pulse" />;
      case 'ShieldAlert':
        return <ShieldAlert id="icon-shield" className="w-8 h-8 text-blue-400" />;
      case 'Gem':
        return <Gem id="icon-gem" className="w-8 h-8 text-pink-400 animate-bounce" />;
      case 'Coins':
        return <Coins id="icon-coins" className="w-8 h-8 text-emerald-400" />;
      default:
        return <Coins id="icon-default" className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden border border-gray-800 rounded-2xl bg-zinc-950 text-white shadow-2xl shadow-blue-500/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-900 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Negozo Galattico & Premium</h2>
          </div>
          <button 
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {paymentStep === 'browse' && (
            <div className="space-y-6">
              {/* Guided Shop Info Banner */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/10 text-blue-300 text-xs leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <span className="font-extrabold uppercase tracking-widest text-[9px] text-blue-400 block mb-1">💡 INFO FLOTTA: ACQUISTI & PROGRESSIONE</span>
                <p className="mb-1">
                  <span className="font-bold text-white">Nel tempo potrai ottenere nuove navi giocando</span>, completando missioni galattiche, scalando il Pass Battaglia e raccogliendo frammenti di astronavi nello spazio profondo.
                </p>
                <p className="text-zinc-400">
                  Se desideri velocizzare la progressione, eliminare le inserzioni o sbloccare l'esclusivo stato VIP per raddoppiare le gemme, puoi esplorare i moduli commerciali qui sotto. Nessun popup fastidioso, acquisti offline 100% sicuri.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-950/10 text-yellow-400 text-sm flex gap-3 items-start">
                <Crown className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Upgrade VIP Consigliato:</span> L'abbonamento mensile sblocca l'esclusiva nave Gold, raddoppia i guadagni di gioco e rimuove completamente i banner pubblicitari fastidiosi!
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {STORE_PRODUCTS.map((prod) => {
                  const isOwned = (prod.id === 'sub_vip' && userState.isPremium) || 
                                  (prod.id === 'noncons_remove_ads' && userState.isAdFree);
                  
                  return (
                    <div 
                      key={prod.id}
                      className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border transition-all ${
                        isOwned 
                          ? 'border-emerald-500/30 bg-emerald-950/5' 
                          : 'border-zinc-800 hover:border-blue-500/50 bg-zinc-900/50 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700">
                          {getProductIcon(prod.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-white">{prod.title}</h3>
                            {isOwned && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Attivo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1 max-w-md">{prod.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto justify-between border-t border-zinc-900 md:border-0 pt-3 md:pt-0">
                        <span className="text-xl font-extrabold text-blue-400">{prod.price}</span>
                        {isOwned ? (
                          <button 
                            disabled
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 w-full md:w-auto"
                          >
                            Già Acquistato
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleProductSelect(prod)}
                            className="px-5 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all w-full md:w-auto"
                          >
                            Acquista
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {paymentStep === 'checkout' && selectedProduct && (
            <div className="space-y-6">
              <button 
                onClick={() => { audio.playClick(); setPaymentStep('browse'); }}
                className="text-sm text-blue-400 hover:underline flex items-center gap-1"
              >
                ← Torna al listino prodotti
              </button>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Prodotto Selezionato</span>
                  <h4 className="font-bold text-lg text-white">{selectedProduct.title}</h4>
                </div>
                <span className="text-2xl font-black text-emerald-400">{selectedProduct.price}</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 text-xs text-blue-300">
                  ⚡ <strong>Acquisto Simulato Sandbox (Offline):</strong> Questo gioco è impostato in modalità offline demo/sviluppo per la pubblicazione Android. Facendo clic sul pulsante sottostante simulerai la risposta positiva del Google Play Billing Service / RevenueCat per questo dispositivo, sbloccando i contenuti istantaneamente senza addebito monetario reale.
                </div>

                {paymentError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {paymentError}
                  </div>
                )}

                <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3 text-center">
                  <div className="text-sm text-gray-300">
                    ID Articolo Play Store: <span className="font-mono text-xs text-gray-400">{selectedProduct.id}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Nessun dato finanziario o personale verrà richiesto. Acquisto trasparente ed etico al 100%.
                  </div>
                </div>

                <button 
                  onClick={() => {
                    audio.playClick();
                    setPaymentStep('processing');
                    setPaymentError('');

                    const statuses = [
                      'Connessione al Google Play Billing Service...',
                      'Simulazione di autenticazione sandbox riuscita...',
                      'Sincronizzazione della licenza d\'acquisto offline...',
                      'Firma digitale della licenza Premium...'
                    ];

                    let currentStatusIdx = 0;
                    setProcessingStatus(statuses[0]);

                    const interval = setInterval(() => {
                      currentStatusIdx++;
                      if (currentStatusIdx < statuses.length) {
                        setProcessingStatus(statuses[currentStatusIdx]);
                      } else {
                        clearInterval(interval);
                        setPaymentStep('success');
                        audio.playPremiumSuccess();
                        if (selectedProduct) {
                          onPurchaseSuccess(selectedProduct);
                        }
                      }
                    }, 600);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                >
                  <ShieldCheck className="w-5 h-5" /> Simula Acquisto con Google Play
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-zinc-900 rounded-full border border-blue-500/30 animate-spin">
                <Loader className="w-10 h-10 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Elaborazione in corso...</h3>
                <p className="text-sm text-gray-400 font-mono animate-pulse">{processingStatus}</p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && selectedProduct && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500 text-emerald-400">
                <Check className="w-12 h-12" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Pagamento Riuscito!</h3>
                <p className="text-gray-400 max-w-md">
                  Hai sbloccato con successo <span className="text-emerald-400 font-bold">{selectedProduct.title}</span>. Tutti i vantaggi premium sono attivi immediatamente sul tuo account.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center gap-2 w-full max-w-sm">
                <span className="text-xs text-gray-500">Transazione Sicura Offline</span>
                <span className="text-sm font-mono text-gray-400">ID: TXN-{Math.floor(Math.random() * 900000 + 100000)}</span>
                <button 
                  onClick={downloadInvoice}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Download className="w-4 h-4" /> Scarica Ricevuta PDF/TXT
                </button>
              </div>

              <button 
                onClick={() => { audio.playClick(); setPaymentStep('browse'); onClose(); }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
              >
                Torna al Gioco
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
