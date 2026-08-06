import type { Prize } from '../types';
import { logEvent } from '../data/analytics';

function shareToFacebook(prize: Prize | undefined) {
  const params = new URLSearchParams();
  if (prize) {
    params.set('label', prize.label);
    if (prize.id) params.set('prize', prize.id);
  }
  const shareUrl = `https://loyalty.woowpay.mn/api/share?${params}`;
  const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  window.open(fbLink, '_blank', 'width=580,height=480,noopener,noreferrer');
}

/**
 * Closing screen shown once a client's spins are used up — replaces
 * the old behavior of just disabling the wheel and leaving the user
 * stranded. Summarizes what they won this visit and gives them a
 * clear next action instead of a dead end.
 */
export function EndScreen(won: Prize[], code: string, onRestart: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'end-screen';

  const items = won.length
    ? won.map((p) => `<li><span class="es-emoji">${p.emoji}</span>${p.label}</li>`).join('')
    : `<li class="es-none">Энэ удаад шагнал бүртгэгдээгүй</li>`;

  el.innerHTML = `
    <img src="/owl-thumbsup.webp" width="120" height="94" class="es-owl" alt="" aria-hidden="true" />
    <p class="ce-eyebrow">WOOW PAY · УРАМШУУЛАЛ</p>
    <h1 class="ce-title">Баярлалаа!</h1>
    <p class="ce-context">Таны эргэлт дууслаа. Энэ удаад хожсон зүйлс:</p>
    <ul class="es-list">${items}</ul>
    <button class="rm-btn-share" id="es-share">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      Facebook-т хуваалцах
    </button>
    <button class="es-restart" id="es-restart">Шинэ код оруулах</button>
  `;

  el.querySelector<HTMLButtonElement>('#es-share')!.addEventListener('click', () => {
    logEvent('share_clicked', code);
    shareToFacebook(won[0]);
  });
  el.querySelector<HTMLButtonElement>('#es-restart')!.addEventListener('click', onRestart);

  return el;
}
