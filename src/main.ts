import './styles/main.css';
import type { UserType } from './types';
import { CodeEntry } from './components/CodeEntry';
import { SpinScreen } from './components/SpinScreen';

const app = document.getElementById('app')!;

function showCodeEntry() {
  app.innerHTML = '';
  app.appendChild(CodeEntry((userType: UserType, spins: number, code: string, phone: string) => {
    showSpinScreen(userType, spins, code, phone);
  }));
}

function showSpinScreen(userType: UserType, spins: number, code: string, phone: string) {
  app.innerHTML = '';
  app.appendChild(SpinScreen(userType, code, spins, phone, showCodeEntry));
}

showCodeEntry();
