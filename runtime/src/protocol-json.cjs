'use strict';

function createProtocolJSON() {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    try {
        document.documentElement.appendChild(frame);
        const realm = frame.contentWindow;
        const parser = realm.JSON;
        const array = parser.parse('[1,2]');
        const object = parser.parse('{"value":1}');
        const derived = array.filter(() => true).map(value => value);
        const keys = value => {
            const names = [];
            for (const key in value) names.push(key);
            return names.join(',');
        };
        if (realm.Array.prototype === Array.prototype || realm.Object.prototype === Object.prototype ||
            Object.getPrototypeOf(derived) !== realm.Array.prototype ||
            Object.getPrototypeOf(object) !== realm.Object.prototype ||
            keys(array) !== '0,1' || keys(derived) !== '0,1' || keys(object) !== 'value')
            throw new Error('Protocol realm has modified prototypes');
        return {parse: parser.parse.bind(parser)};
    } catch (error) {
        console.warn('Protocol realm initialization failed', error);
        return {parse: JSON.parse.bind(JSON)};
    } finally { frame.remove(); }
}

module.exports = {createProtocolJSON};
