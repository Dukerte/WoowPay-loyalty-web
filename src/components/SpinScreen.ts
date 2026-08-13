import type { Prize, UserType } from '../types';
import { SpinWheel } from './SpinWheel';
import { ResultModal } from './ResultModal';
import { recordSpin } from '../data/clientService';

export function SpinScreen(
  userType: UserType,
  code: string,
  totalSpins: number,
  phone: string,
  prizes: Prize[],
  onDone: () => void,
  onFinished: (won: Prize[], code: string) => void
): HTMLElement {
  const wonThisSession: Prize[] = [];
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
  // Mutable copy: "Хүрд эргүүлэх +N эрх" prizes grant bonus spins mid-session,
  // so the dot count / denominator needs to grow along with spinsLeft
  // instead of staying pinned to the code's original allotment.
  let spinsTotalLive = totalSpins;

  // ── Header card ──────────────────────────────────────────
  const headerCard = document.createElement('div');
  headerCard.className = 'ss-header-card';

  function buildHeaderHTML(): string {
    const dots = Array.from({ length: spinsTotalLive }, (_, i) => {
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
          <span class="sr-count">${spinsLeft}/${spinsTotalLive}</span>
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
      wonThisSession.push(prize);
      recordSpin(code, prize.label); // fire-and-forget Supabase update + prize log

      // "Хүрд эргүүлэх +N эрх" prizes grant bonus spins — mirror what
      // record_spin() now credits server-side so the on-screen count
      // (and dot total) grows immediately instead of lagging until the
      // code is re-entered.
      const bonusMatch = /эргүүлэх\s*\+(\d+)\s*эрх/i.exec(prize.label);
      if (bonusMatch) {
        const bonus = parseInt(bonusMatch[1], 10);
        spinsLeft += bonus;
        spinsTotalLive += bonus;
      }

      renderHeader();
      updateLabel();
      if (spinsLeft <= 0) spinBtn.disabled = true;
      const spinsLeftAtWin = spinsLeft;
      modal.show(prize, spinsLeft, code, () => {
        // Re-enable spin button and trigger next spin
        spinBtn.disabled = false;
        spin();
        setTimeout(() => { if (spinsLeft > 0) spinBtn.disabled = false; }, 5500);
      }, () => {
        // Closed out — if this was their last spin, show the closing
        // summary screen instead of dropping straight back to code entry.
        if (spinsLeftAtWin <= 0) onFinished(wonThisSession, code);
        else onDone();
      });
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
