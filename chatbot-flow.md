# WoowPay Messenger Chatbot — Full Flow (editable)

This is the complete content of the custom Messenger bot, exactly as it's live on the test Page right now — updated with emojis and the new card visuals we just added. Edit the text/labels/links/cards below and send it back — I'll re-import it into the database as-is, no redeploy needed.

**What changed since the last version of this file:**
- Added emojis throughout (💙 for warmth, 📞/☎️ for contact points, plus icons on most menu labels).
- Promo screens (loan products, app download, wheel, merchant benefits) now show an image card above the text — currently a plain navy/gold placeholder card since we don't have real photos yet. Send me real images whenever ready and I'll drop them in.
- Tried a true vertical list layout (Facebook's List Template) for the bigger menus — Facebook's API rejected it every time we tested (a platform limitation: List Template's per-item buttons only reliably support opening a web link, not our internal bot navigation). So menus stayed as quick-reply chips, which do scroll horizontally but are the only reliable option Facebook gives us for in-bot navigation right now.

**How to edit safely:**
- `KEY` is the screen's internal id — don't change existing keys unless you want to rename that screen (tell me if you do, other screens link to it by key).
- `Message:` is the text the bot sends. Line breaks show as line breaks in Messenger.
- `Quick replies:` are the chip buttons under the message — `Label → target_key`. **Facebook caps each label at 20 characters.**
- `Card:` (only on some screens) is the image hero shown above the message — title, subtitle, and optional buttons. Image is currently a placeholder; send real art/photos to replace it.
- `Buttons:` are the bigger tappable buttons on contact/app screens (phone numbers or web links) — max 3.
- Placeholder lines marked `[COMING SOON — video not yet linked]` are guide videos not recorded yet. Send me the URL when ready.

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

**Quick replies:**
- Барааны зээл 🛍️ → client_loan_purchase
- Бэлэн мөнгөний зээл 💵 → client_loan_cash
- Апп татах 📲 → client_app
- Заавар үзэх 🎬 → client_guide
- Холбогдох 📞 → client_contact
- Буцах → root

---

### KEY: client_loan_purchase
**Card:** title "Барааны зээл 🛍️", subtitle "Хямд бараагаа хүүгүй авах боломж", [placeholder image]

**Message (sent after the card):**
✅ Хүүгүй
✅ Шимтгэлгүй
✅ Урьдчилгаагүй
✅ Худалдан авалтын доод дүн — 10,000₮-с дээш
✅ Хугацаа — 10/20 хоног 💙

**Quick replies:**
- Буцах → client

---

### KEY: client_loan_cash
**Card:** title "Бэлэн мөнгөний зээл 💵", subtitle "Шуурхай, хялбар зээл", [placeholder image]

**Message (sent after the card):**
✅ Хугацаа — 15/30 хоног
✅ Хугацаандаа эргэн төлвөл хүү бодогдохгүй 💙

**Quick replies:**
- Буцах → client

---

### KEY: client_app
**Card:** title "WoowPay аппликейшн 📲", subtitle "Хялбар бүртгэл, шуурхай үйлчилгээ", [placeholder image]
**Card button:** Апп татах → https://onelink.to/4z2e53 (web link)

**Quick replies:**
- Буцах → client

---

### KEY: client_guide
**Message:**
Аль зааврыг үзэх вэ? 🎬

**Quick replies:**
- Бүртгэл үүсгэх 📝 → client_guide_register
- Худ. авалт хийх 🛒 → client_guide_purchase
- Зээл төлөх 💳 → client_guide_pay
- Зээл сунгах 🔄 → client_guide_extend
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

**Quick replies:**
- Шинээр бүртгүүлэх ✨ → merchant_new
- Бүртгэлтэй мерчант 🏬 → merchant_existing
- Буцах → root

---

### KEY: merchant_new
**Message:**
Бидэнтэй хамтран ажиллаж борлуулалтаа нэмэгдүүлээрэй. 📈

**Quick replies:**
- Давуу тал 🌟 → merchant_new_benefits
- Бүртгүүлэх заавар 🎬 → merchant_new_guide
- Холбогдох 📞 → merchant_contact
- Буцах → merchant

---

### KEY: merchant_new_benefits
**Card:** title "WoowPay-тай хамтрахуй 🌟", subtitle "Хүүгүй, шимтгэлгүй хуваан төлөлт", [placeholder image]

**Message (sent after the card):**
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

**Quick replies:**
- Борлуулалтын заавар 🧾 → merchant_sales_guide
- Мерчант хайх заавар 🔍 → merchant_find_guide
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
**Card:** title "Урамшууллын хүрд 🎁", subtitle "Утасны дугаараа бичээд кодоо аваарай", [placeholder image]

**Message (sent after the card):**
Урамшууллын эргэлтийн кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙

**Quick replies:**
- Буцах → root

**Special behavior (logic, not editable text):** Any message that looks like a phone number (6–12 digits), sent from *anywhere* in the flow, is automatically treated as a code lookup — the bot searches `clients` by phone and replies with a card containing the code + a "Хүрдээ эргүүлэх" button linking straight into the spin wheel. If no match is found, it shows a "not found" message with Холбогдох/Буцах options.

---

## Not yet built into any screen
- Video links for the 5 `[COMING SOON]` placeholders above
- Мерчант шалгуур (merchant eligibility criteria) — deferred, no content yet
- Real card images (currently plain navy/gold "WoowPay" placeholders on: client_loan_purchase, client_loan_cash, client_app, merchant_new_benefits, wheel)
