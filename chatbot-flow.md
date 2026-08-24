# WoowPay Messenger Chatbot — Full Flow (editable)

This is the complete content of the custom Messenger bot, exactly as it's live on the test Page right now (messenger-webhook v9, last content update 2026-08-12). Edit the text/labels/links/cards below and send it back — I'll re-import it into the database as-is, no redeploy needed (redeploy is only needed if code logic changes, not content).

**Latest structural change (2026-08-12): jobs-to-be-done redesign.**
The Customer and Merchant menus used to be organized around WoowPay's *products* ("Худалдан авалтын зээл", "Бэлэн мөнгөний зээл"...). They're now organized around what the person is trying to *do* — pay a loan, register, find a merchant, etc. This mostly re-links existing screens rather than rewriting them; a few brand-new topics (Мерчант шалгуур, Төлбөр тооцоо) are stubbed as coming-soon until real copy is ready.

Also this pass: root gained a 4th card, **"WooW Зөвлөх 💬"**, a relabeled top-level entry point into the same human-handoff flow as the persistent "Ажилтантай холбогдох" chip (not a separate AI/FAQ bot — that's still deferred, see bottom of file).

**Native persistent menu (2026-08-12):** in addition to the message carousel, the Page's Messenger Profile now has a real vertical dropdown menu — the ≡ icon next to the text composer, always available regardless of where the conversation is. Set via a direct Graph API call (`/me/messenger_profile`), not through `bot_nodes`, so editing it requires a new API call rather than a SQL update. It only fits 3 flat items (Facebook removed nested/multi-level persistent submenus at some point — confirmed live, `type: "nested"` now returns `(#100) Invalid button type`), so it currently mirrors root's first 3 cards:
- 🙋 Харилцагч → client
- 🏬 Мерчант → merchant
- 🎁 WooW оноо & Урамшуулал → loyalty

"WooW Зөвлөх"/Тусламж isn't in this native menu (no room within the 3-item cap) but stays reachable everywhere via the persistent "Ажилтантай холбогдох" chip and the dedicated cards on root/client/merchant.

**How to edit safely:**
- `KEY` is the screen's internal id — don't rename without telling me (other screens link to it by key).
- `Message:` is the text sent alongside/before the cards.
- `Card:` entries are carousel items — title, subtitle, target. Image is a plain navy/gold placeholder — send real photos/art whenever ready and I'll swap them in.
- `Quick replies:` are the chip buttons — `Label → target_key`, capped at 20 characters by Facebook (this is why some labels are shortened/abbreviated).
- `Buttons:` are the bigger tappable buttons on contact/app screens — max 3.
- `[COMING SOON]` = placeholder leaves waiting on real content.

---

## KEY: root
**Message:**
Сайн байна уу 👋
WooW Pay танд юугаар туслах вэ?

**Cards (carousel):**
1. Харилцагч 🙋 — "Зээл, апп, зааврын мэдээлэл" → client
2. Мерчант 🏬 — "Бидэнтэй хамтран ажиллах" → merchant
3. WooW оноо & Урамшуулал 🎁 — "Оноо, гишүүнчлэл, урамшуулал" → loyalty
4. WooW Зөвлөх 💬 — "Ажилтантай шууд холбогдох" → contact_choice

**Quick replies:**
- Ажилтантай холбогдох → contact_choice

*(No "Буцах" — this is the very first message, sent on GET_STARTED or whenever the bot doesn't recognize what was typed.)*

---

## ХАРИЛЦАГЧ (client) branch — restructured around jobs, not products

### KEY: client
**Message:**
Юу хийхийг хүсэж байгаагаа сонгоно уу. 💙

**Cards (carousel):**
1. Зээлийн эрх & нөхцөл 📋 — "Зээлийн төрөл, нөхцөл шаардлага" → client_loan_terms
2. Зээл төлөх / сунгах 💳 — "Төлбөр хийх, хугацаа сунгах" → client_loan_manage
3. Худалдан авалт хийх 🛍️ — "Дэлгүүрт хэрхэн ашиглах вэ" → client_guide_purchase
4. Апп & бүртгэл 📲 — "Татах, бүртгүүлэх" → client_app_register
5. WooW оноо & урамшуулал ⭐ — "Оноо, гишүүнчлэл, урамшуулал" → loyalty
6. Тусламж 💬 — "Ажилтантай холбогдох" → contact_choice

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- 🏠 Нүүр цэс → root

---

### KEY: client_loan_terms  *(new — "Зээлийн эрх & нөхцөл" job)*
**Message:**
Танд тохирох зээлийн төрлийг сонгоно уу. 📋

**Cards (carousel):**
1. Худалдан авалтын зээл 🛍️ — "Хүүгүй, шимтгэлгүй зээл" → client_loan_purchase
2. Бэлэн мөнгөний зээл 💵 — "15/30 хоногийн богино хугацаа" → client_loan_cash

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client
- 🏠 Нүүр цэс → root

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
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_loan_terms
- 🏠 Нүүр цэс → root

---

### KEY: client_loan_cash
**Card (hero):** "Бэлэн мөнгөний зээл 💵" — "Шуурхай, хялбар зээл"

**Message (after the card):**
✅ Хугацаа — 15/30 хоног
✅ Хугацаандаа эргэн төлвөл хүү бодогдохгүй 💙

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_loan_terms
- 🏠 Нүүр цэс → root

---

### KEY: client_loan_manage  *(new — "Зээл төлөх / сунгах" job)*
**Message:**
Зээлтэй холбоотой юу хийхийг хүсэж байгаагаа сонгоно уу. 💳

**Cards (carousel):**
1. Зээл төлөх 💳 — "QPay-ээр хэрхэн төлөх вэ" → client_guide_pay
2. Зээл сунгах 🔄 — "Хугацаа хэрхэн сунгах вэ" → client_guide_extend

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client
- 🏠 Нүүр цэс → root

---

### KEY: client_guide_pay
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл төлөх дүнгээ шалгаад QPay ашиглан шууд төлөх боломжтой. 💳✅

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_loan_manage
- 🏠 Нүүр цэс → root

---

### KEY: client_guide_extend
**Message:**
Апп руугаа нэвтэрч ороод Миний худалдан авалтууд → Зээлийн дэлгэрэнгүй → Зээл сунгах дүнгээ харж, QPay ашиглан шууд сунгалт хийх боломжтой. 🔄✅

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_loan_manage
- 🏠 Нүүр цэс → root

---

### KEY: client_guide_purchase  *("Худалдан авалт хийх" job — now one tap from the client menu, not nested under a guide submenu)*
**Message:**
Худалдан авалт хийх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client
- 🏠 Нүүр цэс → root

---

### KEY: client_app_register  *(new — "Апп & бүртгэл" job)*
**Message:**
Апп болон бүртгэлтэй холбоотой юу хийхийг хүсэж байгаагаа сонгоно уу. 📲

**Cards (carousel):**
1. Апп татах 📲 — "Татаж аваад шууд ашиглаарай" → client_app
2. Бүртгэл үүсгэх 📝 — "Апп дээр хэрхэн бүртгүүлэх вэ" → client_guide_register

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client
- 🏠 Нүүр цэс → root

---

### KEY: client_app
**Card (hero):** "WoowPay аппликейшн 📲" — "Хялбар бүртгэл, шуурхай үйлчилгээ"
**Card button:** Апп татах → https://onelink.to/4z2e53 (web link)

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_app_register
- 🏠 Нүүр цэс → root

---

### KEY: client_guide_register
**Message:**
WoowPay аппликейшинд бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → client_app_register
- 🏠 Нүүр цэс → root

---

## МЕРЧАНТ (merchant) branch — restructured around jobs, not products

### KEY: merchant
**Message:**
Юу хийхийг хүсэж байгаагаа сонгоно уу. 🤝

**Cards (carousel):**
1. Мерчант болох ✨ — "Шинээр нэгдэх, давуу тал" → merchant_new
2. Шалгуур 📋 — "Нөхцөл шаардлага" → merchant_criteria
3. Нэхэмжлэх / борлуулалт 🧾 — "Нэхэмжлэх хэрхэн үүсгэх вэ" → merchant_sales_guide
4. Төлбөр тооцоо 💰 — "Орлогын тооцоо, шилжүүлэг" → merchant_settlement
5. Заавар 🔍 — "Ойролцоох мерчант хэрхэн олох вэ" → merchant_find_guide
6. Тусламж 💬 — "Ажилтантай холбогдох" → contact_choice

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- 🏠 Нүүр цэс → root

---

### KEY: merchant_new  *("Мерчант болох" job — unchanged submenu, just relabeled/repointed entry)*
**Message:**
Бидэнтэй хамтран ажиллаж борлуулалтаа нэмэгдүүлээрэй. 📈

**Cards (carousel):**
1. Давуу тал 🌟 — "Хамтран ажиллах ач холбогдол" → merchant_new_benefits
2. Бүртгүүлэх заавар 🎬 — "Алхам алхмаар зааварчилгаа" → merchant_new_guide

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant
- 🏠 Нүүр цэс → root

---

### KEY: merchant_new_benefits
**Card (hero):** "WoowPay-тай хамтрахуй 🌟" — "Хүүгүй, шимтгэлгүй хуваан төлөлт"

**Message (after the card):**
WooW үйлчилгээг өөрийн бизнестээ нэвтрүүлэхээр холбогдож буй танд баярлалаа. 💙

Бизнес эрхлэгч танд WooW үйлчилгээний гол нөхцөл шаардлагыг хангаж бүхий л бараа бүтээгдхүүн үйлчилгээгээ хүүгүй, шимтгэлгүй, хуваан төлөх нөхцлөөр хэрэглэгчдэд бүрэн хүргэж хамтран ажиллах боломжтой. ✅

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant_new
- 🏠 Нүүр цэс → root

---

### KEY: merchant_new_guide
**Message:**
Мерчантаар бүртгүүлэх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant_new
- 🏠 Нүүр цэс → root

---

### KEY: merchant_criteria  *(new — "Шалгуур" job, stub)*
**Message:**
Мерчантаар бүртгүүлэх шалгуур нөхцлийн дэлгэрэнгүй мэдээлэл тун удахгүй нэмэгдэнэ. 🚧 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — content not yet added]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant
- 🏠 Нүүр цэс → root

---

### KEY: merchant_sales_guide  *("Нэхэмжлэх / борлуулалт" job — now one tap from the merchant menu)*
**Message:**
Борлуулалт хийх (нэхэмжлэх үүсгэх) зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant
- 🏠 Нүүр цэс → root

---

### KEY: merchant_settlement  *(new — "Төлбөр тооцоо" job, stub)*
**Message:**
Төлбөр тооцооны дэлгэрэнгүй мэдээлэл тун удахгүй нэмэгдэнэ. 🚧 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — content not yet added]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant
- 🏠 Нүүр цэс → root

