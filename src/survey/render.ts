// ══════════════════════════════════════════════════════════════
//  Renders a single Question into an HTMLElement. One function per
//  question type, all following the same DOM-template style as the
//  rest of the app's components (see src/components/*.ts) — no
//  framework, plain template strings + querySelector wiring.
// ══════════════════════════════════════════════════════════════
import type { AnswerValue, MatrixAnswer, MatrixCell, Question } from './types';

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

interface QuestionScreenOpts {
  question: Question;
  currentAnswer: AnswerValue;
  stepIndex: number;   // 0-based
  stepTotal: number;
  onNext: (value: AnswerValue) => void;
  onBack: (() => void) | null; // null → first question, hides the back button
}

export function QuestionScreen(opts: QuestionScreenOpts): HTMLElement {
  const { question: q, currentAnswer, stepIndex, stepTotal, onNext, onBack } = opts;
  const el = document.createElement('div');
  el.className = 'sv-screen';

  const pct = stepTotal > 0 ? Math.round(((stepIndex + 1) / stepTotal) * 100) : 0;

  el.innerHTML = `
    <div class="sv-progress"><div class="sv-progress-bar" style="width:${pct}%"></div></div>
    <div class="sv-card">
      <div class="sv-kicker">${esc(q.kicker)}</div>
      <h2 class="sv-title">${esc(q.title)}</h2>
      ${q.lead ? `<p class="sv-lead">${esc(q.lead)}</p>` : ''}
      ${q.hint ? `<div class="sv-hint">${esc(q.hint)}</div>` : ''}
      <div class="sv-body" id="sv-body"></div>
      <div class="sv-err" id="sv-err"></div>
      <div class="sv-controls">
        <button class="sv-btn sv-btn-secondary" id="sv-back" ${onBack ? '' : 'style="visibility:hidden"'}>← Буцах</button>
        <button class="sv-btn sv-btn-primary" id="sv-next">Үргэлжлүүлэх →</button>
      </div>
    </div>
  `;

  const body = el.querySelector<HTMLDivElement>('#sv-body')!;
  const errEl = el.querySelector<HTMLDivElement>('#sv-err')!;
  const nextBtn = el.querySelector<HTMLButtonElement>('#sv-next')!;
  const backBtn = el.querySelector<HTMLButtonElement>('#sv-back')!;

  let readValue: () => AnswerValue;
  let validate: () => string | null; // returns an error message, or null when valid

  switch (q.type) {
    case 'single': {
      body.innerHTML = `<div class="sv-options">${q.options.map(opt => `
        <label class="sv-opt">
          <input type="radio" name="sv-single" value="${esc(opt)}" ${currentAnswer === opt ? 'checked' : ''} />
          <span>${esc(opt)}</span>
        </label>`).join('')}</div>`;
      readValue = () => {
        const checked = body.querySelector<HTMLInputElement>('input[name="sv-single"]:checked');
        return checked?.value;
      };
      validate = () => (readValue() ? null : (q.errorMsg || 'Нэг хариулт сонгоно уу.'));
      break;
    }

    case 'multi': {
      const max = q.max;
      const selected = new Set<string>(Array.isArray(currentAnswer) ? currentAnswer : []);
      body.innerHTML = `
        ${max ? `<div class="sv-hint sv-hint-max">Хамгийн ихдээ ${max} сонголт.</div>` : ''}
        <div class="sv-options">${q.options.map(opt => `
        <label class="sv-opt">
          <input type="checkbox" value="${esc(opt)}" ${selected.has(opt) ? 'checked' : ''} />
          <span>${esc(opt)}</span>
        </label>`).join('')}</div>`;

      const boxes = Array.from(body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
      function enforceMax() {
        if (!max) return;
        const checkedCount = boxes.filter(b => b.checked).length;
        boxes.forEach(b => { if (!b.checked) b.disabled = checkedCount >= max; });
      }
      boxes.forEach(b => b.addEventListener('change', enforceMax));
      enforceMax();

      readValue = () => boxes.filter(b => b.checked).map(b => b.value);
      validate = () => {
        const vals = readValue() as string[];
        if (q.required && vals.length === 0) return q.errorMsg || 'Дор хаяж нэг хариулт сонгоно уу.';
        return null;
      };
      break;
    }

    case 'text': {
      const val = typeof currentAnswer === 'string' ? currentAnswer : '';
      body.innerHTML = `<textarea class="sv-textarea" placeholder="${esc(q.placeholder || '')}">${esc(val)}</textarea>`;
      const ta = body.querySelector<HTMLTextAreaElement>('textarea')!;
      readValue = () => ta.value.trim();
      validate = () => {
        if (q.required && !ta.value.trim()) return 'Энэ талбарыг бөглөнө үү.';
        return null;
      };
      break;
    }

    case 'matrix': {
      const existing = (currentAnswer as MatrixAnswer | undefined) ?? { rows: {} };
      const rowsHtml = q.rows.map(brand => {
        const cell: MatrixCell = existing.rows[brand] ?? { know: false, used: false, current: false };
        return `
        <tr data-brand="${esc(brand)}">
          <td class="sv-matrix-brand">${esc(brand)}</td>
          <td><input type="checkbox" data-col="know" ${cell.know ? 'checked' : ''} /></td>
          <td><input type="checkbox" data-col="used" ${cell.used ? 'checked' : ''} /></td>
          <td><input type="checkbox" data-col="current" ${cell.current ? 'checked' : ''} /></td>
        </tr>`;
      }).join('');

      const otherCell: MatrixCell = existing.rows['__other__'] ?? { know: false, used: false, current: false };
      const otherRow = q.allowOther ? `
        <tr data-brand="__other__">
          <td class="sv-matrix-brand"><input type="text" class="sv-matrix-other" placeholder="Бусад" value="${esc(existing.otherLabel || '')}" /></td>
          <td><input type="checkbox" data-col="know" ${otherCell.know ? 'checked' : ''} /></td>
          <td><input type="checkbox" data-col="used" ${otherCell.used ? 'checked' : ''} /></td>
          <td><input type="checkbox" data-col="current" ${otherCell.current ? 'checked' : ''} /></td>
        </tr>` : '';

      body.innerHTML = `
        <div class="sv-matrix-wrap">
        <table class="sv-matrix">
          <thead><tr><th>Брэнд</th>${q.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}${otherRow}</tbody>
        </table>
        </div>`;

      readValue = () => {
        const rows: Record<string, MatrixCell> = {};
        body.querySelectorAll<HTMLTableRowElement>('tr[data-brand]').forEach(tr => {
          const brand = tr.dataset.brand!;
          const know = tr.querySelector<HTMLInputElement>('input[data-col="know"]')!.checked;
          const used = tr.querySelector<HTMLInputElement>('input[data-col="used"]')!.checked;
          const current = tr.querySelector<HTMLInputElement>('input[data-col="current"]')!.checked;
          if (know || used || current) rows[brand] = { know, used, current };
        });
        const otherLabel = body.querySelector<HTMLInputElement>('.sv-matrix-other')?.value.trim() || undefined;
        const result: MatrixAnswer = { rows, otherLabel };
        return result;
      };
      validate = () => null; // optional — matches the original (no required attr on q7)
      break;
    }

    case 'scale': {
      const val = typeof currentAnswer === 'number' ? currentAnswer : null;
      const nums: number[] = [];
      for (let n = q.min; n <= q.max; n++) nums.push(n);
      body.innerHTML = `
        <div class="sv-scale">
          ${nums.map(n => `<button type="button" class="sv-scale-btn ${val === n ? 'active' : ''}" data-val="${n}">${n}</button>`).join('')}
        </div>
        <div class="sv-scale-labels"><span>${esc(q.minLabel)}</span><span>${esc(q.maxLabel)}</span></div>`;

      const btns = Array.from(body.querySelectorAll<HTMLButtonElement>('.sv-scale-btn'));
      let picked: number | null = val;
      btns.forEach(b => b.addEventListener('click', () => {
        picked = Number(b.dataset.val);
        btns.forEach(x => x.classList.toggle('active', x === b));
      }));

      readValue = () => picked ?? undefined;
      validate = () => (picked === null ? 'Хариулт сонгоно уу.' : null);
      break;
    }
  }

  function showError(msg: string) {
    errEl.textContent = msg;
    errEl.classList.add('show');
  }
  function clearError() {
    errEl.textContent = '';
    errEl.classList.remove('show');
  }

  nextBtn.addEventListener('click', () => {
    const err = validate();
    if (err) { showError(err); return; }
    clearError();
    onNext(readValue());
  });

  if (onBack) backBtn.addEventListener('click', onBack);

  return el;
}
