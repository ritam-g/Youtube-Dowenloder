require('dotenv').config();

module.exports = {
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
    RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || 'youtube138.p.rapidapi.com',
    PORT: process.env.PORT || 3000
};