---

### KEY: merchant_find_guide  *("Заавар" job — now one tap from the merchant menu)*
**Message:**
Ойролцоох мерчант хайх зааврын видео тун удахгүй нэмэгдэнэ. 🎬 Одоохондоо тусламж хэрэгтэй бол доор холбогдоно уу 💙
`[COMING SOON — video not yet linked]`

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- ← Өмнөх цэс → merchant
- 🏠 Нүүр цэс → root

---

## WooW ОНОО & УРАМШУУЛАЛ (loyalty) branch

### KEY: loyalty
**Message:**
Аль мэдээллийг үзэх вэ? ⭐

**Cards (carousel):**
1. WooW оноо ⭐ — "Таны хуримтлуулсан оноо" → loyalty_points
2. Loyalty 💳 — "Гишүүнчлэлийн систем" → loyalty_program
3. Идэвхтэй урамшуулал 🎉 — "Одоо үргэлжилж буй урамшуулал" → loyalty_active
4. Урамшууллын хүрд 🎁 — "Утасны дугаараа бичээд кодоо аваарай" → wheel

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- 🏠 Нүүр цэс → root

---

### KEY: loyalty_points / loyalty_program / loyalty_active
All three are "coming soon" placeholders (`[COMING SOON — content not yet added]`) with the same quick-reply pattern: Ажилтантай холбогдох → contact_choice, ← Өмнөх цэс → loyalty, 🏠 Нүүр цэс → root.

