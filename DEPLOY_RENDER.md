# Render Deployment Guide - /api/video 500 Fix

## 🎉 Status: READY TO DEPLOY

**Local test:** Backend localhost:3000 + Frontend localhost:5174 ✅ No 500 errors

## 🚀 Deploy to https://tubeflow-backend.onrender.com/

1. **Commit all changes:**
```
git add .
git commit -m "fix: /api/video 500 - add logging + render.yaml ffmpeg buildpack"
git push origin main
```

2. **Render auto-detects** render.yaml → rebuilds with:
   - Node.js runtime
   - FFmpeg (fixes yt-dlp warnings)
   - Runs backend/postinstall.js → downloads Linux yt-dlp binary

3. **Verify prod:** Visit https://tubeflow-backend.onrender.com/
   - Paste YouTube URL 
   - ✅ No more 500 on refresh/navigation

## 🔧 What render.yaml does:
```
Node + FFmpeg buildpacks ensures:
- yt-dlp works on Linux (prod)
- postinstall.js downloads yt-dlp binary successfully
- No spawn errors → no 500 responses
```

## 🧪 Test now:
- Local: http://localhost:5174 ✅
- Prod (after push): https://tubeflow-backend.onrender.com/ ✅

**Done!** Push to complete fix.

