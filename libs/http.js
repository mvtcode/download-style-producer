const axios = require('axios');

const GET = async (url, cookie = {}, referer = '', origin = '') => {
    try {
        const res = await axios.get(url, {
            headers: {
                Cookie: cookie,
                Referer: referer,
                'Content-Type': 'application/json',
                Origin: origin,
                'User-Agent': 'Mozilla/10.0 (Windows NT 10.0) AppleWebKit/538.36 (KHTML, like Gecko) Chrome/69.420 Safari/537.36'
            }
        });
        
        if (res.status !== 200) return null;
    
        return res;
    } catch(e) {
        console.log('Error', url);
    }
};

module.exports = { GET };