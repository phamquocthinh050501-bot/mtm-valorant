export default async function handler(req, res) {
  const path = String(req.query.path || '');
  if (!/^v1\/(account|mmr)\//.test(path)) return res.status(400).json({ error: 'bad path' });

  const r = await fetch(`https://api.henrikdev.xyz/valorant/${path}`, {
    headers: { Authorization: process.env.HENRIK_KEY },
  });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(r.status).send(await r.text());
}
