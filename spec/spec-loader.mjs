import { helpers } from "./helper.mjs";
import { tests } from "./spec.test.mjs";
import chai from 'https://cdn.jsdelivr.net/npm/chai@5.2.0/+esm' ;
/**
 * @typedef {()=>any} SpecListenr
 */
/** @type {SpecListener[]} */
const _specListeners = [];

/**
 * Adds a listener to be called when the specs are loaded.
 *
 * @param {SpecListener} listener
 */
window.onSpecsReady = function (listener) {
  _specListeners.push(listener);
};

/**
 * Load the helper and the test spec, then notify listeners that we're ready.
 */
chai?.should?.();
window.expect = chai?.expect;

tests(helpers);
for (const listener of _specListeners) {
  listener();
}
