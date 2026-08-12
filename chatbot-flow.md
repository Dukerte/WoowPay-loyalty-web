# WoowPay Messenger Chatbot — Full Flow (editable)

This is the complete content of the custom Messenger bot, exactly as it's live on the test Page right now. Edit the text/labels/links/cards below and send it back — I'll re-import it into the database as-is, no redeploy needed.

**Latest changes:**
- The very first message (root) is now a card carousel too — Харилцагч / Мерчант / Урамшууллын хүрд — matching the style already used for the Харилцагч and Мерчант submenus.
- Every "Буцах" is now two separate options: **Өмнөх цэс рүү буцах** (back to the immediate previous screen) and **Нүүр хуудас буцах** (back to the very first menu). Screens whose only parent is the root menu just show a single "Нүүр хуудас буцах" since there's no separate "previous" to distinguish.
- Every "Холбогдох" now leads to a small choice screen first — **Утсаар холбогдох** (call, shows the phone-number buttons like before) or **Чатаар холбогдох** (chat, tells the person to just type their question here and staff will reply in this same conversation).
- "Барааны зээл" renamed to "Худалдан авалтын зээл" everywhere it appears.

**How to edit safely:**
- `KEY` is the screen's internal id — don't rename without telling me (other screens link to it by key).
- `Message:` is the text sent alongside/before the cards.
- `Card:` entries are carousel items — title, subtitle, target. Image is a plain navy/gold placeholder — send real photos/art whenever ready and I'll swap them in.
- `Quick replies:` are the chip buttons — `Label → target_key`, capped at 20 characters by Facebook (this is why some labels are shortened/abbreviated).
- `Buttons:` are the bigger tappable buttons on contact/app screens — max 3.
- `[COMING SOON — video not yet linked]` = guide videos not recorded yet.

---

## KEY: root
**Cards (carousel):**
1. Харилцагч 🙋 — "Зээл, апп, зааврын мэдээлэл" → client
2. Мерчант 🏬 — "Бидэнтэй хамтран ажиллах" → merchant
3. Урамшууллын хүрд 🎁 — "Хүрдээ эргүүлж шагнал аваарай" → wheel

