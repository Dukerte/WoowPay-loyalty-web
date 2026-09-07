// ══════════════════════════════════════════════════════════════
//  The 23–29, 30–39 and 40+ age bands share one skeleton in the
//  original draft (same 12-question mechanics, different copy),
//  which is why they're generated here from one factory instead of
//  being hand-written three times like the 18–22 band in data.ts.
//  Ids are prefixed per band (e.g. "b2329_q1") so answers from
//  different bands never collide in the stored JSON.
// ══════════════════════════════════════════════════════════════
import type { AnswerValue, MatrixAnswer, Question } from './types';
import { BRANDS } from './data';

// Option lists identical across all three bands in the original.
const SHARED_CHOICE = [
  'Нийт зардал, хүү, шимтгэл',
  'Хурдан шийдэгдэх',
  'Апп ашиглахад хялбар',
  'Найдвартай / албан ёсны байдал',
  'Төлөлтийн хугацаа тохиромжтой',
  'Барьцаа / нэмэлт материал бага',
  'Танилын санал',
  'Урамшуулал, нэмэлт давуу тал',
];

const SHARED_NONUSE = [
  'Шаардлага гараагүй',
  'Хүү, шимтгэл өндөр санагддаг',
  'Өр төлбөр нэмэхийг хүсдэггүй',
  'Найдвартай байдал, аюулгүй байдалд эргэлздэг',
  'Нөхцөлийг сайн мэдэхгүй',
  'Өөр төрлийн санхүүгийн хэрэгсэл ашигладаг',
  'Бусад',
];

const SHARED_Q10_REASON = [
  'Хэрэгтэй үед хурдан шийдэл шаардлагатай байсан',
  'Ашиглахад хялбар',
  'Нөхцөл, мэдээлэл ойлгомжтой',
  'Найз, танил санал болгосон',
  'Урамшуулал, нэмэлт давуу тал',
  'Хамтрагч байгууллага дээр ашиглах боломж',
  'Бусад',
];

const SHARED_Q10_KNOWN = [
  'Хэрэгцээ гараагүй',
  'Нөхцөлийг сайн мэдэхгүй',
  'Найдвартай байдал, аюулгүй байдалд эргэлздэг',
  'Өөр апп ашигладаг',
  'Хэрхэн ашиглахаа сайн мэдэхгүй',
  'Шаардлага хангахгүй эсвэл боломжит дүн хүрэлцэхгүй гэж боддог',
  'Бусад',
];

const SHARED_Q10_TRIAL = [
  'Ил тод, ойлгомжтой нөхцөл',
  'Найдвартай / албан ёсны байдал',
  'Бодит хэрэглэгчийн сэтгэгдэл',
  'Найзын санал',
  'Урамшуулал, нэмэлт давуу тал',
  'Бодит хэрэгцээ гарах үед',
  'Хялбар бүртгэл, ашиглалт',
];

const SHARED_Q10_UNAWARE = [
  'Албан ёсны, найдвартай байгууллага байх',
  'Хувийн мэдээлэл аюулгүй байх',
  'Нөхцөл, зардал ил тод байх',
  'Бодит хэрэглэгчийн үнэлгээ / сэтгэгдэл',
  'Найз, ойр хүний санал',
  'Апп ашиглахад хялбар, ойлгомжтой байх',
];

export interface MidBandCopy {
  prefix: string; // e.g. "b2329"
  q1: { kicker: string; title: string; options: string[] };
  q2: { kicker: string; title: string; options: string[] };
  q3: { kicker: string; title: string; options: string[] };
  q4: { kicker: string; title: string; options: string[] };
  q5a: string[];
  q6: string[];
  q8Purposes: string[];
  q11: string[];
  q12a: string[];
}

function woowStatus(matrix: MatrixAnswer | undefined): 'current' | 'used' | 'known' | 'unaware' {
  const cell = matrix?.rows?.['WooW Pay'];
  if (cell?.current) return 'current';
  if (cell?.used) return 'used';
  if (cell?.know) return 'known';
  return 'unaware';
}

