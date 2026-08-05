import type { Prize, UserType } from '../types';

// Harmonious 10-color palette for the wheel
const C = {
  cyan:    '#29BDE0',
  amber:   '#F59E0B',
  orange:  '#F97316',
  emerald: '#10B981',
  purple:  '#8B5CF6',
  slate:   '#475569',
  red:     '#EF4444',
  blue:    '#3B82F6',
  teal:    '#14B8A6',
  pink:    '#EC4899',
};

export const PRIZES: Record<UserType, Prize[]> = {
  merchant: [
    { label: '5,000 WooW Бонус оноо',   shortLabel: '5,000 Бонус',   emoji: '⭐', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.cyan    },
    { label: 'Зээлийн эрх',             shortLabel: 'Зээлийн эрх',   emoji: '💳', desc: 'Зээлийн хязгаар нэмэгдэх эрх',     color: C.amber   },
    { label: '50,000₮ эрх',             shortLabel: '50,000₮',       emoji: '🛍️', desc: 'Мерчант худалдан авалтын эрх',     color: C.orange  },
    { label: '10,000 WooW Бонус оноо',  shortLabel: '10,000 Бонус',  emoji: '🌟', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.emerald },
    { label: 'Зээл хаах',               shortLabel: 'Зээл хаах',     emoji: '🔐', desc: 'Нэг зээлийг үнэгүй хаах эрх',      color: C.purple  },
    { label: 'Дараа дахин',             shortLabel: 'Дараа дахин',   emoji: '🍀', desc: 'Азтай хаалт – Дараа оролдоорой',  color: C.slate   },
    { label: '100,000₮ эрх',            shortLabel: '100,000₮',      emoji: '💰', desc: 'Мерчант 100K худалдан авалтын эрх',color: C.red     },
    { label: '2,500 WooW Бонус оноо',   shortLabel: '2,500 Бонус',   emoji: '✨', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.blue    },
    { label: 'Комисс чөлөөлөлт',        shortLabel: 'Комисс -0%',    emoji: '🎯', desc: '1 сарын комисс чөлөөлөгдлөө',     color: C.teal    },
    { label: '20,000₮ эрх',             shortLabel: '20,000₮',       emoji: '🎁', desc: 'Мерчант худалдан авалтын эрх',     color: C.pink    },
  ],
  client: [
    { label: '500 WooW Бонус оноо',     shortLabel: '500 Бонус',     emoji: '⭐', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.cyan    },
    { label: 'Зээлийн эрх',             shortLabel: 'Зээлийн эрх',   emoji: '💳', desc: 'Зээлийн хязгаар нэмэгдэх эрх',     color: C.amber   },
    { label: '50,000₮ эрх',             shortLabel: '50,000₮',       emoji: '🛍️', desc: 'Мерчант худалдан авалтын хөнгөлөлт',color: C.orange },
    { label: '5,000 WooW Бонус оноо',   shortLabel: '5,000 Бонус',   emoji: '🌟', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.emerald },
    { label: 'Зээл хаах',               shortLabel: 'Зээл хаах',     emoji: '🔐', desc: 'Нэг зээлийг үнэгүй хаах эрх',      color: C.purple  },
    { label: 'Дараа дахин',             shortLabel: 'Дараа дахин',   emoji: '🍀', desc: 'Азтай хаалт – Дараа оролдоорой',  color: C.slate   },
    { label: '10,000₮ кэшбэк',          shortLabel: '10,000₮ кэш',   emoji: '💸', desc: '10,000₮ буцаан олголт',             color: C.red     },
    { label: '2,000 WooW Бонус оноо',   shortLabel: '2,000 Бонус',   emoji: '✨', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.blue    },
    { label: 'Үнэгүй бараа',            shortLabel: 'Үнэгүй бараа',  emoji: '🎁', desc: 'Мерчантаас үнэгүй бараа авах эрх', color: C.teal    },
    { label: '3,000 WooW Бонус оноо',   shortLabel: '3,000 Бонус',   emoji: '🎯', desc: 'WooW Бонус оноо нэмэгдлээ',         color: C.pink    },
  ],
};
