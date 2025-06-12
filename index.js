const express = require('express');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const videoId = req.query.videoid;
  if (!videoId) return res.status(400).json({ error: 'Missing videoid parameter' });

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  execFile('yt-dlp', ['-j', '--format', 'bestaudio', videoUrl], (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp error:', error);
      return res.status(500).json({ error: 'yt-dlp failed' });
    }
    try {
      const info = JSON.parse(stdout);
      // Find best audio format with m3u8 or fallback
      let audioFormat = info.formats.find(f =>
        (f.protocol === 'm3u8_native' || (f.url && f.url.includes('.m3u8'))) && f.acodec !== 'none'
      ) || info.formats.find(f => f.acodec !== 'none');

      if (!audioFormat) return res.status(404).json({ error: 'No audio format found' });

      res.json({
        videoId,
        audioUrl: audioFormat.url,
        formatId: audioFormat.format_id,
        formatNote: audioFormat.format_note,
        ext: audioFormat.ext,
        protocol: audioFormat.protocol
      });
    } catch (e) {
      console.error('JSON parse error:', e);
      res.status(500).json({ error: 'Failed to parse yt-dlp output' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
