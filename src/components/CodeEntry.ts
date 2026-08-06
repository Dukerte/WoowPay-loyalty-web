import { formatCodeInput, validateCode } from '../data/codeValidator';
import { validateCodeRemote, verifyPhoneRemote } from '../data/clientService';
import { logEvent } from '../data/analytics';
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
      <div class="ce-card-wrap">
        <!-- Sits BEHIND the card (z-index below it) by construction, so
             it can never collide with card content. The lid/cover (with
             the bow) rests above the card; the open box body sits below,
             fully visible, as if the card is the contents sitting inside
             it with the lid lifted off. -->
        <div class="ce-box-backdrop ce-box-backdrop-top" aria-hidden="true">
          <div class="ce-box-glow"></div>
          <img src="/gift-box-closed.webp" class="ce-box-img" alt="" />
        </div>
        <div class="ce-box-backdrop ce-box-backdrop-bottom" aria-hidden="true">
          <img src="/gift-box-open.webp" class="ce-box-img ce-box-img-bottom" alt="" />
        </div>
        <div class="ce-deco" aria-hidden="true">
          <div class="ce-deco-ring"></div>
          <div class="ce-deco-badge ce-deco-coin">₮</div>
          <span class="ce-sparkle s1">✦</span>
          <span class="ce-sparkle s2">✦</span>
          <span class="ce-sparkle s3">✦</span>
          <span class="ce-sparkle s4">✦</span>
        </div>
        <div class="ce-card">
        <div class="ce-card-bar"></div>
        <div class="ce-card-body">
          <div class="ce-owl-col">
            <div class="ce-owl-bubble">
              <span class="ce-owl-bubble-badge">🎁</span>
              <p>Та өөрийн эрхийн кодоо ашиглан хүрдээ эргүүлээд онцгой урамшууллуудын эзэн болоорой.</p>
              <p class="ce-owl-bubble-cta">Танд амжилт хүсье!</p>
              <span class="ce-owl-bubble-tail"></span>
            </div>
            <img src="/owl-pointing.webp" class="ce-owl ce-owl-flip" width="230" height="180" alt="" aria-hidden="true" />
          </div>
          <div class="ce-form ce-step">
            <p class="ce-eyebrow">WOOW PAY · УРАМШУУЛАЛ</p>
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
      </div>
    `;

    const input = el.querySelector<HTMLInputElement>('#code-input')!;
    const btn   = el.querySelector<HTMLButtonElement>('#code-btn')!;
    const errEl = el.querySelector<HTMLElement>('#code-error')!;

    const showErr  = (m: string) => { errEl.textContent = m; input.classList.add('invalid'); btn.disabled = false; btn.textContent = 'Шалгах →'; };
    const clearErr = () => { errEl.textContent = ''; input.classList.remove('invalid'); };

    input.addEventListener('input', () => { input.value = formatCodeInput(input.value); clearErr(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });

    btn.addEventListener('click', async () => {
      clearErr();
      // Quick local format check first
      const localCheck = validateCode(input.value);
      if (!localCheck.valid) { showErr(localCheck.error!); return; }

      btn.disabled = true;
      btn.textContent = 'Шалгаж байна...';

      try {
        const result = await validateCodeRemote(input.value);
        if (!result.valid) { showErr(result.error!); return; }
        logEvent('code_valid', input.value.trim().toUpperCase(), result.userType);
        renderStep2(
          input.value.trim().toUpperCase(),
          result.userType!,
          result.spins!,
        );
      } catch {
        // Network error → fall back to local validation
        logEvent('code_valid', input.value.trim().toUpperCase(), localCheck.userType);
        renderStep2(
          input.value.trim().toUpperCase(),
          localCheck.userType!,
          localCheck.spins!,
        );
      }
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
          <img src="/owl-pointing.webp" class="ce-owl" width="230" height="180" alt="" aria-hidden="true" />
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

    const showErr  = (m: string) => { phoneErr.textContent = m; phoneInput.classList.add('invalid'); phoneBtn.disabled = false; phoneBtn.textContent = 'Баталгаажуулах →'; };
    const clearErr = () => { phoneErr.textContent = ''; phoneInput.classList.remove('invalid'); };

    phoneInput.addEventListener('input', () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 8);
      clearErr();
    });
    phoneInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') phoneBtn.click(); });
    el.querySelector<HTMLButtonElement>('#back-btn')!.addEventListener('click', renderStep1);

    phoneBtn.addEventListener('click', async () => {
      clearErr();
      const phone = phoneInput.value.trim();
      if (!phone) { showErr('Утасны дугаараа оруулна уу'); return; }
      if (phone.length < 8) { showErr('Утасны дугаар 8 оронтой байх ёстой'); return; }

      phoneBtn.disabled = true;
      phoneBtn.textContent = 'Шалгаж байна...';

      try {
        const ok = await verifyPhoneRemote(code, phone);
        if (!ok) {
          showErr('Утасны дугаар таарахгүй байна. Бүртгэлтэй дугаараа оруулна уу');
          return;
        }
        logEvent('phone_verified', code, userType);
        onValid(userType, spins, code, phone);
      } catch {
        // Network error → skip phone check
        logEvent('phone_verified', code, userType);
        onValid(userType, spins, code, phone);
      }
    });
    phoneInput.focus();
  }

  renderStep1();
  return el;
}
