/* eslint-disable no-prototype-builtins */
import { isArrayStream } from './writer.js';
import { NodeReadableStream } from './node-conversions/index.js'
const isNode = typeof globalThis.process === 'object' &&
  typeof globalThis.process.versions === 'object';

/**
 * Check whether data is a Stream, and if so of which type
 * @param {Any} input  data to check
 * @returns {'web'|'node'|'array'|'web-like'|false}
 */
function isStream(input) {
  if (isArrayStream(input)) {
    return 'array';
  }
  if (globalThis.ReadableStream && globalThis.ReadableStream.prototype.isPrototypeOf(input)) {
    return 'web';
  }
  if (NodeReadableStream && NodeReadableStream.prototype.isPrototypeOf(input)) {
    return 'node';
  }
  if (input && input.getReader) {
    return 'web-like';
  }
  return false;
}

/**
 * Check whether data is a Uint8Array
 * @param {Any} input  data to check
 * @returns {Boolean}
 */
function isUint8Array(input) {
  return Uint8Array.prototype.isPrototypeOf(input);
}

/**
 * Concat Uint8Arrays
 * @param {Array<Uint8array>} Array of Uint8Arrays to concatenate
 * @returns {Uint8array} Concatenated array
 */
function concatUint8Array(arrays) {
  if (arrays.length === 1) return arrays[0];

  let totalLength = 0;
  for (let i = 0; i < arrays.length; i++) {
    if (!isUint8Array(arrays[i])) {
      throw new Error('concatUint8Array: Data must be in the form of a Uint8Array');
    }

    totalLength += arrays[i].length;
  }

  const result = new Uint8Array(totalLength);
  let pos = 0;
  arrays.forEach(function (element) {
    result.set(element, pos);
    pos += element.length;
  });

  return result;
}

export { isNode, isStream, isArrayStream, isUint8Array, concatUint8Array };
