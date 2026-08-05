import type { UserType } from '../types';
import { PRIZES } from '../data/prizes';
import { SpinWheel } from './SpinWheel';
import { ResultModal } from './ResultModal';

export function SpinScreen(
  userType: UserType,
  code: string,
  totalSpins: number,
  phone: string,
  onDone: () => void
): HTMLElement {
  const prizes     = PRIZES[userType];
  const el         = document.createElement('div');
  el.className     = 'spin-screen';

  const isMerchant = userType === 'merchant';
  const typeLabel  = isMerchant ? 'Мерчант' : 'Харилцагч';
  const typeIcon   = isMerchant ? '🏪' : '👤';
  const avatarCls  = isMerchant ? 'merchant' : 'client';

  // Format phone for display: 9911 → 9911 XXXX (mask last 4)
  const displayPhone = phone.length >= 8
    ? phone.slice(0, 4) + ' ' + phone.slice(4)
    : phone;

  let spinsUsed = 0;
  let spinsLeft = totalSpins;

  // ── Header card ──────────────────────────────────────────
  const headerCard = document.createElement('div');
  headerCard.className = 'ss-header-card';

  function buildHeaderHTML(): string {
    const dots = Array.from({ length: totalSpins }, (_, i) => {
      let cls = 'ss-dot ';
      cls += i < spinsUsed ? 'used' : i === spinsUsed ? 'active' : 'pending';
      return `<div class="${cls}"></div>`;
    }).join('');

    return `
      <div class="ss-header-top">
        <img src="/logo-white.png" class="ss-logo" alt="WoowPay" />
        <div class="ss-spins-remaining">
          <span class="sr-label">Үлдсэн эргэлт</span>
          <div class="sr-dots">${dots}</div>
          <span class="sr-count">${spinsLeft}/${totalSpins}</span>
        </div>
      </div>
      <div class="ss-header-divider"></div>
      <div class="ss-header-bottom">
        <div class="ss-user-info">
          <div class="ss-user-avatar ${avatarCls}">${typeIcon}</div>
          <div>
            <div class="ss-user-name">${typeLabel} · ${displayPhone}</div>
            <div class="ss-user-type">${isMerchant ? 'Мерчантын данс' : 'Харилцагчийн данс'}</div>
          </div>
        </div>
        <span class="ss-code-pill">${code}</span>
      </div>
    `;
  }

  const renderHeader = () => { headerCard.innerHTML = buildHeaderHTML(); };
  renderHeader();

  // ── Wheel ────────────────────────────────────────────────
  const wheelWrap = document.createElement('div');
  wheelWrap.className = 'ss-wheel-wrap';

  const pointer = document.createElement('div');
  pointer.className = 'ss-pointer';

  const spinBtn = document.createElement('button');
  spinBtn.className = 'ss-spin-btn';
  spinBtn.textContent = 'Эргүүлэх!';

  const spinLabel = document.createElement('p');
  spinLabel.className = 'ss-spin-label';
  const updateLabel = () => {
    spinLabel.innerHTML = spinsLeft > 0
      ? `<span class="ss-spin-count">${spinsLeft}</span> эргэлт үлдсэн`
      : 'Эргэлт дууссан';
  };
  updateLabel();

  const modal = ResultModal();

  const { el: canvas, spin, isSpinning } = SpinWheel({
    prizes,
    onResult(prize) {
      spinsUsed++;
      spinsLeft--;
      renderHeader();
      updateLabel();
      if (spinsLeft <= 0) spinBtn.disabled = true;
      modal.show(prize, spinsLeft, () => {
        // Re-enable spin button and trigger next spin
        spinBtn.disabled = false;
        spin();
        setTimeout(() => { if (spinsLeft > 0) spinBtn.disabled = false; }, 5500);
      }, onDone);
    },
  });

  spinBtn.addEventListener('click', () => {
    if (isSpinning() || spinsLeft <= 0) return;
    spinBtn.disabled = true;
    spin();
    setTimeout(() => { if (spinsLeft > 0) spinBtn.disabled = false; }, 5500);
  });

  wheelWrap.appendChild(pointer);
  wheelWrap.appendChild(canvas);

  el.appendChild(headerCard);
  el.appendChild(wheelWrap);
  el.appendChild(spinBtn);
  el.appendChild(spinLabel);
  el.appendChild(modal.el);

  return el;
}
