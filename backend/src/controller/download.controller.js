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

console.log(`[DEBUG] Resolved yt-dlp path: ${ytDlpBinaryPath}`);
console.log(`[DEBUG] Path exists: ${fs.existsSync(ytDlpBinaryPath)}`);
console.log(`[DEBUG] Platform: ${process.platform}`);

function getBaseYTDlpArgs(url) {
    const args = [
        url,
        '--dump-json',
        '--skip-download',
        '--no-playlist'
    ];
    if (process.env.COOKIES_PATH) {
        args.push('--cookies', process.env.COOKIES_PATH);
    }t
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
        console.log(`[DEBUG] Spawning yt-dlp: ${ytDlpBinaryPath} ${args.join(' ')}`);

        // Use native spawn for lightweight, non-blocking execution with explicit timeout
        const ytDlpProcess = spawn(ytDlpBinaryPath, args);

        ytDlpProcess.on('error', (spawnErr) => {
            console.error('[DEBUG] Spawn error:', spawnErr.message);
            clearTimeout(timeoutId);
            if (!res.headersSent) {
                res.status(500).json({
                    message: `Spawn failed: ${spawnErr.message}`,
                    error: spawnErr.message
                });
            }
        });

        let stdoutData = '';
        let stderrData = '';

        ytDlpProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        ytDlpProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        // 30 seconds timeout temporarily for debugging (was 15s)
        const timeoutId = setTimeout(() => {
            console.log('[DEBUG] Process timeout triggered');
            ytDlpProcess.kill('SIGKILL');
            if (!res.headersSent) {
                res.status(504).json({
                    message: "Process timed out. Connection is slow or blocked.",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please request the transcript manually or upload an audio file."
                });
            }
        }, 30000);

        ytDlpProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            console.log(`[DEBUG] yt-dlp process closed with code: ${code}`);
            console.log(`[DEBUG] stdout length: ${stdoutData.length}`);
            console.log(`[DEBUG] stderr: ${stderrData}`);

            if (res.headersSent) return;

            if (code !== 0) {
                console.error("[yt-dlp process error] Exit code:", code, "STDERR:", stderrData);
                return res.status(500).json({
                    message: "yt-dlp extraction failed",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please upload an audio file instead.",
                    exitCode: code,
                    error: stderrData.slice(0, 500)
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
                console.error("Parse JSON stream error:", err, "STDOUT sample:", stdoutData.slice(0, 500));
                return res.status(500).json({
                    message: "Failed to parse video info",
                    fallbackAction: "upload_audio",
                    fallbackMessage: "Please upload an audio file instead.",
                    stdoutSample: stdoutData.slice(0, 200)
                });
            }
        });

    } catch (error) {
        console.error("[DEBUG] processVideoController outer error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: `Internal Server Error: ${error.message}`,
                error: error.message
            });
        }
    }
}

module.exports = {
    processVideoController
};
