const fs = require('fs');

const PERSIST_DIRECTORY = './persisted';

const ensureDirectory = function(dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

const save = function (filename, jsonObject) {
    try {
        ensureDirectory(PERSIST_DIRECTORY);
        fs.writeFileSync(`${PERSIST_DIRECTORY}/${filename}`, JSON.stringify(jsonObject), 'utf-8');
    } catch (e) {
        return false;
    }

    return true;
};


const load = function (filename) {
    try {
        ensureDirectory(PERSIST_DIRECTORY);
        return JSON.parse(fs.readFileSync(`${PERSIST_DIRECTORY}/${filename}`));
    } catch (e) {
        return null;
    }
};

module.exports = {
    save: save,
    load: load
}