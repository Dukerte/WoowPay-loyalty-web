// Cloudflare Pages Function — same behavior as api/share.js (Vercel),
// served at /api/share. Generates a per-prize Open Graph preview for
// Facebook shares (the crawler doesn't run JS), then redirects real
// visitors to the site. Keep api/share.js until the Vercel project is
// retired; Vercel ignores this folder and Cloudflare ignores /api.

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE = 'https://loyalty.woowpay.mn';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const prize = url.searchParams.get('prize') || '';
  const labelRaw = url.searchParams.get('label') || '';
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

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
