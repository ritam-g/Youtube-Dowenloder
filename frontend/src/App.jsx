import React, { useState, useEffect } from 'react';
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
  Zap,
  History,
  Trash2,
  Sparkles,
  ShieldCheck,
  Share2
} from 'lucide-react';

// Using relative API path since frontend and backend are hosted seamlessly together on Render
const API_BASE_URL = '/api';

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('tf_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (video) => {
    const newHistory = [
      { ...video, id: Date.now(), timestamp: new Date().toISOString() },
      ...history.filter(h => h.title !== video.title).slice(0, 5)
    ];
    setHistory(newHistory);
    localStorage.setItem('tf_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tf_history');
  };

  const fetchVideoInfo = async (e, customUrl = null) => {
    e?.preventDefault();
    const targetUrl = customUrl || url;
    
    if (!targetUrl) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    
    // Smooth transition if we already have info
    if (!customUrl) setVideoInfo(null);

    try {
    const response = await axios.post(`${API_BASE_URL}/video`, { youtubeUrl: targetUrl });
      const data = response.data;
      setVideoInfo(data);
      saveToHistory({ title: data.title, id: data.videoId, timestamp: new Date().toISOString() });
      if (customUrl) setUrl(targetUrl);
    } catch (err) {
      const errorMsg = err.response?.data?.fallbackMessage || err.response?.data?.message || 'Failed to analyze link.';
      setError(errorMsg);
      console.error('Fetch error:', err);
      if (err.response?.data?.fallbackAction === 'upload_audio') {
        // Show an explicit message telling the user to upload manually as defined by the backend
        setError('Integration unavailable. Please upload the audio file directly or input transcription manually.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadAudio = () => {
    if (!videoInfo?.audioUrl) {
      setError('Direct audio stream completely unavailable for this video.');
      return;
    }
    // Automatically open the isolated audio track via the public stream URL perfectly formatted by yt-dlp
    window.open(videoInfo.audioUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Handle yt-dlp date format (YYYYMMDD) or ISO
    if (/^\d{8}$/.test(dateString)) {
      return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
    }
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(views);
  };

  return (
    <div className="min-h-screen relative bg-[#0a0a0c] text-neutral-100 selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full glass-morphism border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-md opacity-50 animate-pulse" />
            <div className="relative bg-primary p-2 rounded-xl shadow-lg">
              <Youtube className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="font-bold text-2xl tracking-tight">Tube<span className="gradient-text">Flow</span></span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold opacity-50">v2.0 PRO</span>
        </motion.div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium opacity-60">
            <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Fast</span>
            </div>
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95">
            <Github className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-bounce-slow">
              <Sparkles className="w-3 h-3" />
              <span>AI-POWERED DOWNLOADER</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] lg:leading-[0.85]">
              FASTEST WAY TO <br />
              <span className="gradient-text">GRAB VIDEOS.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-12">
              Premium YouTube video downloading experience. No ads, no trackers, 
              just pure performance delivered to your device in seconds.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto relative group"
          >
            <form onSubmit={fetchVideoInfo} className="relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-6 h-6 text-neutral-500 group-focus-within:text-primary transition-colors duration-500" />
              </div>
              <input
                type="text"
                placeholder="Paste YouTube link here..."
                className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl py-6 pl-16 pr-40 text-xl focus:border-primary/50 focus:bg-white/[0.05] transition-all duration-500 outline-none shadow-2xl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-3 bottom-3 bg-primary hover:bg-primary/90 text-white px-8 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                <span className="hidden sm:inline text-lg">{loading ? 'Fetching...' : 'Analyze'}</span>
              </button>
            </form>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 opacity-0 group-focus-within:opacity-100 blur-2xl transition-opacity duration-700 -z-10 rounded-[2.5rem]" />
          </motion.div>
        </section>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-5 rounded-3xl mb-12 max-w-3xl mx-auto"
            >
              <div className="p-2 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 shrink-0" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-0.5">Integration Error</h4>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Video Result Card */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {videoInfo ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="grid md:grid-cols-12 gap-0">
                    <div className="md:col-span-5 relative group">
                      <img 
                        src={videoInfo.thumbnail} 
                        alt={videoInfo.title} 
                        className="w-full h-full object-cover aspect-video md:aspect-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                         <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {videoInfo.duration || '0:00'}
                        </div>
                        {videoInfo.captionAvailable && (
                          <div className="bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/30 flex items-center gap-2 text-primary">
                            <span>CC</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Content Ready</span>
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-6 hover:text-primary transition-colors cursor-default">
                          {videoInfo.title}
                        </h2>
                        
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-primary">
                              Y
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 font-bold uppercase">Source ID</p>
                              <p className="text-sm font-medium">{videoInfo.videoId}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                            <div>
                               <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Total Impact</p>
                               <div className="flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4 text-neutral-500" />
                                <span>{formatViews(videoInfo.views)} Views</span>
                              </div>
                            </div>
                            <div>
                               <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Release Date</p>
                               <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-neutral-500" />
                                <span>{formatDate(videoInfo.publishDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        <button
                          onClick={downloadAudio}
                          disabled={!videoInfo?.audioUrl}
                          className="flex-1 bg-white text-black hover:bg-neutral-200 py-4.5 rounded-[1.25rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Download className="w-5 h-5" />
                          <span className="uppercase tracking-widest text-sm">Open Target Audio</span>
                        </button>
                        <button className="p-4.5 bg-white/5 hover:bg-white/10 rounded-[1.25rem] transition-all border border-white/10 group">
                          <Share2 className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-10"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Youtube className="w-10 h-10 text-neutral-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Awaiting Stream</h3>
                  <p className="text-neutral-500 max-w-xs">Paste a YouTube URL above to analyze video parameters and generate secure download links.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Sidebar */}
          <aside className="lg:col-span-1">
            <div className="glass-morphism rounded-[2rem] p-8 border border-white/10 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-neutral-400">
                  <History className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Recent Flows</span>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="p-2 hover:text-red-400 transition-colors"
                    title="Clear History"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => fetchVideoInfo(null, `https://www.youtube.com/watch?v=${item.url?.split('v=')[1] || item.title}`)}
                        className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="flex-1 min-w-0 py-2">
                            <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.title}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Video ID: {item.id}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-xs text-neutral-600 font-medium">Your history is clear.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Power User Tip</p>
                   <p className="text-xs text-neutral-400 leading-relaxed">
                     Downloads are processed server-side via yt-dlp to ensure maximum security and quality.
                   </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-30">
            <Youtube className="w-5 h-5" />
            <span className="font-bold text-lg">TubeFlow</span>
          </div>
          
          <div className="flex gap-8 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API Status</a>
          </div>

          <div className="text-neutral-700 text-[10px] font-medium">
            DEPLOYED VIA RENDER &bull; 2026 TUBEFLOW INT.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
