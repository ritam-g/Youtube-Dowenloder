const axios = require('axios');
const { RAPIDAPI_KEY, RAPIDAPI_HOST } = require('../config/env');

const extractVideoId = (url) => {
    // Regex for both standard and shortened YouTube links
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url; // If no id found, try the whole string as fallback
};

const getYouTubeVideoInfo = async (youtubeUrl) => {
    const videoId = extractVideoId(youtubeUrl);
    console.log(`[RapidAPI] Target ID/URL: ${videoId}`);

    const commonHeaders = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
    };

    try {
        // Try streaming-data first (usually includes download URLs)
        const streamOptions = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/video/streaming-data/`,
            params: { id: videoId },
            headers: commonHeaders
        };

        const streamRes = await axios.request(streamOptions);
        
        if (streamRes.data && streamRes.data.streamingData) return streamRes.data;

        // Fallback to details if streaming data is sparse
        const detailOptions = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/video/details/`,
            params: { id: videoId },
            headers: commonHeaders
        };
        const detailRes = await axios.request(detailOptions);
        return detailRes.data;

    } catch (error) {
        console.error('[RapidAPI Service Error]:', error.response?.status, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to analyze video with the provided ID.');
    }
};

module.exports = {
    getYouTubeVideoInfo
};
