import './styles/main.css';
import type { Prize, UserType } from './types';
import { CodeEntry } from './components/CodeEntry';
import { SpinScreen } from './components/SpinScreen';
import { EndScreen } from './components/EndScreen';
import { fetchPrizes } from './data/prizeService';

const app = document.getElementById('app')!;

function showCodeEntry() {
  app.innerHTML = '';
  app.appendChild(CodeEntry((userType: UserType, spins: number, code: string, phone: string) => {
    showSpinScreen(userType, spins, code, phone);
  }));
}

async function showSpinScreen(userType: UserType, spins: number, code: string, phone: string) {
  app.innerHTML = '<div class="ce-loading">Ачааллаж байна...</div>';
  const prizes = await fetchPrizes(userType);
  app.innerHTML = '';
  app.appendChild(SpinScreen(userType, code, spins, phone, prizes, showCodeEntry, (won: Prize[], wonCode: string) => {
    showEndScreen(won, wonCode);
  }));
}

function showEndScreen(won: Prize[], code: string) {
  app.innerHTML = '';
  app.appendChild(EndScreen(won, code, showCodeEntry));
}

showCodeEntry();

// iOS Safari never fires the CSS :active pseudo-class on tap unless
// some element on the page has a touchstart listener — without this,
// every tap-scale/press effect on buttons, chips and cards (all real
// CSS rules, not missing) silently never triggers on iPhone. This is
// a no-op handler that exists purely to switch that behavior on.
document.addEventListener('touchstart', () => {}, { passive: true });

// ── Footer year + rules modal (persistent, outside the router) ──
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const rulesOverlay = document.getElementById('rules-overlay');
const rulesOpenBtn = document.getElementById('rules-open');
const rulesCloseBtn = document.getElementById('rules-close');

function openRules() {
  rulesOverlay?.classList.add('open');
  rulesCloseBtn?.focus();
}
function closeRules() {
  rulesOverlay?.classList.remove('open');
  rulesOpenBtn?.focus();
}

rulesOpenBtn?.addEventListener('click', openRules);
rulesCloseBtn?.addEventListener('click', closeRules);
rulesOverlay?.addEventListener('click', (e) => {
  if (e.target === rulesOverlay) closeRules();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && rulesOverlay?.classList.contains('open')) closeRules();
});
