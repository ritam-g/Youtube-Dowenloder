// Import yt-dlp-wrap (corrected import for ESM/CJS compatibility)
// Auto-downloads correct binary (Windows/Linux) for Render compatibility
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');

// Utility for video info
const path = require("path");

const checkPaths = [
    path.join(__dirname, '..', '..', 'yt-dlp'),
    path.join(__dirname, '..', '..', 'yt-dlp.exe'),
    path.join(process.cwd(), 'yt-dlp'),
    path.join(process.cwd(), 'yt-dlp.exe')
];
const ytDlpBinaryPath = checkPaths.find(p => fs.existsSync(p)) || 'yt-dlp';

/**
 * Helper to build standard yt-dlp arguments including cookies if configured
 */
function getBaseYTDlpArgs(url) {
    const args = [url];
    // On Render, we can upload a cookies.txt as a secret file and set COOKIES_PATH=/etc/secrets/cookies.txt
    if (process.env.COOKIES_PATH) {
        args.push('--cookies', process.env.COOKIES_PATH);
    }
    return args;
}

/**
 * =========================================================
 * Controller: Get YouTube Video Information
 * =========================================================
 */
async function downloadUrlController(req, res) {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                message: "Please provide a YouTube URL",
            });
        }

        // Create yt-dlp-wrap instance pointing directly to our binary
        const ytDlpWrap = new YTDlpWrap(ytDlpBinaryPath);

        try {
            // Include cookies logic for protected fetch
            const args = [
                ...getBaseYTDlpArgs(url),
                '-j', // --dump-json
                '--no-playlist'
            ];

            let stdout = await ytDlpWrap.execPromise(args);
            const videoInfo = JSON.parse(stdout);

            // Extract needed fields (with fallbacks)
            const videoDetails = {
                title: videoInfo.title || 'Unknown',
                author: videoInfo.uploader || videoInfo.channel || 'Unknown',
                duration: videoInfo.duration,
                views: videoInfo.view_count,
                thumbnail: videoInfo.thumbnail,
                publishDate: videoInfo.upload_date,
            };

            res.status(200).json({
                message: "Video info fetched successfully",
                data: videoDetails,
            });

        } catch (error) {
            console.error("yt-dlp info error:", error.message);
            res.status(500).json({
                message: "Failed to fetch video info. It may require cookies.",
                error: error.message
            });
        }

    } catch (error) {
        console.error("Info controller error:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

/**
 * =========================================================
 * Controller: Download YouTube Video (Stream)
 * =========================================================
 */
async function downloadVideoController(req, res) {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                message: "Please provide YouTube URL",
            });
        }

        // Set download headers
        res.setHeader("Content-Disposition", "attachment; filename=video.mp4");
        res.setHeader("Content-Type", "video/mp4");

        // Create yt-dlp-wrap instance
        const ytDlpWrap = new YTDlpWrap(ytDlpBinaryPath);

        try {
            const args = [
                ...getBaseYTDlpArgs(url),
                "-f", "best[ext=mp4]/best",
                "--no-playlist",
                "-o", "-"
            ];

            // Create readable stream and pipe to response
            const videoStream = ytDlpWrap.execStream(args);

            videoStream.pipe(res);

            videoStream.on('error', (error) => {
                console.error("Stream error:", error.message);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Stream failed", error: error.message });
                }
            });

            videoStream.on('close', () => {
                console.log("Download stream closed");
            });

        } catch (error) {
            console.error("yt-dlp download error:", error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    message: "Download failed",
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error("Download controller error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Internal Server Error",
            });
        }
    }
}

module.exports = {
    downloadVideoController,
    downloadUrlController,
};
