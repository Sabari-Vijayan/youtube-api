// File: api/transcript.js
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, language = "en" } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`Fetching transcript for: ${videoId} (${language})`);

    // Your exact working function
    const transcript = await getYoutubeTranscript(videoId, language);
    
    res.status(200).json({
      transcript,
      success: true,
      videoId,
      language
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

// Your working function - EXACTLY as is
async function getYoutubeTranscript(videoId, language = "en") {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const html = await fetch(videoUrl).then((res) => res.text());
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) throw new Error("INNERTUBE_API_KEY not found.");
  const apiKey = apiKeyMatch[1];
  
  const playerData = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId,
      }),
    }
  ).then((res) => res.json());
  
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks) throw new Error("No captions found.");
  const track = tracks.find((t) => t.languageCode === language);
  if (!track) throw new Error(`No captions for language: ${language}`);
  
  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");
  const xml = await fetch(baseUrl).then((res) => res.text());
  const parsed = await parseStringPromise(xml);
  const transcript = parsed.transcript.text.map((entry) => ({
    caption: entry._,
    startTime: parseFloat(entry.$.start),
    endTime: parseFloat(entry.$.start) + parseFloat(entry.$.dur),
  }));
  
  return transcript;
}
