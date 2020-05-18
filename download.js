'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const googleDrive = require('./libs/google-drive');
const readData = require('./libs/readData');

const CONTENTS_PATH = path.join(__dirname, './temp/contents.json');
const DOWNLOADED_PATH = path.join(__dirname, './temp/downloaded.json');

const getDrive = async () => {
    return new Promise(resolv => {
        googleDrive(drive => {
            resolv(drive);
        });
    });
};

const getIdFromUrl = url => {
    const match = url.match(/[-\w]{25,}/);
    if(match && match.length > 0) return match[0];
    return null;
}

const getFileInfo = async (drive, id) => {
    return new Promise((resolv, reject) => {
        drive.files.get({
            fileId: id,
            alt: 'json'
        }, (error, res) => {
            if (error) {
                reject(error);
            } else {
                resolv(res.data);
            }

            /*
            { kind: 'drive#file',
            id: '1Bn4b5G1vNwmuTnuQEexh7bHHysAeN7cg',
            name: 'driver.zip',
            mimeType: 'application/x-zip-compressed' }
            */
        });
    });
};

const downloadFile = async (drive, id, filePath) => {
    return new Promise((resolv, reject) => {
        drive.files.get({
            fileId: id,
            alt: 'media'
        }, {
            responseType: 'stream'
        }, (err, res) => {
            if (err) {
                reject(err);
            } else {
                const dest = fs.createWriteStream(path.join(__dirname, 'downloads', filePath));
                res.data
                .on('end', () => {
                    resolv();
                 })
                 .on('error', err => {
                    reject(err);
                 })
                .pipe(dest);
            }
        });
    });
};

const unrar = async (_filePath, password) => {
    console.log('unrar', _filePath);
    const filePath = path.join(__dirname, 'downloads', _filePath);
    const std = spawn('unrar', ['x', filePath, './downloads/', `-p${password}`]);

    std.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    std.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    std.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
};

const downloadFilesProcess = async (drive, contents, downloaded) => {
    for(const info of contents) {
        const url = info.download;
        console.log('Processing:', url);
        const id = getIdFromUrl(url);

        if(downloaded.includes(id)) continue;

        const fileInfo = await getFileInfo(drive, id);
        if (fileInfo) {
            console.log('Downloading:', fileInfo.name);
            await downloadFile(drive, id, fileInfo.name);

            // unrar(fileInfo.name, fileInfo.password);

            downloaded.push(id);

            fs.writeFileSync(DOWNLOADED_PATH, JSON.stringify(downloaded));
        } else {
            console.log('Get info error');
        }
    }
};

(async () => {
    const contents = await readData(CONTENTS_PATH) || [];
    const downloaded = await readData(DOWNLOADED_PATH) || [];
    const drive = await getDrive();
    await downloadFilesProcess(drive, contents, downloaded);
})();