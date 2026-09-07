import '../styles/main.css'; // brand tokens (:root vars) + reset — see that file's header
import './survey.css';
import type { AnswerValue, SurveyProfile } from './types';
import { getSurveyState, setProfile, setAnswer, getAnswer } from './state';
import { buildSequence } from './engine';
import { IntroScreen, FinishScreen } from './screens';
import { QuestionScreen } from './render';
import { saveProgress, submitSurvey } from './surveyService';

const app = document.getElementById('app')!;

function showIntro() {
  app.innerHTML = '';
  app.appendChild(IntroScreen((profile: SurveyProfile) => {
    setProfile(profile);
    // First save happens the moment we have a phone number, even
    // before question 1 is answered — so a phone that bails
    // immediately still has a (near-empty) row on record.
    saveProgress(profile, getSurveyState().answers);
    goToFirstQuestion();
  }));
}

function goToFirstQuestion() {
  const seq = buildSequence(getSurveyState().answers);
  if (seq[0]) renderQuestion(seq[0].id);
  else showFinish();
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
    stepTotal: seq.length,
    onNext: (value: AnswerValue) => {
      setAnswer(id, value);
      saveProgress(getSurveyState().profile, getSurveyState().answers);
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
  else showFinish();
}

async function showFinish() {
  const state = getSurveyState();
  let alreadyClaimed = false;
  if (state.profile) {
    const result = await submitSurvey(state.profile, state);
    alreadyClaimed = !!result.alreadyClaimed;
  }
  app.innerHTML = '';
  app.appendChild(FinishScreen({ alreadyClaimed }));
}

showIntro();

// iOS Safari :active-state fix — see src/main.ts for the full
// explanation. Needed here too since this is a separate entry point.
document.addEventListener('touchstart', () => {}, { passive: true });
