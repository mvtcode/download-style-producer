'use strict';

const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
const $ = require("jquery")(window);
const { GET } = require('./libs/http');
const readData = require('./libs/readData');

global.document = document;

const LINKS_PATH =  path.join(__dirname, './temp/links.json');
const CONTENTS_PATH = path.join(__dirname, './temp/contents.json');

const delay = async ms => {
    return new Promise(resolv => {
        setTimeout(() => {
            resolv();
        }, ms);
    });
};

(async () => {
    const links = await readData(LINKS_PATH) || [];
    const completes = await readData(CONTENTS_PATH) || [];

    const urlComplete = [];
    
    if (completes.length > 0) {
        completes.forEach(_info => {
            if (_info.url) urlComplete.push(_info.url);
        });
    }

    const contents = [];

    if(links.length > 0) {
        for(const url of links) {
            if (urlComplete.includes(url)) continue;
            
            console.log('Processing URL:', url);
            const res = await GET(`http://styleproshow.mov.mn/${url}`);
            
            if (res) {
                const html = res.data;
                const $dom = $(html);

                const title = $dom.find('.bocuc_47 .header_text').text();
                const spans = $dom.find('.bocuc_47 span span');

                let download = '', password = '';
                spans.each((index, span) => {
                    const text = $(span).text();
                    if(text.indexOf('Password:') >= 0) {
                        password = text.replace(/Password:[ ]+/g, '');
                    }

                    if(text.indexOf('download') > 0) {
                        const arr = text.split(/https?/g);
                        if (arr.length === 2) {
                            download = 'https' + arr[1];
                        }
                    }
                });

                contents.push({
                    url, title, download, password
                });

                fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents));
                urlComplete.push(url);
                
                await delay(5000);
            }
        }
    }
})();