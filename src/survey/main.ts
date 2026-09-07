import '../styles/main.css'; // brand tokens (:root vars) + reset — see that file's header
import './survey.css';
import type { AnswerValue, ContactInfo } from './types';
import { getSurveyState, setAge, setContact, setAnswer, getAnswer } from './state';
import { buildSequence } from './engine';
import { IntroScreen, ContactScreen, FinishScreen } from './screens';
import { QuestionScreen } from './render';
import { saveProgress, submitSurvey } from './surveyService';

const app = document.getElementById('app')!;

function showIntro() {
  app.innerHTML = '';
  app.appendChild(IntroScreen((age: number) => {
    setAge(age);
    // First save happens the moment we have an age, even before
    // question 1 is answered — keyed by sessionId, since we don't
    // have a phone number yet (that's collected on the last screen).
    saveProgress(getSurveyState().sessionId, age, getSurveyState().answers);
    goToFirstQuestion();
  }, getSurveyState().age));
}

function goToFirstQuestion() {
  const seq = buildSequence(getSurveyState().answers);
  if (seq[0]) renderQuestion(seq[0].id);
  else showContact();
}

/** Renders the question `id` fresh, recomputing the sequence from
 * current answers each time — so a branch that appeared or
 * disappeared because an earlier answer changed on "back" is
 * always reflected immediately. */
function renderQuestion(id: string) {
  const answers = getSurveyState().answers;
  const seq = buildSequence(answers);
  const idx = seq.findIndex(q => q.id === id);
  const question = seq[idx];
  if (!question) { goToFirstQuestion(); return; }

  app.innerHTML = '';
  app.appendChild(QuestionScreen({
    question,
    currentAnswer: getAnswer(id),
    stepIndex: idx,
    stepTotal: seq.length + 1, // +1 for the contact screen at the end
    onNext: (value: AnswerValue) => {
      setAnswer(id, value);
      const state = getSurveyState();
      saveProgress(state.sessionId, state.age, state.answers);
      goForward(id);
    },
    onBack: idx === 0
      ? () => showIntro()
      : () => renderQuestion(seq[idx - 1].id),
  }));
}

function goForward(currentId: string) {
  const seq = buildSequence(getSurveyState().answers);
  const idx = seq.findIndex(q => q.id === currentId);
  const next = seq[idx + 1];
  if (next) renderQuestion(next.id);
  else showContact();
}

function showContact() {
  const seq = buildSequence(getSurveyState().answers);
  app.innerHTML = '';
  app.appendChild(ContactScreen(
    seq.length, // last step, index == length → 100% progress
    seq.length + 1,
    (contact: ContactInfo) => {
      setContact(contact);
      showFinish();
    },
    () => {
      const last = seq[seq.length - 1];
      if (last) renderQuestion(last.id);
      else showIntro();
    }
  ));
}

async function showFinish() {
  const state = getSurveyState();
  let alreadyClaimed = false;
  let clientCode: string | null = null;
  let clientToken: string | null = null;

  if (state.age !== null && state.contact) {
    const result = await submitSurvey(state.sessionId, state.age, state.answers, state.contact);
    alreadyClaimed = !!result.alreadyClaimed;
    clientCode = result.clientCode ?? null;
    clientToken = result.clientToken ?? null;
  }

  app.innerHTML = '';
  app.appendChild(FinishScreen({ alreadyClaimed, clientCode, clientToken }));
}

showIntro();

// iOS Safari :active-state fix — see src/main.ts for the full
// explanation. Needed here too since this is a separate entry point.
document.addEventListener('touchstart', () => {}, { passive: true });
