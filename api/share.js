// Vercel serverless function — generates a per-prize Open Graph
// preview for Facebook shares. Facebook's crawler doesn't execute
// JS, so a static SPA can't show a dynamic "what I won" preview by
// itself; this tiny endpoint returns real HTML with the right
// og:image/og:title for the specific prize, then bounces real
// visitors on to the actual site.
//
// Images live in /public/og-prizes/<prize-id>.png (one per row in
// the `prizes` Supabase table at the time this was generated). If a
// prize is added later via the admin panel, it won't have a card
// here yet and this falls back to the generic cover image — ask for
// a new batch to be generated if that happens.

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE = 'https://loyalty.woowpay.mn';

module.exports = (req, res) => {
  const prize = typeof req.query.prize === 'string' ? req.query.prize : '';
  const labelRaw = typeof req.query.label === 'string' ? req.query.label : '';
  const label = labelRaw.slice(0, 80) || 'Азаа туршаарай!';

  const image = UUID_RE.test(prize)
    ? `${SITE}/og-prizes/${prize}.png`
    : `${SITE}/og-cover.png`;

  const title = labelRaw ? `Би хожлоо: ${label} 🎉` : 'WoowPay Loyalty — Азаа туршаарай!';

  const html = `<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="WoowPay-н хүрдэн урамшуулал — та ч бас азаа туршаарай!">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="mn_MN">
<meta property="og:site_name" content="WoowPay Loyalty">
<meta http-equiv="refresh" content="0;url=${SITE}/">
<title>${escapeHtml(title)}</title>
</head><body>
<script>location.replace(${JSON.stringify(SITE + '/')});</script>
<p>WoowPay Loyalty руу шилжиж байна... <a href="${SITE}/">Энд дарна уу</a></p>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(html);
};