*(No text intro line and no Буцах — this is the very first message, sent on GET_STARTED or whenever the bot doesn't recognize what was typed.)*

---

## ХАРИЛЦАГЧ (client) branch

### KEY: client
**Message:**
Бид хамгийн уян хатан нөхцөлтэй зээлийн үйлчилгээг санал болгож байна. 💙

**Cards (carousel):**
1. Худалдан авалтын зээл 🛍️ — "Хүүгүй, шимтгэлгүй зээл" → client_loan_purchase
2. Бэлэн мөнгөний зээл 💵 — "15/30 хоногийн богино хугацаа" → client_loan_cash
3. Апп татах 📲 — "Татаж аваад шууд бүртгүүлээрэй" → client_app
4. Заавар үзэх 🎬 — "Алхам алхмаар зааварчилгаа" → client_guide

**Quick replies:**
- Холбогдох 📞 → client_contact_choice
- Нүүр хуудас буцах → root

---

### KEY: client_loan_purchase
**Card (hero):** "Худалдан авалтын зээл 🛍️" — "Хямд бараагаа хүүгүй авах боломж"

**Message (after the card):**
✅ Хүүгүй
✅ Шимтгэлгүй
✅ Урьдчилгаагүй
✅ Худалдан авалтын доод дүн — 10,000₮-с дээш
✅ Хугацаа — 10/20 хоног 💙

**Quick replies:**
- Өмнөх цэс рүү буцах → client
- Нүүр хуудас буцах → root

---

### KEY: client_loan_cash
**Card (hero):** "Бэлэн мөнгөний зээл 💵" — "Шуурхай, хялбар зээл"

**Message (after the card):**
✅ Хугацаа — 15/30 хоног
✅ Хугацаандаа эргэн төлвөл хүү бодогдохгүй 💙

**Quick replies:**
- Өмнөх цэс рүү буцах → client
- Нүүр хуудас буцах → root

---

### KEY: client_app
**Card (hero):** "WoowPay аппликейшн 📲" — "Хялбар бүртгэл, шуурхай үйлчилгээ"
**Card button:** Апп татах → https://onelink.to/4z2e53 (web link)

**Quick replies:**
- Өмнөх цэс рүү буцах → client
- Нүүр хуудас буцах → root

---

### KEY: client_guide
**Message:**
Аль зааврыг үзэх вэ? 🎬

**Cards (carousel):**
1. Бүртгэл үүсгэх 📝 — "Апп дээр хэрхэн бүртгүүлэх вэ" → client_guide_register
2. Худалдан авалт хийх 🛒 — "Дэлгүүрт хэрхэн ашиглах вэ" → client_guide_purchase
3. Зээл төлөх 💳 — "QPay-ээр хэрхэн төлөх вэ" → client_guide_pay
4. Зээл сунгах 🔄 — "Хугацаа хэрхэн сунгах вэ" → client_guide_extend

**Quick replies:**
- Өмнөх цэс рүү буцах → client
- Нүүр хуудас буцах → root

---

### KEY: client_guide_register
**Message:**
WoowPay аппликейшинд бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → client_contact_choice
- Өмнөх цэс рүү буцах → client_guide
- Нүүр хуудас буцах → root

---

### KEY: client_guide_purchase
**Message:**
Худалдан авалт хийх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → client_contact_choice
- Өмнөх цэс рүү буцах → client_guide
- Нүүр хуудас буцах → root

---

### KEY: client_guide_pay
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл төлөх дүнгээ шалгаад QPay ашиглан шууд төлөх боломжтой. 💳✅

**Quick replies:**
- Холбогдох 📞 → client_contact_choice
- Өмнөх цэс рүү буцах → client_guide
- Нүүр хуудас буцах → root

---

### KEY: client_guide_extend
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл сунгах дүнгээ харж, QPay ашиглан шууд сунгалт хийх боломжтой. 🔄✅

**Quick replies:**
- Холбогдох 📞 → client_contact_choice
- Өмнөх цэс рүү буцах → client_guide
- Нүүр хуудас буцах → root

---

### KEY: client_contact_choice  *(new)*
**Message:**
Хэрхэн холбогдохыг сонгоно уу. 📞💬

**Quick replies:**
- Утсаар холбогдох 📞 → client_contact
- Чатаар холбогдох 💬 → client_chat
- Өмнөх цэс рүү буцах → client
- Нүүр хуудас буцах → root

---

### KEY: client_contact
**Message:**
Холбогдох дугаарууд 📞💙

**Buttons (phone):**
- 7272-6565 → +97672726565
- 8910-0017 → +97689100017
- 8808-6719 → +97688086719

**Quick replies:**
- Өмнөх цэс рүү буцах → client_contact_choice
- Нүүр хуудас буцах → root

---

### KEY: client_chat  *(new)*
**Message:**
Асуултаа доор чатаар бичнэ үү. Манай ажилтан удахгүй хариу өгөх болно. 💬💙

**Quick replies:**
- Өмнөх цэс рүү буцах → client_contact_choice
- Нүүр хуудас буцах → root

---

## МЕРЧАНТ (merchant) branch

### KEY: merchant
**Message:**
WoowPay-тай хэрхэн хамтран ажиллах хүсэлтэйгээ сонгоно уу. 🤝

**Cards (carousel):**
1. Шинээр бүртгүүлэх ✨ — "Мерчантаар шинээр нэгдэх" → merchant_new
2. Бүртгэлтэй мерчант 🏬 — "Одоо байгаа мерчантын үйлчилгээ" → merchant_existing

**Quick replies:**
- Нүүр хуудас буцах → root

---

### KEY: merchant_new
**Message:**
Бидэнтэй хамтран ажиллаж борлуулалтаа нэмэгдүүлээрэй. 📈

**Cards (carousel):**
1. Давуу тал 🌟 — "Хамтран ажиллах ач холбогдол" → merchant_new_benefits
2. Бүртгүүлэх заавар 🎬 — "Алхам алхмаар зааварчилгаа" → merchant_new_guide

**Quick replies:**
- Холбогдох 📞 → merchant_contact_choice
- Өмнөх цэс рүү буцах → merchant
- Нүүр хуудас буцах → root

---

### KEY: merchant_new_benefits
**Card (hero):** "WoowPay-тай хамтрахуй 🌟" — "Хүүгүй, шимтгэлгүй хуваан төлөлт"

**Message (after the card):**
WooW үйлчилгээг өөрийн бизнестээ нэвтрүүлэхээр холбогдож буй танд баярлалаа. 💙

Бизнес эрхлэгч танд WooW үйлчилгээний гол нөхцөл шаардлагыг хангаж бүхий л бараа бүтээгдхүүн үйлчилгээгээ хүүгүй, шимтгэлгүй, хуваан төлөх нөхцлөөр хэрэглэгчдэд бүрэн хүргэж хамтран ажиллах боломжтой. ✅

**Quick replies:**
- Өмнөх цэс рүү буцах → merchant_new
- Нүүр хуудас буцах → root

*(Note: "Мерчант шалгуур" / eligibility-criteria content still deferred.)*

---

### KEY: merchant_new_guide
**Message:**
Мерчантаар бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact_choice
- Өмнөх цэс рүү буцах → merchant_new
- Нүүр хуудас буцах → root

---

### KEY: merchant_existing
**Message:**
Мерчантын үйлчилгээнүүд: 🏬

**Cards (carousel):**
1. Борлуулалтын заавар 🧾 — "Нэхэмжлэх хэрхэн үүсгэх вэ" → merchant_sales_guide
2. Мерчант хайх заавар 🔍 — "Ойролцоох мерчант хэрхэн олох вэ" → merchant_find_guide

**Quick replies:**
- Холбогдох 📞 → merchant_contact_choice
- Өмнөх цэс рүү буцах → merchant
- Нүүр хуудас буцах → root

---

### KEY: merchant_sales_guide
**Message:**
Борлуулалт хийх (нэхэмжлэх үүсгэх) зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact_choice
- Өмнөх цэс рүү буцах → merchant_existing
- Нүүр хуудас буцах → root

---

### KEY: merchant_find_guide
**Message:**
Ойролцоох мерчант хайх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact_choice
- Өмнөх цэс рүү буцах → merchant_existing
- Нүүр хуудас буцах → root

---

### KEY: merchant_contact_choice  *(new)*
**Message:**
Хэрхэн холбогдохыг сонгоно уу. 📞💬

**Quick replies:**
- Утсаар холбогдох 📞 → merchant_contact
- Чатаар холбогдох 💬 → merchant_chat
- Өмнөх цэс рүү буцах → merchant
- Нүүр хуудас буцах → root

---

### KEY: merchant_contact
**Message:**
Холбогдох дугаарууд 📞💙

**Buttons (phone):**
- 7272-6565 → +97672726565
- 8910-0017 → +97689100017
- 8808-6719 → +97688086719

**Quick replies:**
- Өмнөх цэс рүү буцах → merchant_contact_choice
- Нүүр хуудас буцах → root

---

### KEY: merchant_chat  *(new)*
**Message:**
Асуултаа доор чатаар бичнэ үү. Манай ажилтан удахгүй хариу өгөх болно. 💬💙

**Quick replies:**
- Өмнөх цэс рүү буцах → merchant_contact_choice
- Нүүр хуудас буцах → root

---

## УРАМШУУЛАЛ (spin wheel) branch

### KEY: wheel
**Card (hero):** "Урамшууллын хүрд 🎁" — "Утасны дугаараа бичээд кодоо аваарай"

**Message (after the card):**
Урамшууллын эргэлтийн кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙

**Quick replies:**
- Нүүр хуудас буцах → root

**Special behavior (logic, not editable text):** Any message that looks like a phone number (6–12 digits), sent from *anywhere* in the flow, is automatically treated as a code lookup — searches `clients` by phone and replies with a "Хүрдээ эргүүлэх" button linking straight into the spin wheel. If no match found: "Холбогдох 📞" (→ client_contact_choice) + "Нүүр хуудас буцах".

---

## Not yet built into any screen
- Video links for the 5 `[COMING SOON]` placeholders above
- Мерчант шалгуур (merchant eligibility criteria) — deferred
- Real card images (currently plain navy/gold "WoowPay" placeholders on all 17 cards across the flow)
- The chat handoff leaves (client_chat / merchant_chat) currently just tell the person to type their question — there's no automatic hand-off/notification to a real staff member yet. If you want that (e.g. a Slack/email ping when someone reaches this screen), let me know and I can wire it up.