---

## УРАМШУУЛЛЫН ХҮРД (spin wheel)

### KEY: wheel
**Card (hero):** "Урамшууллын хүрд 🎁" — "Утасны дугаараа бичээд кодоо аваарай"

**Message (after the card):**
Урамшууллын эргэлтийн кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙

**Quick replies:**
- Ажилтантай холбогдох → contact_choice
- 🏠 Нүүр цэс → root

**Special behavior (logic, not editable text):** Any message that looks like a phone number (6–12 digits), sent from *anywhere* in the flow, is automatically treated as a code lookup — searches `clients` by phone and replies with a "Хүрдээ эргүүлэх" button linking straight into the spin wheel. If no match found: "Таны дугаараар бүртгэл олдсонгүй..." + "Ажилтантай холбогдох" (→ contact_choice) + "🏠 Нүүр цэс" (→ root).

---

## Ажилтантай холбогдох / WooW Зөвлөх (universal contact flow)

Reachable from every single screen via the persistent "Ажилтантай холбогдох" chip, plus a dedicated top-level root card ("WooW Зөвлөх 💬") and a dedicated "Тусламж" card on both the client and merchant menus — all four entry points lead to the same shared nodes.

### KEY: contact_choice
**Message:**
Хэрхэн холбогдохыг сонгоно уу. 📞💬

