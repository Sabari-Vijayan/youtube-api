import TranscriptClient from 'youtube-transcript-api';

const client = new TranscriptClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { videoId, language = 'en' } = req.body;

  try {
    await client.ready;
    const transcript = await client.getTranscript(videoId, { languages: [language] });
    res.status(200).json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
