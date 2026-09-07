// ══════════════════════════════════════════════════════════════
//  The three one-off screens that aren't part of the branching
//  question list: intro (age gate only), contact (phone+name,
//  shown last, right before the reward), and finish.
// ══════════════════════════════════════════════════════════════
import type { ContactInfo } from './types';
import { INTRO_COPY, CONTACT_COPY, FINISH_COPY, UNDER_AGE_MESSAGE } from './data';

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function IntroScreen(onSubmit: (age: number) => void, prefillAge?: number | null): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sv-screen sv-intro';

  el.innerHTML = `
    <div class="sv-card">
      <img src="/event-title.webp" class="sv-hero-title" alt="Урамшууллын хүрд" />

      <div class="sv-intro-copy">
        <div class="sv-kicker">${esc(INTRO_COPY.kicker)}</div>
        <h1 class="sv-intro-title">${INTRO_COPY.title}</h1>
      </div>

      <img src="/owl-pointing.webp" class="sv-hero-owl" alt="" aria-hidden="true" />

      <form id="sv-intro-form" novalidate>
        <div class="sv-field">
          <label for="sv-age">${esc(INTRO_COPY.ageLabel)}</label>
          <input id="sv-age" class="sv-input" type="number" inputmode="numeric" min="1" max="100" step="1" placeholder="${esc(INTRO_COPY.agePlaceholder)}" value="${prefillAge ? esc(String(prefillAge)) : ''}" required autofocus />
        </div>
        <div class="sv-err" id="sv-intro-err"></div>
        <button type="submit" class="sv-btn sv-btn-primary sv-btn-block">${esc(INTRO_COPY.submitLabel)} →</button>
      </form>
      <div class="sv-mini-note">${esc(INTRO_COPY.miniNote)}</div>
    </div>
  `;

  const form  = el.querySelector<HTMLFormElement>('#sv-intro-form')!;
  const ageEl = el.querySelector<HTMLInputElement>('#sv-age')!;
  const errEl = el.querySelector<HTMLDivElement>('#sv-intro-err')!;

  ageEl.addEventListener('input', () => {
    ageEl.value = ageEl.value.replace(/\D/g, '').slice(0, 3);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.textContent = '';

    const age = parseInt(ageEl.value, 10);
    if (!age || age < 1 || age > 100) { errEl.textContent = 'Насаа зөв оруулна уу.'; return; }
    if (age < 18) { errEl.textContent = UNDER_AGE_MESSAGE; return; }

    onSubmit(age);
  });

  return el;
}

export function ContactScreen(
  stepIndex: number,
  stepTotal: number,
  onSubmit: (contact: ContactInfo) => void,
  onBack: () => void
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sv-screen';

  const pct = stepTotal > 0 ? Math.round(((stepIndex + 1) / stepTotal) * 100) : 100;

  el.innerHTML = `
    <div class="sv-progress"><div class="sv-progress-bar" style="width:${pct}%"></div></div>
    <div class="sv-card">
      <img src="/owl-pointing.webp" class="sv-hero-owl sv-hero-owl-small" alt="" aria-hidden="true" />
      <div class="sv-kicker">${esc(CONTACT_COPY.kicker)}</div>
      <h2 class="sv-title">${esc(CONTACT_COPY.title)}</h2>
      <p class="sv-lead">${esc(CONTACT_COPY.lead)}</p>

      <form id="sv-contact-form" novalidate>
        <div class="sv-field">
          <label for="sv-phone">${esc(CONTACT_COPY.phoneLabel)}</label>
          <input id="sv-phone" class="sv-input" type="tel" inputmode="tel" maxlength="8" placeholder="Жишээ: 99112233" autocomplete="tel" required />
        </div>
        <div class="sv-field">
          <label for="sv-name">${esc(CONTACT_COPY.nameLabel)}</label>
          <input id="sv-name" class="sv-input" type="text" placeholder="Нэрээ оруулна уу" autocomplete="name" required />
        </div>
        <div class="sv-privacy">${esc(CONTACT_COPY.privacy)}</div>
        <div class="sv-err" id="sv-contact-err"></div>
        <div class="sv-controls">
          <button type="button" class="sv-btn sv-btn-secondary" id="sv-contact-back">← Буцах</button>
          <button type="submit" class="sv-btn sv-btn-primary">${esc(CONTACT_COPY.submitLabel)} →</button>
        </div>
      </form>
    </div>
  `;

  const form    = el.querySelector<HTMLFormElement>('#sv-contact-form')!;
  const phoneEl = el.querySelector<HTMLInputElement>('#sv-phone')!;
  const nameEl  = el.querySelector<HTMLInputElement>('#sv-name')!;
  const errEl   = el.querySelector<HTMLDivElement>('#sv-contact-err')!;
  const backBtn = el.querySelector<HTMLButtonElement>('#sv-contact-back')!;

  phoneEl.addEventListener('input', () => {
    phoneEl.value = phoneEl.value.replace(/\D/g, '').slice(0, 8);
  });

  backBtn.addEventListener('click', onBack);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.textContent = '';

    const phone = phoneEl.value.trim();
    const name = nameEl.value.trim();

    if (phone.length !== 8) { errEl.textContent = 'Утасны дугаар 8 оронтой байх ёстой.'; return; }
    if (!name) { errEl.textContent = 'Нэрээ оруулна уу.'; return; }

    onSubmit({ phone, name });
  });

  return el;
}

const SITE_URL = 'https://loyalty.woowpay.mn';

export function FinishScreen(opts?: { alreadyClaimed?: boolean; clientCode?: string | null; clientToken?: string | null }): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sv-screen sv-finish';
  // A phone that already claimed the reward on an earlier attempt
  // still gets the full "thank you" — just not a claim of a NEW
  // reward, since re-promising spins that won't actually be added
  // would be misleading. Its existing code/link still shows below,
  // since finding your way back to the wheel is still useful.
  const rewardLine = opts?.alreadyClaimed
    ? 'Та энэ судалгааны урамшууллыг өмнө нь аль хэдийн авсан байна. Дахин баярлалаа!'
    : FINISH_COPY.reward;

  const hasSpinLink = !!(opts?.clientCode && opts?.clientToken);
  const spinUrl = hasSpinLink
    ? `${SITE_URL}/?code=${encodeURIComponent(opts!.clientCode!)}&t=${encodeURIComponent(opts!.clientToken!)}`
    : null;

  el.innerHTML = `
    <div class="sv-card sv-finish-card">
      <div class="sv-finish-check">✓</div>
      <div class="sv-kicker">${esc(FINISH_COPY.kicker)}</div>
      <h2 class="sv-title">${esc(FINISH_COPY.title)}</h2>
      <p class="sv-lead">${esc(FINISH_COPY.lead)}</p>
      <div class="sv-reward">${esc(rewardLine)}</div>
      ${hasSpinLink ? `
        <div class="sv-code-box">
          <span class="sv-code-label">Таны код</span>
          <span class="sv-code-value">${esc(opts!.clientCode!)}</span>
        </div>
        <a class="sv-btn sv-btn-primary sv-btn-block" href="${spinUrl}">🎡 Хүрдээ эргүүлэх →</a>
        <p class="sv-code-note">Энэ холбоос 3 хоногийн дотор хүчинтэй. Дараа нь код-оороо шууд орж болно.</p>
      ` : ''}
    </div>
  `;
  return el;
}
