import type { Prize } from '../types';

// Curated emoji per prize category, distinct from the (sometimes-reused)
// wheel emoji in Supabase — so the list reads with real variety instead
// of three ⭐ and two 🎁 in a row. Falls back to the prize's own emoji
// for anything unrecognized (custom/admin-added prizes still work).
function displayEmoji(p: Prize): string {
  const l = p.label;
  if (/бэлэн мөнгөний зээлийн эрх/i.test(l)) return '💳';
  if (/бэлэн мөнгө/i.test(l))                return '💰';
  if (/бонус оноо/i.test(l))                 return '⭐';
  if (/худалдан авалтын зээлийн эрх/i.test(l)) return '🛍️';
  if (/хүрд эргүүлэх/i.test(l))              return '🎡';
  if (/сугалаа/i.test(l))                    return '🎟️';
  if (/ваучер/i.test(l))                     return '🎁';
  return p.emoji;
}

// The "try again" filler entry isn't a real prize — never shown in the list.
function isRealPrize(p: Prize): boolean {
  return !/оролдоно уу/i.test(p.label);
}

export function PrizeListModal(prizes: Prize[]): {
  el: HTMLElement;
  show: () => void;
  hide: () => void;
} {
  const real = prizes.filter(isRealPrize);

  const el = document.createElement('div');
  el.className = 'pl-modal hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Идэвхтэй шагналууд');

  const rows = real.map((p) => `
    <li class="pl-row">
      <span class="pl-row-emoji">${displayEmoji(p)}</span>
      <span class="pl-row-label">${p.label}</span>
    </li>
  `).join('');

  el.innerHTML = `
    <div class="pl-backdrop"></div>
    <div class="pl-card">
      <button class="pl-close" id="pl-close" aria-label="Хаах">✕</button>
      <div class="pl-head">
        <span class="pl-head-emoji">🎁</span>
        <h2 class="pl-title">Идэвхтэй шагналууд</h2>
        <p class="pl-subtitle">Хүрд дээр одоогоор байгаа шагналууд</p>
      </div>
      <ul class="pl-list">${rows}</ul>
      <button class="pl-btn-done" id="pl-done">Ойлголоо</button>
    </div>
  `;

  const backdrop = el.querySelector<HTMLElement>('.pl-backdrop')!;
  const closeBtn = el.querySelector<HTMLButtonElement>('#pl-close')!;
  const doneBtn  = el.querySelector<HTMLButtonElement>('#pl-done')!;

  let lastFocused: HTMLElement | null = null;

  function show() {
    lastFocused = document.activeElement as HTMLElement;
    el.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('visible');
      closeBtn.focus();
    }));
    document.addEventListener('keydown', handleKeydown);
  }

  function hide() {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('hidden'), 320);
    lastFocused?.focus();
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') hide();
  }

  closeBtn.addEventListener('click', hide);
  doneBtn.addEventListener('click', hide);
  backdrop.addEventListener('click', hide);

  return { el, show, hide };
}
