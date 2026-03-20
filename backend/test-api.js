const axios = require('axios');
require('dotenv').config();

const test = async () => {
    const options = {
        method: 'GET',
        url: `https://${process.env.RAPIDAPI_HOST}/video/streaming-data`,
        params: { id: 'dQw4w9WgXcQ' },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST
        }
    };

    try {
        const response = await axios.request(options);
        console.log('SUCCESS:', response.data.streamingData ? 'Found Streams' : 'No Streams');
    } catch (error) {
        console.log('FAILED:', error.response ? error.response.status : error.message, error.response ? error.response.data : '');
    }
};

test();
