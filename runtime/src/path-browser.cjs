'use strict';

const uncurry = fn => Function.call.bind(fn);
const primordials = {FunctionPrototypeBind: uncurry(Function.prototype.bind)};
for (const name of ['charCodeAt', 'indexOf', 'lastIndexOf', 'replace', 'slice', 'toLowerCase'])
    primordials['StringPrototype' + name[0].toUpperCase() + name.slice(1)] = uncurry(String.prototype[name]);

function invalid(name, expected) {
    return Object.assign(new TypeError('The "' + name + '" argument must be of type ' + expected), {code: 'ERR_INVALID_ARG_TYPE'});
}

const constants = {};
for (const [name, char] of Object.entries({UPPERCASE_A: 'A', LOWERCASE_A: 'a', UPPERCASE_Z: 'Z', LOWERCASE_Z: 'z',
    DOT: '.', FORWARD_SLASH: '/', BACKWARD_SLASH: String.fromCharCode(92), COLON: ':', QUESTION_MARK: '?'}))
    constants['CHAR_' + name] = char.charCodeAt(0);

const validators = {
    validateString(value, name) { if (typeof value !== 'string') throw invalid(name, 'string'); },
    validateObject(value, name) { if (value === null || typeof value !== 'object' || Array.isArray(value)) throw invalid(name, 'object'); }
};

module.exports = function createPath(process) {
    const module = {exports: {}};
    runPath(module, name => {
        if (name === 'internal/constants') return constants;
        if (name === 'internal/validators') return validators;
        throw new Error('Unknown path dependency: ' + name);
    }, primordials, process);
    return module.exports;
};

function runPath(module, require, primordials, process) {
    __NODE_PATH_SOURCE__
}
