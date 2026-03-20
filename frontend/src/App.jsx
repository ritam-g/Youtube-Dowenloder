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

// Hardcoded RapidAPI Config (Frontend Only) - FIXED HOST
const RAPIDAPI_KEY = '072221c35emsh1a9115ed30ca497p1a9647jsn8dbcd9461f0d';
const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';

const FALLBACK_IDS = ["dQw4w9WgXcQ", "kJQP7kiw5Fk", "f3zHina9MTo", "Bg9bVjDUODA"];

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
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

  const saveToHistory = (video) => {
    const newHistory = [
      { ...video, id: video.videoId, timestamp: new Date().toISOString() },
      ...history.filter(h => h.id !== video.videoId).slice(0, 5)
    ];
    setHistory(newHistory);
    localStorage.setItem('tf_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tf_history');
  };

  const extractVideoId = (urlStr) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = urlStr.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideoInfo = async (e, customId = null) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    let videoId = customId || extractVideoId(url);
    let usedFallback = false;

    if (!videoId && !customId) {
      videoId = FALLBACK_IDS[Math.floor(Math.random() * FALLBACK_IDS.length)];
      usedFallback = true;
      setInfoMessage('Invalid URL, showing a random video instead');
    }

    try {
      // Step: Fetch Video Details from the NEW provider
      const options = {
        method: 'GET',
        url: `https://${RAPIDAPI_HOST}/v2/video/details`,
        params: { videoId: videoId }, // Specifically videoId for this host
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      };

      const response = await axios.request(options);
      const data = response.data;

      if (!data || (!data.title && !data.videoId)) {
          throw new Error('API returned empty or invalid data structure.');
      }

      // Consolidate formats from both videos and audios if available in this API
      const videoItems = data.videos?.items || [];
      const audioItems = data.audios?.items || [];
      const allItems = [...videoItems, ...audioItems];

      const mappedData = {
        videoId: (data.videoId || videoId).toString(),
        title: (data.title || 'YouTube Video').toString(),
        thumbnail: data.thumbnails?.[data.thumbnails?.length - 1]?.url || data.thumbnail || '',
        duration: parseInt(data.lengthSeconds || 0),
        views: data.viewCount || 0,
        publishDate: (data.publishDate || '').toString(),
        channelTitle: (data.author?.name || data.author || 'YouTube Channel').toString(),
        formats: allItems.map(f => ({
            quality: f.quality || f.qualityLabel || (f.mimeType?.includes('audio') ? 'Audio' : 'Standard'),
            url: f.url,
            mimeType: f.mimeType,
            hasVideo: !!(f.width || f.height || f.quality || !f.mimeType?.includes('audio')),
            hasAudio: !!(f.audioBitrate || f.bitrate || f.mimeType?.includes('audio')),
            fileSize: f.sizeText || (f.contentLength ? (parseInt(f.contentLength) / (1024 * 1024)).toFixed(2) + ' MB' : 'Download')
        })).slice(0, 20)
      };

      setVideoInfo(mappedData);
      saveToHistory({ title: mappedData.title, videoId: mappedData.videoId });
      if (usedFallback) setUrl(`https://www.youtube.com/watch?v=${videoId}`);

    } catch (err) {
      console.error('Fetch error:', err);
      
      if (err.response?.status === 429) {
          setError('Rate limit exceeded on RapidAPI.');
          fetchVideoInfo(null, FALLBACK_IDS[0]); 
          return;
      }

      if (!usedFallback) {
         const fallbackId = FALLBACK_IDS[Math.floor(Math.random() * FALLBACK_IDS.length)];
         setInfoMessage('Primary API failed, attempting fallback pulsar...');
         fetchVideoInfo(null, fallbackId);
      } else {
         setError('Connection failed. Please verify your RapidAPI key and subscription status.');
      }
    } finally {
      if (!customId) setLoading(false);
    }
  };

  const handleDownload = async (formatUrl, quality) => {
    if (!formatUrl) {
        setError('Direct download not supported, opening video instead');
        return;
    }
    window.open(formatUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch(e) { return dateString; }
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

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
              <span>Full Access</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Media Engine</span>
            </div>
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95">
            <Github className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-bounce-slow">
              <Sparkles className="w-3 h-3" />
              <span>PREMIUM PULSAR DOWNLOADER</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] lg:leading-[0.85]">
              ULTIMATE <br />
              <span className="gradient-text">VIDEO ENGINE.</span>
            </h1>
          </motion.div>

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
                <span className="hidden sm:inline text-lg">{loading ? 'Acquiring...' : 'Analyze'}</span>
              </button>
            </form>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 opacity-0 group-focus-within:opacity-100 blur-2xl transition-opacity duration-700 -z-10 rounded-[2.5rem]" />
          </motion.div>
        </section>

        <AnimatePresence>
          {(error || infoMessage) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-4 border px-8 py-5 rounded-3xl mb-12 max-w-3xl mx-auto ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'}`}
            >
              <div className={`p-2 rounded-full ${error ? 'bg-red-500/20' : 'bg-primary/20'}`}>
                {error ? <AlertCircle className="w-6 h-6 shrink-0" /> : <Sparkles className="w-6 h-6 shrink-0" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-0.5">{error ? 'System Status' : 'Action Log'}</h4>
                <p className="text-sm opacity-80">{error || infoMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
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
                          {formatDuration(videoInfo.duration)}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Engine Sync Success</span>
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
                          {videoInfo.title}
                        </h2>
                        
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-primary italic">
                              {videoInfo.channelTitle?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 font-bold uppercase">Artist / Channel</p>
                              <p className="text-sm font-medium">{videoInfo.channelTitle}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                            <div>
                               <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Impact</p>
                               <div className="flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4 text-neutral-500" />
                                <span>{formatViews(videoInfo.views)}</span>
                              </div>
                            </div>
                            <div>
                               <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Timestamp</p>
                               <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-neutral-500" />
                                <span>{formatDate(videoInfo.publishDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                        <div className="space-y-3 mt-10">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase mb-3">Target Streams</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {videoInfo.formats?.map((format, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleDownload(format.url, format.quality)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group/link text-left"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-neutral-300 group-hover/link:text-primary">{format.quality}</span>
                                  <span className="text-[10px] text-neutral-500 font-medium">{format.hasVideo ? 'MP4 Engine' : 'Audio Engine'} &bull; {format.fileSize}</span>
                                </div>
                                <Download className="w-3.5 h-3.5 text-neutral-600 group-hover/link:text-primary" />
                              </button>
                            ))}
                            {!videoInfo.formats?.length && (
                                <div className="col-span-full p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <p className="text-xs text-neutral-600 italic">No media packets detected.</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              ) : (
                <div className="h-full min-h-[400px] rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-10">
                  <Youtube className="w-10 h-10 text-neutral-600 mb-6" />
                  <h3 className="text-xl font-bold mb-2">Engine Idle</h3>
                  <p className="text-neutral-500 max-w-xs">Waiting for a target URL to synchronize with the Media Downloader API.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <aside className="lg:col-span-1">
            <div className="glass-morphism rounded-[2rem] p-8 border border-white/10 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-neutral-400">
                  <History className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Recent Logs</span>
                </div>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="p-2 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => fetchVideoInfo(null, item.videoId)}
                    className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-left group"
                  >
                    <p className="text-xs font-bold truncate group-hover:text-primary">{item.title}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">ID: {item.videoId}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
