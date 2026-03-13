import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  Youtube, 
  Clock, 
  Eye, 
  Calendar, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Github,
  Moon,
  Zap
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const fetchVideoInfo = async (e) => {
    e?.preventDefault();
    if (!url) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/info`, { url });
      setVideoInfo(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch video information. Please check the URL.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!url) return;
    
    setDownloading(true);
    try {
      // Use window.location.href or a link element for direct streaming download
      // as specified in the actual backend: GET /api/download?url=<video_url>
      const downloadUrl = `${API_BASE_URL}/download?url=${encodeURIComponent(url)}`;
      window.location.href = downloadUrl;
    } catch (err) {
      setError('Download failed. Please try again.');
      console.error('Download error:', err);
    } finally {
      // Since it's a direct stream download, the browser handles it.
      // We'll reset the downloading state after a short delay
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toLocaleString();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center px-4 py-12 md:py-20">
      <div className="hero-glow" />
      
      {/* Navbar Decoration */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-morphism border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Tube<span className="gradient-text">Flow</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Github className="w-5 h-5 opacity-70" />
          </a>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-sm font-medium opacity-80">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>High Speed</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl text-center mt-12"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter">
          Download <span className="gradient-text">Anything</span> <br /> from YouTube
        </h1>
        <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto font-light leading-relaxed">
          The fastest and most elegant way to grab your favorite videos in high quality. Just paste the link and flow.
        </p>

        {/* Search Input Box */}
        <div className="relative group max-w-2xl mx-auto mb-16">
          <form onSubmit={fetchVideoInfo} className="relative z-10">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-5 pl-12 pr-32 text-lg focus:border-primary/50 transition-all outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/90 text-white px-6 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{loading ? 'Fetching...' : 'Fetch'}</span>
            </button>
          </form>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity rounded-3xl" />
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-xl mb-8 max-w-2xl w-full"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Info Results */}
      <AnimatePresence>
        {videoInfo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-4xl"
          >
            <div className="glass-morphism rounded-3xl overflow-hidden grid md:grid-cols-2 gap-8 p-6 md:p-10 border border-white/10 shadow-2xl relative">
              <div className="relative group rounded-2xl overflow-hidden aspect-video">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(videoInfo.duration)}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                      YouTube Video
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-xs text-white/40">HD Optimized</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
                    {videoInfo.title}
                  </h2>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-white/60">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 italic font-serif text-sm">
                        {videoInfo.author?.[0]}
                      </div>
                      <span className="text-sm font-medium">{videoInfo.author}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatViews(videoInfo.views)} views</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(videoInfo.publishDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={downloadVideo}
                    disabled={downloading}
                    className="flex-1 bg-white text-black hover:bg-primary hover:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-white/5 disabled:opacity-70"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Initiating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download Now</span>
                      </>
                    )}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              
              {/* Subtle accent decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-auto pt-20 pb-10 text-center">
        <div className="flex items-center justify-center gap-2 text-white/20 text-sm mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Server Status: Online at localhost:3000</span>
        </div>
        <p className="text-white/20 text-xs tracking-widest uppercase">
          &copy; 2026 TubeFlow Premium. Built for speed.
        </p>
      </footer>
    </div>
  );
}

export default App;
