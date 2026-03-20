const axios = require('axios');
const { getYouTubeVideoInfo } = require('../services/rapidapi.service');

const processVideoController = async (req, res) => {
    try {
        const url = req.body.youtubeUrl || req.body.url;

        if (!url) {
            return res.status(400).json({ message: "Please provide a valid YouTube URL" });
        }

        console.log(`[DEBUG] Analyzing via RapidAPI: ${url}`);
        const result = await getYouTubeVideoInfo(url);
        
        if (!result || !result.streamingData) {
            return res.status(500).json({ message: "Failed to retrieve streaming data for this video." });
        }

        const details = result.videoDetails || result;
        const streamingData = result.streamingData;

        // Combine all formats
        const allFormats = [
            ...(streamingData.formats || []),
            ...(streamingData.adaptiveFormats || [])
        ];

        return res.status(200).json({
            videoId: details.videoId || details.id,
            title: details.title || 'YouTube Video',
            thumbnail: details.thumbnail?.thumbnails?.[0]?.url || details.thumbnail?.[0]?.url || '',
            duration: parseInt(details.lengthSeconds || details.duration || 0),
            views: details.viewCount || details.views || 0,
            formats: allFormats.map(f => ({
                quality: f.qualityLabel || f.quality || 'Standard',
                url: f.url,
                mimeType: f.mimeType,
                hasVideo: !!(f.width || f.height),
                hasAudio: !!(f.audioBitrate || f.bitrate || f.mimeType?.includes('audio')),
                fileSize: f.contentLength ? (parseInt(f.contentLength) / (1024 * 1024)).toFixed(2) + ' MB' : 'Link'
            })).slice(0, 15)
        });

    } catch (error) {
        console.error("[DEBUG] Controller error:", error.message);
        return res.status(500).json({ message: `Service Error: ${error.message}` });
    }
};

const downloadVideoController = async (req, res) => {
    try {
        const { url, title } = req.query;
        if (!url) return res.status(400).send("No URL provided");

        console.log(`[DEBUG] Starting stream download for: ${title}`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        const filename = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4` : 'video.mp4';

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');

        response.data.pipe(res);
    } catch (error) {
        console.error("[DEBUG] Download stream error:", error.message);
        res.status(500).send("Failed to stream video");
    }
};

module.exports = {
    processVideoController,
    downloadVideoController
};
