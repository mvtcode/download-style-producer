'use strict';

const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
const $ = require("jquery")(window);
global.document = document;

const { GET } = require('./libs/http');

const LINKS_PATH = path.join(__dirname, './temp/links.json');

(async () => {
    const links = [];

    const getNextPage = async (url, referer) => {
        console.log(url);
        const res = await GET(url, {}, referer, 'http://styleproshow.mov.mn/');
        if (res) {
            const html = res.data;
            const $dom = $(html);

            const listLink = $dom.find('.bocuc_47 .div_noidung .tieude a');
            
            const length = listLink.length;
            if(length > 0) {
                for(let i = 0; i < length; i++) {
                    const a = $(listLink[i]);
                    const url = a.attr('href');
                    if(!links.includes(url)) {
                        links.push(url);
                        console.log(url);
                    } else {
                        console.log('null')
                    }
                }
            }

            const linkNextPage = $dom.find('span.paging a.bieu_tuong_phan_trang[rel="next"]');

            if (linkNextPage.length > 0) {
                const nextUrl = 'http://styleproshow.mov.mn/' + linkNextPage.attr('href');
                await getNextPage(nextUrl, url);
            }
        }
    };

    await getNextPage('http://styleproshow.mov.mn/share-style-proshow-producer-dep-2019-b3.html', 'http://styleproshow.mov.mn');

    fs.writeFileSync(LINKS_PATH, JSON.stringify(links));
})();
