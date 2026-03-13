// Import spawn from child_process
// spawn is used to run external programs (like yt-dlp.exe) from Node.js
const { spawn } = require("child_process");

// path module helps to create correct file paths in different OS
const path = require("path");


/**
 * =========================================================
 * Controller: Get YouTube Video Information
 * =========================================================
 * This controller does NOT download the video.
 * It only fetches video details like:
 *  - title
 *  - uploader
 *  - duration
 *  - views
 *  - thumbnail
 * 
 * It uses yt-dlp with "--dump-json" to get metadata.
 */

async function downloadUrlController(req, res) {
    try {

        // Extract url from request body
        const { url } = req.body;

        // If user did not send URL → return error
        if (!url) {
            return res.status(400).json({
                message: "Please provide a YouTube URL",
            });
        }

        /**
         * Create full path to yt-dlp executable
         * __dirname = current folder
         * ../../yt-dlp.exe means:
         * go 2 folders up and find yt-dlp.exe
         */
        const ytDlpPath = path.join(__dirname, "../../yt-dlp.exe");

        /**
         * spawn() starts the yt-dlp program
         * 
         * arguments explained:
         * --dump-json → returns video information in JSON format
         * --no-playlist → ensures only single video is processed
         * url → youtube video link
         */
        const ytDlp = spawn(ytDlpPath, [
            "--dump-json",
            "--no-playlist",
            url
        ]);

        // This variable will store stdout output (video JSON info)
        let data = "";

        // This variable will store error logs from yt-dlp
        let stderrData = "";

        /**
         * stdout = normal output from yt-dlp
         * Here yt-dlp prints the video metadata JSON
         */
        ytDlp.stdout.on("data", (chunk) => {
            data += chunk;
        });

        /**
         * stderr = error output
         * If yt-dlp fails it prints errors here
         */
        ytDlp.stderr.on("data", (chunk) => {
            stderrData += chunk;
        });

        /**
         * "close" event triggers when yt-dlp process finishes
         * code = exit code
         * code 0 = success
         * non-zero = error
         */
        ytDlp.on("close", (code) => {

            // If yt-dlp failed
            if (code !== 0) {
                console.error("yt-dlp info stderr:", stderrData);

                return res.status(500).json({
                    message: "Failed to fetch video info",
                    error: stderrData.toString()
                });
            }

            try {

                /**
                 * Convert JSON string output into JS object
                 */
                const videoInfo = JSON.parse(data);

                /**
                 * Extract only the fields we need
                 * (yt-dlp returns a lot more data)
                 */
                const videoDetails = {
                    title: videoInfo.title,
                    author: videoInfo.uploader,
                    duration: videoInfo.duration,
                    views: videoInfo.view_count,
                    thumbnail: videoInfo.thumbnail,
                    publishDate: videoInfo.upload_date,
                };

                // Send response back to client
                res.status(200).json({
                    message: "Video info fetched successfully",
                    data: videoDetails,
                });

            } catch (err) {

                // If JSON parsing fails
                console.error("Parse error:", err);

                res.status(500).json({
                    message: "Failed to parse video info",
                    error: data.toString().slice(0, 1000)
                });
            }
        });

    } catch (error) {

        // If something unexpected happens
        console.error("Info controller error:", error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}


/**
 * =========================================================
 * Controller: Download YouTube Video
 * =========================================================
 * This controller downloads the actual video file
 * and streams it directly to the user.
 * 
 * Important concept used here:
 * STREAMING
 * 
 * Instead of downloading the full video on the server,
 * we pipe yt-dlp output directly to the response.
 */

async function downloadVideoController(req, res) {
    try {

        // URL is sent via query parameter
        const { url } = req.query;

        // If URL not provided
        if (!url) {
            return res.status(400).json({
                message: "Please provide YouTube URL",
            });
        }

        // Path to yt-dlp executable
        const ytDlpPath = path.join(__dirname, "../../yt-dlp.exe");

        /**
         * Set response headers so browser downloads the file
         * instead of displaying it
         */
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=video.mp4"
        );

        // Tell browser the content type
        res.setHeader("Content-Type", "video/mp4");

        /**
         * spawn yt-dlp for downloading video
         * 
         * -f best → best available video quality
         * --no-playlist → download single video only
         * -o - → output video to stdout instead of file
         * url → youtube video link
         */
        const ytDlp = spawn(ytDlpPath, [
            "-f",
            "best",
            "--no-playlist",
            "-o",
            "-",
            url
        ]);

        /**
         * Pipe yt-dlp output directly to HTTP response
         * 
         * yt-dlp downloads video
         * stdout streams video data
         * res sends it to user
         */
        ytDlp.stdout.pipe(res);

        // Capture errors from yt-dlp
        let stderrData = "";

        ytDlp.stderr.on("data", (data) => {
            stderrData += data;

            // Log errors
            console.error("yt-dlp stderr:", data.toString());
        });

        /**
         * When yt-dlp process ends
         */
        ytDlp.on("close", (code) => {

            if (code !== 0) {

                console.error("yt-dlp process exited with code", code);
                console.error("stderr:", stderrData);

                // If headers not already sent
                if (!res.headersSent) {
                    res.status(500).json({
                        message: "Download failed",
                        error: stderrData.toString()
                    });
                }
            }
        });

    } catch (error) {

        console.error("Download error:", error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}


/**
 * Export controllers so routes can use them
 */

module.exports = {
    downloadVideoController,
    downloadUrlController,
};