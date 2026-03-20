const https = require('https');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
let downloadUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

// Define the correct binary structure based on the operating system
if (platform === 'win32') {
    downloadUrl += ".exe";
} else if (platform === 'darwin') {
    downloadUrl += "_macos";
}

const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const destPath = path.join(__dirname, binaryName);

console.log(`Setting up your server... Downloading latest yt-dlp binary from ${downloadUrl}`);

https.get(downloadUrl, (res) => {
    // Handle the redirect natively 
    if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (response) => {
            const file = fs.createWriteStream(destPath);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log("yt-dlp downloaded and installed securely!");
                
                // Allow Render's Linux environment to execute the binary
                if (platform !== 'win32') {
                    fs.chmodSync(destPath, '755');
                    console.log("Execution permissions granted cleanly.");
                }
            });
        }).on('error', (err) => {
            console.error("Failed downloading redirected binary: ", err);
            process.exit(1);
        });
    }
}).on('error', (err) => {
    console.error("Initial pipeline connection faltered: ", err);
    process.exit(1);
});
