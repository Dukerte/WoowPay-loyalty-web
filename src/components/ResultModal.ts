import type { Prize } from '../types';
import { logEvent } from '../data/analytics';

const CONF_COLORS = ['#29BDE0','#FF6B35','#a855f7','#f59e0b','#ec4899','#22c55e','#38bdf8','#fb923c'];

function buildConfetti(): string {
  return Array.from({ length: 20 }, (_, i) => {
    const color = CONF_COLORS[i % CONF_COLORS.length];
    const size  = 5 + Math.random() * 6;
    const left  = 2 + (i / 20) * 96;
    const delay = (Math.random() * 0.6).toFixed(2);
    const w     = Math.random() > .5 ? size : size * 0.5;
    const h     = Math.random() > .5 ? size : size * 1.8;
    const br    = Math.random() > .6 ? '50%' : '2px';
    return `<span style="left:${left}%;background:${color};width:${w}px;height:${h}px;border-radius:${br};animation-delay:${delay}s"></span>`;
  }).join('');
}


function shareToFacebook(prize: Prize) {
  // Share a small server-rendered page whose Open Graph tags show the
  // actual prize (with its card image) instead of the generic
  // homepage cover — Facebook's crawler doesn't run JS, so this has
  // to be a real HTML response, not something rendered client-side.
  const params = new URLSearchParams({ label: prize.label });
  if (prize.id) params.set('prize', prize.id);
  const shareUrl = `https://loyalty.woowpay.mn/api/share?${params}`;
  const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  window.open(fbLink, '_blank', 'width=580,height=480,noopener,noreferrer');
}

// ── Component ────────────────────────────────────────────
export function ResultModal(): {
  el: HTMLElement;
  show: (prize: Prize, spinsLeft: number, code: string, onNext: () => void, onDone: () => void) => void;
  hide: () => void;
} {
  const el = document.createElement('div');
  el.className = 'result-modal hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');

  el.innerHTML = `
    <div class="rm-backdrop"></div>
    <div class="rm-card">

      <button class="rm-close" id="rm-close" aria-label="Хаах">✕</button>

      <div class="rm-header" id="rm-header">
        <div class="rm-confetti" id="rm-confetti"></div>
        <div class="rm-owl-ring">
          <img src="/owl-thumbsup.webp" width="90" height="70" alt="Woow owl" />
        </div>
      </div>

      <div class="rm-body">
        <span class="rm-emoji"  id="rm-emoji"></span>
        <h2  class="rm-prize-label" id="rm-label"></h2>
        <p   class="rm-prize-desc"  id="rm-desc"></p>
        <span class="rm-spins-pill" id="rm-spins" style="display:none"></span>

        <!-- Screenshot-friendly receipt: proof of what was won and when,
             so the client has something to show the merchant. -->
        <div class="rm-receipt" id="rm-receipt">
          <span id="rm-receipt-code"></span>
          <span class="rm-receipt-dot">•</span>
          <span id="rm-receipt-date"></span>
        </div>

        <!-- Facebook share button -->
        <button class="rm-btn-share" id="rm-share">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Facebook-т хуваалцах
        </button>

        <div class="rm-divider"></div>
        <div class="rm-actions">
          <button class="rm-btn-spin" id="rm-next" style="display:none">Дахин эргүүлэх 🎰</button>
          <button class="rm-btn-done" id="rm-done">Дуусгах</button>
        </div>
      </div>

    </div>
  `;

  const backdrop  = el.querySelector<HTMLElement>('.rm-backdrop')!;
  const closeBtn  = el.querySelector<HTMLButtonElement>('#rm-close')!;
  const header    = el.querySelector<HTMLElement>('#rm-header')!;
  const confetti = el.querySelector<HTMLElement>('#rm-confetti')!;
  const emojiEl  = el.querySelector<HTMLElement>('#rm-emoji')!;
  const labelEl  = el.querySelector<HTMLElement>('#rm-label')!;
  const descEl   = el.querySelector<HTMLElement>('#rm-desc')!;
  const spinsEl  = el.querySelector<HTMLElement>('#rm-spins')!;
  const receiptCodeEl = el.querySelector<HTMLElement>('#rm-receipt-code')!;
  const receiptDateEl = el.querySelector<HTMLElement>('#rm-receipt-date')!;
  const shareBtn = el.querySelector<HTMLButtonElement>('#rm-share')!;
  const nextBtn  = el.querySelector<HTMLButtonElement>('#rm-next')!;
  const doneBtn  = el.querySelector<HTMLButtonElement>('#rm-done')!;

  let currentCode = '';
  let currentPrize: Prize | null = null;
  shareBtn.addEventListener('click', () => {
    logEvent('share_clicked', currentCode);
    if (currentPrize) shareToFacebook(currentPrize);
  });

  // X button always just closes (same as "Дуусгах" — won't spin again)
  closeBtn.addEventListener('click', () => hide());

  function refreshConfetti() {
    confetti.innerHTML = '';
    void confetti.offsetWidth;
    confetti.innerHTML = buildConfetti();
  }

  let lastFocused: HTMLElement | null = null;

  function show(prize: Prize, spinsLeft: number, code: string, onNext: () => void, onDone: () => void) {
    header.style.background = `linear-gradient(135deg, ${prize.color}cc 0%, ${prize.color}88 100%)`;
    emojiEl.textContent = prize.emoji;
    labelEl.textContent = prize.label;
    descEl.textContent  = prize.desc;
    shareBtn.disabled = false;
    refreshConfetti();

    currentCode = code;
    currentPrize = prize;
    receiptCodeEl.textContent = code;
    receiptDateEl.textContent = new Date().toLocaleString('mn-MN', {
      day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    spinsEl.style.display = spinsLeft > 0 ? '' : 'none';
    if (spinsLeft > 0) spinsEl.textContent = `Танд ${spinsLeft} эргэлт үлдсэн байна`;
    nextBtn.style.display = spinsLeft > 0 ? '' : 'none';

    const cleanup = () => {
      nextBtn.removeEventListener('click', handleNext);
      doneBtn.removeEventListener('click', handleDone);
      backdrop.removeEventListener('click', handleDone);
      document.removeEventListener('keydown', handleKeydown);
    };
    const handleNext = () => { hide(); cleanup(); onNext(); };
    const handleDone = () => { hide(); cleanup(); onDone(); };
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDone();
    };

    nextBtn.addEventListener('click', handleNext);
    doneBtn.addEventListener('click', handleDone);
    backdrop.addEventListener('click', handleDone);
    document.addEventListener('keydown', handleKeydown);

    // Move focus into the modal so keyboard/screen-reader users don't
    // lose their place, and remember what to return focus to on close.
    lastFocused = document.activeElement as HTMLElement;
    el.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('visible');
      closeBtn.focus();
    }));
  }

  function hide() {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('hidden'), 380);
    lastFocused?.focus();
  }

  return { el, show, hide };
}
