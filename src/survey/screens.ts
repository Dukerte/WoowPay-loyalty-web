// ══════════════════════════════════════════════════════════════
//  The two one-off screens that aren't part of the question list:
//  the intro (phone/name/age capture + 18+ gate) and the finish
//  screen. Kept separate from render.ts since neither is a
//  `Question` — they don't repeat and don't need the generic
//  single/multi/text/matrix/scale machinery.
// ══════════════════════════════════════════════════════════════
import type { SurveyProfile } from './types';
import { INTRO_COPY, FINISH_COPY, UNDER_AGE_MESSAGE } from './data';

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function IntroScreen(onSubmit: (profile: SurveyProfile) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sv-screen sv-intro';

  el.innerHTML = `
    <div class="sv-card">
      <div class="sv-kicker">${esc(INTRO_COPY.kicker)}</div>
      <h1 class="sv-intro-title">${INTRO_COPY.title}</h1>
      <p class="sv-lead">${esc(INTRO_COPY.lead)}</p>

      <form id="sv-intro-form" novalidate>
        <div class="sv-field">
          <label for="sv-phone">${esc(INTRO_COPY.phoneLabel)}</label>
          <input id="sv-phone" class="sv-input" type="tel" inputmode="tel" maxlength="8" placeholder="Жишээ: 99112233" autocomplete="tel" required />
        </div>
        <div class="sv-field">
          <label for="sv-name">${esc(INTRO_COPY.nameLabel)}</label>
          <input id="sv-name" class="sv-input" type="text" placeholder="Нэрээ оруулна уу" autocomplete="name" required />
        </div>
        <div class="sv-field">
          <label for="sv-age">${esc(INTRO_COPY.ageLabel)}</label>
          <input id="sv-age" class="sv-input" type="number" inputmode="numeric" min="1" max="100" step="1" placeholder="Насаа тоогоор оруулна уу" required />
          <small class="sv-field-note">${esc(INTRO_COPY.ageNote)}</small>
        </div>
        <div class="sv-privacy">${esc(INTRO_COPY.privacy)}</div>
        <div class="sv-err" id="sv-intro-err"></div>
        <button type="submit" class="sv-btn sv-btn-primary sv-btn-block">${esc(INTRO_COPY.submitLabel)} →</button>
      </form>
      <div class="sv-mini-note">${esc(INTRO_COPY.miniNote)}</div>
    </div>
  `;

  const form    = el.querySelector<HTMLFormElement>('#sv-intro-form')!;
  const phoneEl = el.querySelector<HTMLInputElement>('#sv-phone')!;
  const nameEl  = el.querySelector<HTMLInputElement>('#sv-name')!;
  const ageEl   = el.querySelector<HTMLInputElement>('#sv-age')!;
  const errEl   = el.querySelector<HTMLDivElement>('#sv-intro-err')!;

  phoneEl.addEventListener('input', () => {
    phoneEl.value = phoneEl.value.replace(/\D/g, '').slice(0, 8);
  });
  ageEl.addEventListener('input', () => {
    ageEl.value = ageEl.value.replace(/\D/g, '').slice(0, 3);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.textContent = '';

    const phone = phoneEl.value.trim();
    const name = nameEl.value.trim();
    const age = parseInt(ageEl.value, 10);

    if (phone.length !== 8) { errEl.textContent = 'Утасны дугаар 8 оронтой байх ёстой.'; return; }
    if (!name) { errEl.textContent = 'Нэрээ оруулна уу.'; return; }
    if (!age || age < 1 || age > 100) { errEl.textContent = 'Насаа зөв оруулна уу.'; return; }
    if (age < 18) { errEl.textContent = UNDER_AGE_MESSAGE; return; }

    onSubmit({ phone, name, age });
  });

  return el;
}

export function FinishScreen(opts?: { alreadyClaimed?: boolean }): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sv-screen sv-finish';
  // A phone that already claimed the reward on an earlier attempt
  // still gets the full "thank you" — just not the reward line
  // again, since re-promising spins that won't actually be added
  // would be misleading.
  const rewardLine = opts?.alreadyClaimed
    ? 'Та энэ судалгааны урамшууллыг өмнө нь аль хэдийн авсан байна. Дахин баярлалаа!'
    : FINISH_COPY.reward;
  el.innerHTML = `
    <div class="sv-card sv-finish-card">
      <div class="sv-finish-check">✓</div>
      <div class="sv-kicker">${esc(FINISH_COPY.kicker)}</div>
      <h2 class="sv-title">${esc(FINISH_COPY.title)}</h2>
      <p class="sv-lead">${esc(FINISH_COPY.lead)}</p>
      <div class="sv-reward">${esc(rewardLine)}</div>
    </div>
  `;
  return el;
}
