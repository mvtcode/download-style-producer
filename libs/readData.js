const fs = require('fs');

module.exports = async filePath => {
    return new Promise(resolv => {
        fs.readFile(filePath, (err, data) => {
            if (err) resolv(null);
            else resolv(JSON.parse(data));
        });
    });
};