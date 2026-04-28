import { kv } from '@vercel/kv';

const SCORES_KEY = 'syndicate_scores_v1';
const MAX_STORED  = 100;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    try {
      const scores = (await kv.get(SCORES_KEY)) || [];
      return res.json(scores.slice(0, 10));
    } catch (e) {
      console.error('scores GET error:', e);
      return res.json([]);
    }
  }

  if (req.method === 'POST') {
    const { seconds } = req.body || {};
    if (!seconds || typeof seconds !== 'number' || seconds <= 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    try {
      const scores = (await kv.get(SCORES_KEY)) || [];
      const entry  = { seconds, date: new Date().toISOString() };
      scores.push(entry);
      scores.sort((a, b) => a.seconds - b.seconds);
      const trimmed = scores.slice(0, MAX_STORED);
      await kv.set(SCORES_KEY, trimmed);
      const rank = trimmed.findIndex(s => s === entry) + 1;
      return res.json({ rank, leaderboard: trimmed.slice(0, 10) });
    } catch (e) {
      console.error('scores POST error:', e);
      return res.status(500).json({ error: 'Storage unavailable', rank: null, leaderboard: [] });
    }
  }

  return res.status(405).end();
}
