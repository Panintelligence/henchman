
const save = function (filename, jsonObject) {
    try {
        fs.writeFileSync(filename, JSON.stringify(jsonObject), 'utf-8');
    } catch (e) {
        return false;
    }

    return true;
};


const load = function (filename) {
    try {
        return JSON.parse(fs.readFileSync(filename));
    } catch (e) {
        return null;
    }
};

module.exports = {
    save: save,
    load: load
}