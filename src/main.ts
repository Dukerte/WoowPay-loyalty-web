import './styles/main.css';
import type { UserType } from './types';
import { CodeEntry } from './components/CodeEntry';
import { SpinScreen } from './components/SpinScreen';
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
  app.appendChild(SpinScreen(userType, code, spins, phone, prizes, showCodeEntry));
}

showCodeEntry();
