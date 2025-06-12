const express = require('express');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS headers for easy browser testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  const startTime = Date.now();

  const videoId = req.query.videoid;
  console.log(`[${new Date().toISOString()}] Incoming request for videoid:`, videoId);

  if (!videoId) {
    console.log('Missing videoid parameter');
    return res.status(400).json({ error: 'Missing videoid parameter' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('Fetching video info with yt-dlp for URL:', videoUrl);

  execFile('yt-dlp', ['-j', '--format', 'bestaudio', videoUrl], (error, stdout, stderr) => {
    const duration = Date.now() - startTime;
    console.log(`yt-dlp process finished in ${duration}ms`);

    if (error) {
      console.error('yt-dlp execution error:', error);
      console.error('yt-dlp stderr output:', stderr);
      return res.status(500).json({ error: 'yt-dlp failed', details: stderr || error.message });
    }

    if (stderr) {
      console.warn('yt-dlp stderr (non-fatal):', stderr);
    }

    try {
      const info = JSON.parse(stdout);
      console.log('yt-dlp JSON info keys:', Object.keys(info));

      if (!info.formats || info.formats.length === 0) {
        console.log('No formats found in yt-dlp output');
        return res.status(404).json({ error: 'No formats found for this video' });
      }

      // Find best audio format with m3u8 or fallback to any audio
      let audioFormat = info.formats.find(f =>
        (f.protocol === 'm3u8_native' || (f.url && f.url.includes('.m3u8'))) && f.acodec !== 'none'
      );

      if (!audioFormat) {
        audioFormat = info.formats.find(f => f.acodec !== 'none');
      }

      if (!audioFormat) {
        console.log('No suitable audio format found');
        return res.status(404).json({ error: 'No audio format found' });
      }

      console.log('Selected audio format:', {
        formatId: audioFormat.format_id,
        ext: audioFormat.ext,
        protocol: audioFormat.protocol,
        urlSample: audioFormat.url.slice(0, 80) + '...'
      });

      res.json({
        videoId,
        audioUrl: audioFormat.url,
        formatId: audioFormat.format_id,
        formatNote: audioFormat.format_note,
        ext: audioFormat.ext,
        protocol: audioFormat.protocol
      });
    } catch (parseError) {
      console.error('Failed to parse yt-dlp output:', parseError);
      console.error('Raw yt-dlp output:', stdout);
      res.status(500).json({ error: 'Failed to parse yt-dlp output', details: parseError.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
