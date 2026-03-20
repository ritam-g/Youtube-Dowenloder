const { spawn } = require('child_process');
const fs = require('fs');
const path = require("path");

const checkPaths = [
    path.join(__dirname, '..', '..', 'yt-dlp'),
    path.join(__dirname, '..', '..', 'yt-dlp.exe'),
    path.join(process.cwd(), 'yt-dlp'),
    path.join(process.cwd(), 'yt-dlp.exe')
];
const ytDlpBinaryPath = checkPaths.find(p => fs.existsSync(p)) || 'yt-dlp';

function getBaseYTDlpArgs(url) {
    const args = [
        url,
        '--dump-json',
        '--skip-download',
        '--no-playlist'
    ];
    if (process.env.COOKIES_PATH) {
        args.push('--cookies', process.env.COOKIES_PATH);
    }
    return args;
}

async function processVideoController(req, res) {
    try {
        const url = req.body.youtubeUrl || req.body.url;

        if (!url) {
            return res.status(400).json({
                message: "Please provide a YouTube URL",
            });
        }

        const args = getBaseYTDlpArgs(url);
        
        // Use native spawn for lightweight, non-blocking execution with explicit timeout
        const ytDlpProcess = spawn(ytDlpBinaryPath, args);
        
        let stdoutData = '';
        let stderrData = '';

        ytDlpProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        ytDlpProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        // 15 seconds strict execution limit enforcing performance optimization
        const timeoutId = setTimeout(() => {
            ytDlpProcess.kill('SIGKILL');
            if (!res.headersSent) {
                res.status(504).json({
                    message: "Process timed out. Connection is slow or blocked.",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please request the transcript manually or upload an audio file."
                });
            }
        }, 15000);

        ytDlpProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            if (res.headersSent) return; // Prevent double sending if timeout already triggered

            if (code !== 0) {
                console.error("[yt-dlp process error]:", stderrData);
                return res.status(500).json({
                    message: "yt-dlp extraction failed",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please upload an audio file instead.",
                    error: stderrData.slice(0, 200)
                });
            }

            try {
                const videoInfo = JSON.parse(stdoutData);
                
                // Extremely cleanly isolate the best audio URL available natively
                const audioFormats = (videoInfo.formats || []).filter(f => f.acodec !== 'none' && f.vcodec === 'none');
                const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

                const captionAvailable = !!(videoInfo.subtitles && Object.keys(videoInfo.subtitles).length > 0) || !!(videoInfo.automatic_captions && Object.keys(videoInfo.automatic_captions).length > 0);

                return res.status(200).json({
                    videoId: videoInfo.id,
                    title: videoInfo.title || 'Unknown',
                    duration: videoInfo.duration,
                    audioUrl: bestAudio ? bestAudio.url : null,
                    captionAvailable: captionAvailable
                });
            } catch (err) {
                console.error("Parse JSON stream error:", err);
                return res.status(500).json({
                    message: "Failed to parse video info",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please upload an audio file instead."
                });
            }
        });

    } catch (error) {
        console.error("processVideoController outer error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            fallbackAction: "upload_audio",
            fallbackMessage: "Please upload an audio file instead."
        });
    }
}

module.exports = {
    processVideoController
};
