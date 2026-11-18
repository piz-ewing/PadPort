'use strict';

require('../../app/src/main/assets/ui-strings.js');
const {installInput, clearInput} = require('./input.cjs');
let state = {revision: 0, paused: false, pads: []};
const {poll, inputMode} = installInput(() => state);
window.PadPortTester = Object.freeze({update(value) { state = value; poll(); }});
window.PadPort = Object.freeze({poll, inputMode, clearInput, pause: clearInput, resume: poll});
window.addEventListener('blur', clearInput);
require('../../app/src/main/assets/runtime-debug.js');
