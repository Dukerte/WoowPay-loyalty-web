import { formatCodeInput, validateCode } from '../data/codeValidator';
import { verifyPhone } from '../data/records';
import type { UserType } from '../types';

export function CodeEntry(
  onValid: (userType: UserType, spins: number, code: string, phone: string) => void
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'code-entry';

  // ── Step 1: Code ─────────────────────────────────────────
  function renderStep1() {
    el.innerHTML = `
      <img src="/logo-white.png" class="ce-logo" alt="WoowPay" />
      <div class="ce-card">
        <div class="ce-card-bar"></div>
        <div class="ce-card-body">
          <img src="/owl-pointing.png" class="ce-owl" alt="" aria-hidden="true" />
          <div class="ce-form ce-step">
            <p class="ce-eyebrow">Loyalty Reward</p>
            <h1 class="ce-title">Азаа туршаарай!</h1>
            <p class="ce-sub">Эрхийн кодоо оруулаад<br/>хүрдийг эргүүлнэ үү 🎰</p>

            <div class="ce-input-wrap">
              <input id="code-input" type="text" maxlength="9"
                placeholder="WM-AB0013" autocomplete="off"
                spellcheck="false" inputmode="text" />
            </div>
            <p id="code-error" class="ce-error" role="alert" aria-live="polite"></p>
            <button id="code-btn" class="ce-btn">Шалгах →</button>

            <div class="ce-hints">
              <div class="ce-hint-chip">
                <span class="label">Мерчант</span>
                <span class="code">WM-XXXXXX</span>
              </div>
              <div class="ce-hint-chip">
                <span class="label">Харилцагч</span>
                <span class="code">WC-XXXXXX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const input = el.querySelector<HTMLInputElement>('#code-input')!;
    const btn   = el.querySelector<HTMLButtonElement>('#code-btn')!;
    const errEl = el.querySelector<HTMLElement>('#code-error')!;

    const showErr  = (m: string) => { errEl.textContent = m; input.classList.add('invalid'); };
    const clearErr = () => { errEl.textContent = ''; input.classList.remove('invalid'); };

    input.addEventListener('input', () => { input.value = formatCodeInput(input.value); clearErr(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    btn.addEventListener('click', () => {
      clearErr();
      const r = validateCode(input.value);
      if (!r.valid) { showErr(r.error!); return; }
      renderStep2(input.value.trim().toUpperCase(), r.userType!, r.spins!);
    });
    input.focus();
  }

  // ── Step 2: Phone verification ────────────────────────────
  function renderStep2(code: string, userType: UserType, spins: number) {
    el.innerHTML = `
      <img src="/logo-white.png" class="ce-logo" alt="WoowPay" />
      <div class="ce-card">
        <div class="ce-card-bar"></div>
        <div class="ce-card-body">
          <img src="/owl-pointing.png" class="ce-owl" alt="" aria-hidden="true" />
          <div class="ce-form ce-step">
            <button id="back-btn" class="ce-back-btn">Буцах</button>
            <div class="ce-code-preview"><span>Код:</span> ${code}</div>

            <p class="ce-eyebrow">Баталгаажуулалт</p>
            <h1 class="ce-title">Утасны дугаар</h1>
            <p class="ce-sub">Бүртгэлтэй утасны дугаараа<br/>оруулна уу</p>

            <span class="ce-phone-label">Утасны дугаар</span>
            <div class="ce-input-wrap">
              <input id="phone-input" type="tel" maxlength="8"
                placeholder="99XXXXXX" autocomplete="tel" inputmode="numeric" />
            </div>
            <p id="phone-error" class="ce-error" role="alert" aria-live="polite"></p>
            <button id="phone-btn" class="ce-btn">Баталгаажуулах →</button>
          </div>
        </div>
      </div>
    `;

    const phoneInput = el.querySelector<HTMLInputElement>('#phone-input')!;
    const phoneBtn   = el.querySelector<HTMLButtonElement>('#phone-btn')!;
    const phoneErr   = el.querySelector<HTMLElement>('#phone-error')!;

    const showErr  = (m: string) => { phoneErr.textContent = m; phoneInput.classList.add('invalid'); };
    const clearErr = () => { phoneErr.textContent = ''; phoneInput.classList.remove('invalid'); };

    phoneInput.addEventListener('input', () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 8);
      clearErr();
    });
    phoneInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') phoneBtn.click(); });
    el.querySelector<HTMLButtonElement>('#back-btn')!.addEventListener('click', renderStep1);

    phoneBtn.addEventListener('click', () => {
      clearErr();
      const phone = phoneInput.value.trim();
      if (!phone) { showErr('Утасны дугаараа оруулна уу'); return; }
      if (phone.length < 8) { showErr('Утасны дугаар 8 оронтой байх ёстой'); return; }
      if (!verifyPhone(code, phone)) {
        showErr('Утасны дугаар таарахгүй байна. Бүртгэлтэй дугаараа оруулна уу');
        return;
      }
      onValid(userType, spins, code, phone);
    });
    phoneInput.focus();
  }

  renderStep1();
  return el;
}
