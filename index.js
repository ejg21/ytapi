const express = require('express');
const ytDlp = require('yt-dlp').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const videoId = req.query.videoid;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoid parameter' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Get video info with yt-dlp npm package
    const info = await ytDlp(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      format: 'bestaudio'
    });

    if (!info || !info.formats || info.formats.length === 0) {
      return res.status(404).json({ error: 'No formats found for this video' });
    }

    // Find best audio format with m3u8 protocol or URL containing '.m3u8'
    let audioFormat = info.formats.find(f =>
      (f.protocol === 'm3u8_native' || (f.url && f.url.includes('.m3u8'))) && f.acodec !== 'none'
    );

    // fallback to any best audio format
    if (!audioFormat) {
      audioFormat = info.formats.find(f => f.acodec !== 'none');
    }

    if (!audioFormat) {
      return res.status(404).json({ error: 'No audio format found' });
    }

    res.json({
      videoId,
      audioUrl: audioFormat.url,
      formatId: audioFormat.format_id,
      formatNote: audioFormat.format_note,
      ext: audioFormat.ext,
      protocol: audioFormat.protocol
    });
  } catch (error) {
    console.error('yt-dlp error:', error);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