**Quick replies:**
- Утсаар холбогдох 📞 → contact
- Чатаар холбогдох 💬 → chat
- 🏠 Нүүр цэс → root

---

### KEY: contact
**Message:**
Холбогдох дугаарууд 📞💙

**Buttons (phone):**
- 7272-6565 → +97672726565
- 8910-0017 → +97689100017
- 8808-6719 → +97688086719

**Quick replies:**
- 🏠 Нүүр цэс → root

---

### KEY: chat
**Message:**
Асуултаа доор чатаар бичнэ үү. Манай ажилтан удахгүй хариу өгөх болно. 💬💙

**Quick replies:**
- 🏠 Нүүр цэс → root

---

## Video guides (added 2026-08-13)
Five of the "coming soon" leaf screens now play real instructional videos via a "Видео үзэх ▶️" button (Button Template, `type: web_url`):
- `client_guide_register` → https://www.youtube.com/shorts/k7lvStqHZPY (Бүртгүүлэх)
- `client_guide_purchase` → https://www.youtube.com/watch?v=zyr1xxLdJlE (Хэрэглэгч талаас худалдан авалт хийх)
- `merchant_find_guide` → https://www.youtube.com/shorts/QJal0Q1XHHU (Ойрхон мерчант хайх)
- `merchant_sales_guide` → https://www.youtube.com/watch?v=l-3zPaZGaIo (Мерчант талаас нэхэмжлэх үүсгэх)
- `client_guide_pay` and `client_guide_extend` → https://www.youtube.com/shorts/_vCb2PUSrIw (Зээл төлөх, сунгах — same video, shared) — these two already had real instruction text, the video was appended as a supplementary resource rather than replacing the text.

Also note: `loyalty_points`' message was independently edited (now "WooW Бонус оноо..." rather than "WooW оноо...") and root/client cards now use real uploaded artwork instead of placehold.co placeholders — both done directly in Supabase, not by me. This file may drift from the live DB when edits happen outside this conversation; when in doubt, the live `select * from bot_nodes` is the source of truth, not this doc.

## Not yet built into any screen
- Real content for the remaining `[COMING SOON]` leaves: `merchant_new_guide` (merchant registration video — not yet provided, distinct from the customer registration video above), `merchant_criteria` (eligibility criteria), `merchant_settlement` (payout/settlement details), `loyalty_points` (WooW Бонус оноо details), `loyalty_lottery` (Супер сугалаа rules/dates)
- Real card images on any card still using the placehold.co placeholder (client_loan_terms leaves, client_app_register leaves, merchant_new leaves, merchant menu cards, contact/chat, wheel) — root and the top-level client menu already have real artwork
- The `chat` handoff leaf currently just tells the person to type their question — there's no automatic hand-off/notification to a real staff member yet.
- "WooW Зөвлөх" is currently just a relabeled entry point into the human-handoff flow, not a real AI/FAQ layer. A genuine free-text question-answering bot is a separate, much larger build (needs an AI layer, fallback logic, a knowledge base) and hasn't been started.
- The remaining items from the broader UX/product review (deep links into app screens, tone/copy pass, phone-number normalization, privacy/fraud copy, personalization, analytics, A/B testing, admin tooling, explicit error states, etc.) — held for prioritization.
