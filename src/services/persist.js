const PERSIST_DIRECTORY = 'persisted';

const ensureDirectory = function() {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

const save = function (filename, jsonObject) {
    try {
        ensureDirectory();
        fs.writeFileSync(`${PERSIST_DIRECTORY}/${filename}`, JSON.stringify(jsonObject), 'utf-8');
    } catch (e) {
        return false;
    }

    return true;
};


const load = function (filename) {
    try {
        ensureDirectory();
        return JSON.parse(fs.readFileSync(`${PERSIST_DIRECTORY}/${filename}`));
    } catch (e) {
        return null;
    }
};

module.exports = {
    save: save,
    load: load
}