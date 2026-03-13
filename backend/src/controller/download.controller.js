const { spawn } = require("child_process");
const path = require("path");
/**
 * Controller: Get YouTube video info using yt-dlp
 */
async function downloadUrlController(req, res) {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                message: "Please provide a YouTube URL",
            });
        }

        const ytDlpPath = path.join(__dirname, "../../yt-dlp.exe");

        const ytDlp = spawn(ytDlpPath, [
            "--dump-json",
            "--no-playlist",
            url
        ]);

        let data = "";
        let stderrData = "";

        ytDlp.stdout.on("data", (chunk) => {
            data += chunk;
        });

        ytDlp.stderr.on("data", (chunk) => {
            stderrData += chunk;
        });

        ytDlp.on("close", (code) => {
            if (code !== 0) {
                console.error("yt-dlp info stderr:", stderrData);
                return res.status(500).json({
                    message: "Failed to fetch video info",
                    error: stderrData.toString()
                });
            }

            try {
                const videoInfo = JSON.parse(data);

                const videoDetails = {
                    title: videoInfo.title,
                    author: videoInfo.uploader,
                    duration: videoInfo.duration,
                    views: videoInfo.view_count,
                    thumbnail: videoInfo.thumbnail,
                    publishDate: videoInfo.upload_date,
                };

                res.status(200).json({
                    message: "Video info fetched successfully",
                    data: videoDetails,
                });

            } catch (err) {
                console.error("Parse error:", err);
                res.status(500).json({
                    message: "Failed to parse video info",
                    error: data.toString().slice(0, 1000)
                });
            }
        });

    } catch (error) {
        console.error("Info controller error:", error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}


/**
 * Controller: Download YouTube video using yt-dlp
 */

async function downloadVideoController(req, res) {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                message: "Please provide YouTube URL",
            });
        }

        const ytDlpPath = path.join(__dirname, "../../yt-dlp.exe");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=video.mp4"
        );

        res.setHeader("Content-Type", "video/mp4");

        const ytDlp = spawn(ytDlpPath, [
            "-f",
            "best",
            "--no-playlist",
            "-o",
            "-",
            url
        ]);

        ytDlp.stdout.pipe(res);

        let stderrData = "";
        ytDlp.stderr.on("data", (data) => {
            stderrData += data;
            console.error("yt-dlp stderr:", data.toString());
        });

        ytDlp.on("close", (code) => {
            if (code !== 0) {
                console.error("yt-dlp process exited with code", code);
                console.error("stderr:", stderrData);
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


module.exports = {
    downloadVideoController,
    downloadUrlController,
};