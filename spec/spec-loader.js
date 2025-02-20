/* global chai */
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
import("./helper.mjs").then(
  (helperModule) => {
    chai?.should?.();
    window.expect = chai?.expect;
    import("./spec.test.mjs").then((specModule) => {
      specModule.tests(helperModule.helpers);
      for (const listener of _specListeners) {
        listener();
      }
    });
  
  }
);

