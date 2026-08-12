# WoowPay Messenger Chatbot — Full Flow (editable)

This is the complete content of the custom Messenger bot, exactly as it's live on the test Page right now. Edit the text/labels/links/cards below and send it back — I'll re-import it into the database as-is, no redeploy needed.

**Latest change:** every menu screen (root's children — Харилцагч, Мерчант, and their submenus) now shows as a swipeable card carousel with a placeholder image per option, instead of plain text chips. Tapping "Сонгох" on a card navigates exactly like the old chips did. Root itself, and the Буцах/Холбогдох chips, stay as simple quick-reply chips since those don't need a picture.

**How to edit safely:**
- `KEY` is the screen's internal id — don't rename without telling me (other screens link to it by key).
- `Message:` is the text sent alongside/before the cards. Line breaks show as line breaks in Messenger.
- `Card:` entries are the carousel items — title, subtitle, and the target screen the "Сонгох" button jumps to. Image is currently a plain navy/gold placeholder — send me real photos/art whenever ready and I'll swap them in, no other changes needed.
- `Quick replies:` are the small chip buttons — `Label → target_key`, capped at 20 characters by Facebook.
- `Buttons:` are the bigger tappable buttons on contact/app screens (phone numbers or web links) — max 3.
- Placeholder lines marked `[COMING SOON — video not yet linked]` are guide videos not recorded yet.

---

## KEY: root
**Message:**
Сайн байна уу? 👋 Та аль чиглэлээр холбогдох хүсэлтэй байгаагаа сонгоно уу.

**Quick replies:**
- Харилцагч 🙋 → client
- Мерчант 🏬 → merchant
- Урамшуулал 🎁 → wheel

---

## ХАРИЛЦАГЧ (client) branch

### KEY: client
**Message:**
Бид хамгийн уян хатан нөхцөлтэй зээлийн үйлчилгээг санал болгож байна. 💙

**Cards (carousel):**
1. Барааны зээл 🛍️ — "Хүүгүй, шимтгэлгүй зээл" → client_loan_purchase
2. Бэлэн мөнгөний зээл 💵 — "15/30 хоногийн богино хугацаа" → client_loan_cash
3. Апп татах 📲 — "Татаж аваад шууд бүртгүүлээрэй" → client_app
4. Заавар үзэх 🎬 — "Алхам алхмаар зааварчилгаа" → client_guide

**Quick replies:**
- Холбогдох 📞 → client_contact
- Буцах → root

---

### KEY: client_loan_purchase
**Card (hero):** "Барааны зээл 🛍️" — "Хямд бараагаа хүүгүй авах боломж"

**Message (after the card):**
✅ Хүүгүй
✅ Шимтгэлгүй
✅ Урьдчилгаагүй
✅ Худалдан авалтын доод дүн — 10,000₮-с дээш
✅ Хугацаа — 10/20 хоног 💙

**Quick replies:**
- Буцах → client

---

### KEY: client_loan_cash
**Card (hero):** "Бэлэн мөнгөний зээл 💵" — "Шуурхай, хялбар зээл"

**Message (after the card):**
✅ Хугацаа — 15/30 хоног
✅ Хугацаандаа эргэн төлвөл хүү бодогдохгүй 💙

**Quick replies:**
- Буцах → client

---

### KEY: client_app
**Card (hero):** "WoowPay аппликейшн 📲" — "Хялбар бүртгэл, шуурхай үйлчилгээ"
**Card button:** Апп татах → https://onelink.to/4z2e53 (web link)

**Quick replies:**
- Буцах → client

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
- Буцах → client

---

### KEY: client_guide_register
**Message:**
WoowPay аппликейшинд бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → client_contact
- Буцах → client_guide

---

### KEY: client_guide_purchase
**Message:**
Худалдан авалт хийх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → client_contact
- Буцах → client_guide

---

### KEY: client_guide_pay
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл төлөх дүнгээ шалгаад QPay ашиглан шууд төлөх боломжтой. 💳✅

**Quick replies:**
- Холбогдох 📞 → client_contact
- Буцах → client_guide

---

### KEY: client_guide_extend
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл сунгах дүнгээ харж, QPay ашиглан шууд сунгалт хийх боломжтой. 🔄✅

**Quick replies:**
- Холбогдох 📞 → client_contact
- Буцах → client_guide

---

### KEY: client_contact
**Message:**
Холбогдох дугаарууд 📞💙

**Buttons (phone):**
- 7272-6565 → +97672726565
- 8910-0017 → +97689100017
- 8808-6719 → +97688086719

**Quick replies:**
- Буцах → client

---

## МЕРЧАНТ (merchant) branch

### KEY: merchant
**Message:**
WoowPay-тай хэрхэн хамтран ажиллах хүсэлтэйгээ сонгоно уу. 🤝

**Cards (carousel):**
1. Шинээр бүртгүүлэх ✨ — "Мерчантаар шинээр нэгдэх" → merchant_new
2. Бүртгэлтэй мерчант 🏬 — "Одоо байгаа мерчантын үйлчилгээ" → merchant_existing

**Quick replies:**
- Буцах → root

---

### KEY: merchant_new
**Message:**
Бидэнтэй хамтран ажиллаж борлуулалтаа нэмэгдүүлээрэй. 📈

**Cards (carousel):**
1. Давуу тал 🌟 — "Хамтран ажиллах ач холбогдол" → merchant_new_benefits
2. Бүртгүүлэх заавар 🎬 — "Алхам алхмаар зааварчилгаа" → merchant_new_guide

**Quick replies:**
- Холбогдох 📞 → merchant_contact
- Буцах → merchant

---

### KEY: merchant_new_benefits
**Card (hero):** "WoowPay-тай хамтрахуй 🌟" — "Хүүгүй, шимтгэлгүй хуваан төлөлт"

**Message (after the card):**
WooW үйлчилгээг өөрийн бизнестээ нэвтрүүлэхээр холбогдож буй танд баярлалаа. 💙

Бизнес эрхлэгч танд WooW үйлчилгээний гол нөхцөл шаардлагыг хангаж бүхий л бараа бүтээгдхүүн үйлчилгээгээ хүүгүй, шимтгэлгүй, хуваан төлөх нөхцлөөр хэрэглэгчдэд бүрэн хүргэж хамтран ажиллах боломжтой. ✅

**Quick replies:**
- Буцах → merchant_new

*(Note: "Мерчант шалгуур" / eligibility-criteria content still deferred — add here whenever ready.)*

---

### KEY: merchant_new_guide
**Message:**
Мерчантаар бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact
- Буцах → merchant_new

---

### KEY: merchant_existing
**Message:**
Мерчантын үйлчилгээнүүд: 🏬

**Cards (carousel):**
1. Борлуулалтын заавар 🧾 — "Нэхэмжлэх хэрхэн үүсгэх вэ" → merchant_sales_guide
2. Мерчант хайх заавар 🔍 — "Ойролцоох мерчант хэрхэн олох вэ" → merchant_find_guide

**Quick replies:**
- Холбогдох 📞 → merchant_contact
- Буцах → merchant

---

### KEY: merchant_sales_guide
**Message:**
Борлуулалт хийх (нэхэмжлэх үүсгэх) зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact
- Буцах → merchant_existing

---

### KEY: merchant_find_guide
**Message:**
Ойролцоох мерчант хайх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Холбогдох 📞 → merchant_contact
- Буцах → merchant_existing

---

### KEY: merchant_contact
**Message:**
Холбогдох дугаарууд 📞💙

**Buttons (phone):**
- 7272-6565 → +97672726565
- 8910-0017 → +97689100017
- 8808-6719 → +97688086719

**Quick replies:**
- Буцах → merchant

---

## УРАМШУУЛАЛ (spin wheel) branch

### KEY: wheel
**Card (hero):** "Урамшууллын хүрд 🎁" — "Утасны дугаараа бичээд кодоо аваарай"

**Message (after the card):**
Урамшууллын эргэлтийн кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙

**Quick replies:**
- Буцах → root

**Special behavior (logic, not editable text):** Any message that looks like a phone number (6–12 digits), sent from *anywhere* in the flow, is automatically treated as a code lookup — the bot searches `clients` by phone and replies with a "Хүрдээ эргүүлэх" button linking straight into the spin wheel. If no match is found, it shows a "not found" message with Холбогдох/Буцах options.

---

## Not yet built into any screen
- Video links for the 5 `[COMING SOON]` placeholders above
- Мерчант шалгуур (merchant eligibility criteria) — deferred, no content yet
- Real card images (currently plain navy/gold "WoowPay" placeholders on every card in the flow — 14 cards total across menus and hero screens)
