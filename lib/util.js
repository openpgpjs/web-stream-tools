const isNode = typeof global.process === 'object' &&
  typeof global.process.versions === 'object';

const NodeReadableStream = isNode && require('stream').Readable;

/**
 * Check whether data is a Stream, and if so of which type
 * @param {Any} input  data to check
 * @returns {'web'|'node'|false}
 */
function isStream(input) {
  if (ReadableStream.prototype.isPrototypeOf(input)) {
    return 'web';
  }
  if (NodeReadableStream && NodeReadableStream.prototype.isPrototypeOf(input)) {
    return 'node';
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

export { isNode, isStream, isUint8Array, concatUint8Array };