export function buildMidBand(copy: MidBandCopy) {
  const p = copy.prefix;

  const Q1: Question = {
    id: `${p}_q1`, kicker: `1 • Таны тухай`, title: copy.q1.title,
    type: 'single', options: copy.q1.options, errorMsg: 'Хариултаа сонгоно уу.',
  };
  const Q2: Question = {
    id: `${p}_q2`, kicker: `2 • Орлогын түвшин`, title: copy.q2.title,
    type: 'single', options: copy.q2.options, errorMsg: 'Хариултаа сонгоно уу.',
  };
  const Q3: Question = {
    id: `${p}_q3`, kicker: `3 • Сарын төсөв`, title: copy.q3.title,
    type: 'single', options: copy.q3.options, errorMsg: 'Хариултаа сонгоно уу.',
  };
  const Q4: Question = {
    id: `${p}_q4`, kicker: `4 • Санхүүгийн нөөц`, title: copy.q4.title,
    type: 'single', options: copy.q4.options, errorMsg: 'Хариултаа сонгоно уу.',
  };
  const Q5: Question = {
    id: `${p}_q5`, kicker: `5 • Гэнэтийн хэрэгцээ`,
    title: 'Сүүлийн 3 сарын хугацаанд төлөвлөөгүй, гэнэтийн зардал гарсан уу?',
    type: 'single', options: ['Тийм', 'Үгүй'], errorMsg: 'Хариултаа сонгоно уу.',
  };
  const Q5A: Question = {
    id: `${p}_q5a`, kicker: `5 • Гэнэтийн хэрэгцээ`,
    title: 'Ямар төрлийн гэнэтийн зардал байсан бэ?', hint: '2 хүртэл сонголт.',
    type: 'multi', max: 2, options: copy.q5a,
  };
  const Q6: Question = {
    id: `${p}_q6`, kicker: `6 • Хэрхэн зохицуулдаг вэ?`,
    title: 'Гэнэтийн зардал гарвал та ихэвчлэн ямар аргаар зохицуулдаг вэ?', hint: '2 хүртэл сонголт.',
    type: 'multi', max: 2, required: true, errorMsg: 'Дор хаяж нэг хариулт сонгоно уу.', options: copy.q6,
  };
  const Q7: Question = {
    id: `${p}_q7`, kicker: `7 • Дижитал санхүүгийн хэрэглээ`,
    title: 'Сүүлийн 6 сарын хугацаанд богино хугацааны дижитал санхүүгийн үйлчилгээ хэдэн удаа ашигласан бэ?',
    type: 'single', errorMsg: 'Хариултаа сонгоно уу.',
    options: ['Огт ашиглаагүй', '1–2 удаа', '3–5 удаа', '6 ба түүнээс дээш удаа'],
  };
  const Q7_AMOUNT: Question = {
    id: `${p}_q7_amount`, kicker: `7 • Сүүлд ашигласан үйлчилгээний талаар`, title: 'Ашигласан дүн',
    type: 'single',
    options: ['50,000₮ хүртэл', '50,001–150,000₮', '150,001–300,000₮', '300,001–500,000₮', '500,001₮ ба түүнээс дээш'],
  };
  const Q7_TERM: Question = {
    id: `${p}_q7_term`, kicker: `7 • Сүүлд ашигласан үйлчилгээний талаар`, title: 'Төлөх хугацаа',
    type: 'single', options: ['7 хоногоос доош', '7–14 хоног', '15–30 хоног', '1 сараас дээш'],
  };
  const Q7_TRIGGER: Question = {
    id: `${p}_q7_trigger`, kicker: `7 • Сүүлд ашигласан үйлчилгээний талаар`,
    title: 'Сүүлд ашигласан гол шалтгаан юу байсан бэ?', hint: '2 хүртэл',
    type: 'multi', max: 2,
    options: [
      'Орлого, цалин орох хугацаа хойшилсон', 'Төлөвлөөгүй, гэнэтийн зардал гарсан',
      'Сарын төсөв хүрэлцээгүй', 'Хуримтлал, нөөц мөнгө хүрэлцээгүй',
      'Хэрэгтэй зүйлээ шууд авах шаардлага гарсан', 'Бусад',
    ],
  };
  const Q7_NONUSE: Question = {
    id: `${p}_q7_nonuse`, kicker: `7 • Дижитал санхүүгийн хэрэглээ`, title: 'Яагаад ашигладаггүй вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_NONUSE,
  };
  const Q8_PURPOSE: Question = {
    id: `${p}_q8_purpose`, kicker: `8 • Хэрэгцээ, сонголт`, title: 'Ямар хэрэгцээнд ашигладаг вэ?',
    hint: '3 хүртэл', type: 'multi', max: 3, options: copy.q8Purposes,
  };
  const Q8_CHOICE: Question = {
    id: `${p}_q8_choice`, kicker: `8 • Хэрэгцээ, сонголт`, title: 'Апп / үйлчилгээг сонгоход юу хамгийн чухал вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_CHOICE,
  };
  const Q8_NONUSE: Question = {
    id: `${p}_q8_nonuse`, kicker: `8 • Хэрэгцээ, сонголт`,
    title: 'Ийм үйлчилгээ хэрэглэх эсэхэд юу хамгийн их нөлөөлөх вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_NONUSE,
  };
  const Q9_UNAIDED: Question = {
    id: `${p}_q9_unaided`, kicker: `9 • Брэндийн танигдсан байдал`,
    title: 'Санхүүгийн апп гэхэд танд хамгийн түрүүнд ямар брэндүүд санаанд ордог вэ?',
    lead: 'Санаанд орсон брэндүүдээ бичнэ үү. Мэдэхгүй бол хоосон үлдээж болно.',
    type: 'text', placeholder: 'Жишээ: …',
  };
  const Q9_MATRIX: Question = {
    id: `${p}_q9_matrix`, kicker: `9 • Брэндийн танигдсан байдал`,
    title: 'Та дараах санхүүгийн апп, үйлчилгээнүүдээс алийг нь мэдэх вэ?',
    lead: 'Доорх брэнд бүрийн хувьд тохирох сонголтыг тэмдэглэнэ үү.',
    type: 'matrix', rows: BRANDS, columns: ['Мэддэг', 'Өмнө ашиглаж байсан', 'Одоо ашигладаг'],
  };
  const Q10_REASON: Question = {
    id: `${p}_q10_reason`, kicker: `10 • WooW Pay`, title: 'WooW Pay-ийг ашиглах болсон гол шалтгаан юу вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_Q10_REASON,
  };
  const Q10_WORDS: Question = {
    id: `${p}_q10_words`, kicker: `10 • WooW Pay`, title: 'WooW Pay-ийг 3 үгээр илэрхийлбэл?',
    type: 'text', placeholder: 'Жишээ: хурдан, хялбар, …',
  };
  const Q10_NPS: Question = {
    id: `${p}_q10_nps`, kicker: `10 • WooW Pay`, title: 'WooW Pay-ийг найз, танилдаа санал болгох магадлал хэр вэ?',
    hint: '0–10', type: 'scale', min: 0, max: 10,
    minLabel: 'Огт санал болгохгүй', maxLabel: 'Маш өндөр магадлалтай',
  };
  const Q10_KNOWN: Question = {
    id: `${p}_q10_known`, kicker: `10 • WooW Pay`, title: 'WooW Pay-ийг мэддэг ч яагаад ашиглаж үзээгүй вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_Q10_KNOWN,
  };
  const Q10_TRIAL: Question = {
    id: `${p}_q10_trial`, kicker: `10 • WooW Pay`, title: 'WooW Pay-ийг анх ашиглаж үзэхэд юу хамгийн их нөлөөлөх вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_Q10_TRIAL,
  };
  const Q10_UNAWARE: Question = {
    id: `${p}_q10_unaware`, kicker: `10 • WooW Pay`, title: 'Шинэ санхүүгийн апп-д итгэхийн тулд юу хамгийн чухал вэ?',
    hint: '2 хүртэл', type: 'multi', max: 2, options: SHARED_Q10_UNAWARE,
  };
  const Q11: Question = {
    id: `${p}_q11`, kicker: `11 • Мэдээллийн суваг`,
    title: 'Санхүүгийн апп, үйлчилгээний талаарх мэдээллийг ихэвчлэн хаанаас авдаг вэ?', hint: '3 хүртэл сонголт.',
    type: 'multi', max: 3, required: true, errorMsg: 'Дор хаяж нэг хариулт сонгоно уу.', options: copy.q11,
  };
  const Q12A: Question = {
    id: `${p}_q12a`, kicker: `12 • Мэдээлэл ба санал`,
    title: 'Ямар төрлийн мэдээлэл шинэ санхүүгийн аппыг сонирхож, туршиж үзэхэд танд илүү нөлөөлөх вэ?',
    hint: '3 хүртэл', type: 'multi', max: 3, options: copy.q12a,
  };
  const Q12B: Question = {
    id: `${p}_q12b`, kicker: `12 • Мэдээлэл ба санал`,
    title: 'WooW Pay-ийн үйлчилгээнд юуг сайжруулбал танд илүү хэрэгтэй, тохиромжтой болох вэ?',
    lead: 'Нэмэлт саналгүй бол хоосон үлдээж болно.',
    type: 'text', placeholder: 'Санал, хүсэлтээ энд бичээрэй…',
  };

  function buildSequence(answers: Record<string, AnswerValue>): Question[] {
    const seq: Question[] = [Q1, Q2, Q3, Q4, Q5];

    if (answers[Q5.id] === 'Тийм') seq.push(Q5A);

    seq.push(Q6, Q7);

    const q7Answer = answers[Q7.id];
    const usedDigital = typeof q7Answer === 'string' && q7Answer !== '' && q7Answer !== 'Огт ашиглаагүй';
    if (q7Answer === 'Огт ашиглаагүй') {
      seq.push(Q7_NONUSE);
    } else if (usedDigital) {
      seq.push(Q7_AMOUNT, Q7_TERM, Q7_TRIGGER);
    }

    if (usedDigital) {
      seq.push(Q8_PURPOSE, Q8_CHOICE);
    } else {
      seq.push(Q8_NONUSE);
    }

    seq.push(Q9_UNAIDED, Q9_MATRIX);

    const status = woowStatus(answers[Q9_MATRIX.id] as MatrixAnswer | undefined);
    if (status === 'current' || status === 'used') {
      seq.push(Q10_REASON, Q10_WORDS, Q10_NPS);
    } else if (status === 'known') {
      seq.push(Q10_KNOWN, Q10_TRIAL);
    } else {
      seq.push(Q10_UNAWARE);
    }

    seq.push(Q11, Q12A, Q12B);

    return seq;
  }

  return { buildSequence };
}
