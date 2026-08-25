export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(55000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // テキスト部分だけ抽出してフロントに返す
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter(p => typeof p.text === 'string')
      .map(p => p.text)
      .join('');

    console.log('[gemini] raw text:', text.slice(0, 500));

    return res.status(200).json({ text });

  } catch (error) {
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ error: '処理に時間がかかっています。もう一度お試しください。' });
    }
    return res.status(500).json({ error: error.message });
  }
}
