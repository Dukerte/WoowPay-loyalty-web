import type { Prize, UserType } from '../types';

export const PRIZES: Record<UserType, Prize[]> = {
  merchant: [
    { label: '5,000 WooW Бонус оноо',   emoji: '⭐', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#29BDE0' },
    { label: 'Зээлийн эрх',             emoji: '💳', desc: 'Зээлийн хязгаар нэмэгдэх эрх',      color: '#F5B800' },
    { label: '50,000₮ эрх',             emoji: '🛍️', desc: 'Мерчант худалдан авалтын эрх',      color: '#FF6B35' },
    { label: '10,000 WooW Бонус оноо',  emoji: '🌟', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#2ECC71' },
    { label: 'Зээл хаах',               emoji: '🔐', desc: 'Нэг зээлийг үнэгүй хаах эрх',       color: '#9B59B6' },
    { label: 'Дараа дахин',             emoji: '🍀', desc: 'Азтай хаалт – Дараа оролдоорой',    color: '#34495E' },
    { label: '100,000₮ эрх',            emoji: '💰', desc: 'Мерчант 100K худалдан авалтын эрх', color: '#E74C3C' },
    { label: '2,500 WooW Бонус оноо',   emoji: '✨', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#1A9BBF' },
    { label: 'Комисс чөлөөлөлт',        emoji: '🎯', desc: '1 сарын комисс чөлөөлөгдлөө',      color: '#F39C12' },
    { label: '20,000₮ эрх',             emoji: '🎁', desc: 'Мерчант худалдан авалтын эрх',      color: '#16A085' },
  ],
  client: [
    { label: '500 WooW Бонус оноо',     emoji: '⭐', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#29BDE0' },
    { label: 'Зээлийн эрх',             emoji: '💳', desc: 'Зээлийн хязгаар нэмэгдэх эрх',      color: '#F5B800' },
    { label: '50,000₮ эрх',             emoji: '🛍️', desc: 'Мерчант худалдан авалтын хөнгөлөлт',color: '#FF6B35' },
    { label: '5,000 WooW Бонус оноо',   emoji: '🌟', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#2ECC71' },
    { label: 'Зээл хаах',               emoji: '🔐', desc: 'Нэг зээлийг үнэгүй хаах эрх',       color: '#9B59B6' },
    { label: 'Дараа дахин',             emoji: '🍀', desc: 'Азтай хаалт – Дараа оролдоорой',    color: '#34495E' },
    { label: '10,000₮ кэшбэк',          emoji: '💸', desc: '10,000₮ буцаан олголт',             color: '#E74C3C' },
    { label: '2,000 WooW Бонус оноо',   emoji: '✨', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#1A9BBF' },
    { label: 'Үнэгүй бараа',            emoji: '🎁', desc: 'Мерчантаас үнэгүй бараа авах эрх',  color: '#F39C12' },
    { label: '3,000 WooW Бонус оноо',   emoji: '🎯', desc: 'WooW Бонус оноо нэмэгдлээ',         color: '#16A085' },
  ],
};
