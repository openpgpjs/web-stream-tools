import { isStream, isArrayStream, isUint8Array, concatUint8Array } from './util.js';
import { Reader, externalBuffer } from './reader.js';
import { ArrayStream, Writer } from './writer.js';

/**
 * Convert data to Stream
 * @param {ReadableStream|Uint8array|String} input  data to convert
 * @returns {ReadableStream} Converted data
 */
function toStream(input) {
  let streamType = isStream(input);
  if (streamType) {
    return input;
  }
  return new ReadableStream({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    }
  });
}

/**
 * Convert non-streamed data to ArrayStream; this is a noop if `input` is already a stream.
 * @param {Object} input  data to convert
 * @returns {ArrayStream} Converted data
 */
function toArrayStream(input) {
  if (isStream(input)) {
    return input;
  }
  const stream = new ArrayStream();
  (async () => {
    const writer = getWriter(stream);
    await writer.write(input);
    await writer.close();
  })();
  return stream;
}

/**
 * Concat a list of Uint8Arrays, Strings or Streams
 * The caller should not mix Uint8Arrays with Strings, but may mix Streams with non-Streams.
 * @param {Array<Uint8array|String|ReadableStream>} Array of Uint8Arrays/Strings/Streams to concatenate
 * @returns {Uint8array|String|ReadableStream} Concatenated array
 */
function concat(list) {
  if (list.some(stream => isStream(stream) && !isArrayStream(stream))) {
    return concatStream(list);
  }
  if (list.some(stream => isArrayStream(stream))) {
    return concatArrayStream(list);
  }
  if (typeof list[0] === 'string') {
    return list.join('');
  }
  return concatUint8Array(list);
}

/**
 * Concat a list of Streams
 * @param {Array<ReadableStream|Uint8array|String>} list  Array of Uint8Arrays/Strings/Streams to concatenate
 * @returns {ReadableStream} Concatenated list
 */
function concatStream(list) {
  list = list.map(toStream);
  const transform = transformWithCancel(async function(reason) {
    await Promise.all(transforms.map(stream => cancel(stream, reason)));
  });
  let prev = Promise.resolve();
  const transforms = list.map((stream, i) => transformPair(stream, (readable, writable) => {
    prev = prev.then(() => pipe(readable, transform.writable, {
      preventClose: i !== list.length - 1
    }));
    return prev;
  }));
  return transform.readable;
}

/**
 * Concat a list of ArrayStreams
 * @param {Array<ArrayStream|Uint8array|String>} list  Array of Uint8Arrays/Strings/ArrayStreams to concatenate
 * @returns {ArrayStream} Concatenated streams
 */
function concatArrayStream(list) {
  const result = new ArrayStream();
  let prev = Promise.resolve();
  list.forEach((stream, i) => {
    prev = prev.then(() => pipe(stream, result, {
      preventClose: i !== list.length - 1
    }));
    return prev;
  });
  return result;
}

/**
 * Pipe a readable stream to a writable stream. Don't throw on input stream errors, but forward them to the output stream.
 * @param {ReadableStream|Uint8array|String} input
 * @param {WritableStream} target
 * @param {Object} (optional) options
 * @returns {Promise<undefined>} Promise indicating when piping has finished (input stream closed or errored)
 * @async
 */
async function pipe(input, target, {
  preventClose = false,
  preventAbort = false,
  preventCancel = false
} = {}) {
  if (isStream(input) && !isArrayStream(input)) {
    input = toStream(input);
    try {
      if (input[externalBuffer]) {
        const writer = getWriter(target);
        for (let i = 0; i < input[externalBuffer].length; i++) {
          await writer.ready;
          await writer.write(input[externalBuffer][i]);
        }
        writer.releaseLock();
      }
      await input.pipeTo(target, {
        preventClose,
        preventAbort,
        preventCancel
      });
    } catch(e) {}
    return;
  }
  input = toArrayStream(input);
  const reader = getReader(input);
  const writer = getWriter(target);
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await writer.ready;
      const { done, value } = await reader.read();
      if (done) {
        if (!preventClose) await writer.close();
        break;
      }
      await writer.write(value);
    }
  } catch (e) {
    if (!preventAbort) await writer.abort(e);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}

/**
 * Pipe a readable stream through a transform stream.
 * @param {ReadableStream|Uint8array|String} input
 * @param {Object} (optional) options
 * @returns {ReadableStream} transformed stream
 */
function transformRaw(input, options) {
  const transformStream = new TransformStream(options);
  pipe(input, transformStream.writable);
  return transformStream.readable;
}

/**
 * Create a cancelable TransformStream.
 * @param {Function} cancel
 * @returns {TransformStream}
 */
function transformWithCancel(customCancel) {
  let pulled = false;
  let cancelled = false;
  let backpressureChangePromiseResolve, backpressureChangePromiseReject;
  let outputController;
  return {
    readable: new ReadableStream({
      start(controller) {
        outputController = controller;
      },
      pull() {
        if (backpressureChangePromiseResolve) {
          backpressureChangePromiseResolve();
        } else {
          pulled = true;
        }
      },
      async cancel(reason) {
        cancelled = true;
        if (customCancel) {
          await customCancel(reason);
        }
        if (backpressureChangePromiseReject) {
          backpressureChangePromiseReject(reason);
        }
      }
    }, {highWaterMark: 0}),
    writable: new WritableStream({
      write: async function(chunk) {
        if (cancelled) {
          throw new Error('Stream is cancelled');
        }
        outputController.enqueue(chunk);
        if (!pulled) {
          await new Promise((resolve, reject) => {
            backpressureChangePromiseResolve = resolve;
            backpressureChangePromiseReject = reject;
          });
          backpressureChangePromiseResolve = null;
          backpressureChangePromiseReject = null;
        } else {
          pulled = false;
        }
      },
      close: outputController.close.bind(outputController),
      abort: outputController.error.bind(outputController)
    })
  };
}

/**
 * Transform a stream using helper functions which are called on each chunk, and on stream close, respectively.
 * @param {ReadableStream|Uint8array|String} input
 * @param {Function} process
 * @param {Function} finish
 * @returns {ReadableStream|Uint8array|String}
 */
function transform(input, process = () => undefined, finish = () => undefined) {
  if (isArrayStream(input)) {
    const output = new ArrayStream();
    (async () => {
      const writer = getWriter(output);
      try {
        const data = await readToEnd(input);
        const result1 = process(data);
        const result2 = finish();
        let result;
        if (result1 !== undefined && result2 !== undefined) result = concat([result1, result2]);
        else result = result1 !== undefined ? result1 : result2;
        await writer.write(result);
        await writer.close();
      } catch (e) {
        await writer.abort(e);
      }
    })();
    return output;
  }
  if (isStream(input)) {
    return transformRaw(input, {
      async transform(value, controller) {
        try {
          const result = await process(value);
          if (result !== undefined) controller.enqueue(result);
        } catch(e) {
          controller.error(e);
        }
      },
      async flush(controller) {
        try {
          const result = await finish();
          if (result !== undefined) controller.enqueue(result);
        } catch(e) {
          controller.error(e);
        }
      }
    });
  }
  const result1 = process(input);
  const result2 = finish();
  if (result1 !== undefined && result2 !== undefined) return concat([result1, result2]);
  return result1 !== undefined ? result1 : result2;
}

/**
 * Transform a stream using a helper function which is passed a readable and a writable stream.
 *   This function also maintains the possibility to cancel the input stream,
 *   and does so on cancelation of the output stream, despite cancelation
 *   normally being impossible when the input stream is being read from.
 * @param {ReadableStream|Uint8array|String} input
 * @param {Function} fn
 * @returns {ReadableStream}
 */
function transformPair(input, fn) {
  if (isStream(input) && !isArrayStream(input)) {
    let incomingTransformController;
    const incoming = new TransformStream({
      start(controller) {
        incomingTransformController = controller;
      }
    });

    const pipeDonePromise = pipe(input, incoming.writable);

    const outgoing = transformWithCancel(async function(reason) {
      incomingTransformController.error(reason);
      await pipeDonePromise;
      await new Promise(setTimeout);
    });
    fn(incoming.readable, outgoing.writable);
    return outgoing.readable;
  }
  input = toArrayStream(input);
  const output = new ArrayStream();
  fn(input, output);
  return output;
}

/**
 * Parse a stream using a helper function which is passed a Reader.
 *   The reader additionally has a remainder() method which returns a
 *   stream pointing to the remainder of input, and is linked to input
 *   for cancelation.
 * @param {ReadableStream|Uint8array|String} input
 * @param {Function} fn
 * @returns {Any} the return value of fn()
 */
function parse(input, fn) {
  let returnValue;
  const transformed = transformPair(input, (readable, writable) => {
    const reader = getReader(readable);
    reader.remainder = () => {
      reader.releaseLock();
      pipe(readable, writable);
      return transformed;
    };
    returnValue = fn(reader);
  });
  return returnValue;
}

/**
 * Tee a Stream for reading it twice. The input stream can no longer be read after tee()ing.
 *   Reading either of the two returned streams will pull from the input stream.
 *   The input stream will only be canceled if both of the returned streams are canceled.
 * @param {ReadableStream|Uint8array|String} input
 * @returns {Array<ReadableStream|Uint8array|String>} array containing two copies of input
 */
function tee(input) {
  if (isArrayStream(input)) {
    throw new Error('ArrayStream cannot be tee()d, use clone() instead');
  }
  if (isStream(input)) {
    const teed = toStream(input).tee();
    teed[0][externalBuffer] = teed[1][externalBuffer] = input[externalBuffer];
    return teed;
  }
  return [slice(input), slice(input)];
}

/**
 * Clone a Stream for reading it twice. The input stream can still be read after clone()ing.
 *   Reading from the clone will pull from the input stream.
 *   The input stream will only be canceled if both the clone and the input stream are canceled.
 * @param {ReadableStream|Uint8array|String} input
 * @returns {ReadableStream|Uint8array|String} cloned input
 */
function clone(input) {
  if (isArrayStream(input)) {
    return input.clone();
  }
  if (isStream(input)) {
    const teed = tee(input);
    overwrite(input, teed[0]);
    return teed[1];
  }
  return slice(input);
}

/**
 * Clone a Stream for reading it twice. Data will arrive at the same rate as the input stream is being read.
 *   Reading from the clone will NOT pull from the input stream. Data only arrives when reading the input stream.
 *   The input stream will NOT be canceled if the clone is canceled, only if the input stream are canceled.
 *   If the input stream is canceled, the clone will be errored.
 * @param {ReadableStream|Uint8array|String} input
 * @returns {ReadableStream|Uint8array|String} cloned input
 */
function passiveClone(input) {
  if (isArrayStream(input)) {
    return clone(input);
  }
  if (isStream(input)) {
    return new ReadableStream({
      start(controller) {
        const transformed = transformPair(input, async (readable, writable) => {
          const reader = getReader(readable);
          const writer = getWriter(writable);
          try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
              await writer.ready;
              const { done, value } = await reader.read();
              if (done) {
                try { controller.close(); } catch(e) {}
                await writer.close();
                return;
              }
              try { controller.enqueue(value); } catch(e) {}
              await writer.write(value);
            }
          } catch(e) {
            controller.error(e);
            await writer.abort(e);
          }
        });
        overwrite(input, transformed);
      }
    });
  }
  return slice(input);
}

/**
 * Modify a stream object to point to a different stream object.
 *   This is used internally by clone() and passiveClone() to provide an abstraction over tee().
 * @param {ReadableStream} input
 * @param {ReadableStream} clone
 */
function overwrite(input, clone) {
  // Overwrite input.getReader, input.locked, etc to point to clone
  Object.entries(Object.getOwnPropertyDescriptors(input.constructor.prototype)).forEach(([name, descriptor]) => {
    if (name === 'constructor') {
      return;
    }
    if (descriptor.value) {
      descriptor.value = descriptor.value.bind(clone);
    } else {
      descriptor.get = descriptor.get.bind(clone);
    }
    Object.defineProperty(input, name, descriptor);
  });
}

/**
 * Return a stream pointing to a part of the input stream.
 * @param {ReadableStream|Uint8array|String} input
 * @returns {ReadableStream|Uint8array|String} clone
 */
function slice(input, begin=0, end=Infinity) {
  if (isArrayStream(input)) {
    throw new Error('Not implemented');
  }
  if (isStream(input)) {
    if (begin >= 0 && end >= 0) {
      let bytesRead = 0;
      return transformRaw(input, {
        transform(value, controller) {
          if (bytesRead < end) {
            if (bytesRead + value.length >= begin) {
              controller.enqueue(slice(value, Math.max(begin - bytesRead, 0), end - bytesRead));
            }
            bytesRead += value.length;
          } else {
            controller.terminate();
          }
        }
      });
    }
    if (begin < 0 && (end < 0 || end === Infinity)) {
      let lastBytes = [];
      return transform(input, value => {
        if (value.length >= -begin) lastBytes = [value];
        else lastBytes.push(value);
      }, () => slice(concat(lastBytes), begin, end));
    }
    if (begin === 0 && end < 0) {
      let lastBytes;
      return transform(input, value => {
        const returnValue = lastBytes ? concat([lastBytes, value]) : value;
        if (returnValue.length >= -end) {
          lastBytes = slice(returnValue, end);
          return slice(returnValue, begin, end);
        }
          lastBytes = returnValue;
      });
    }
    console.warn(`stream.slice(input, ${begin}, ${end}) not implemented efficiently.`);
    return fromAsync(async () => slice(await readToEnd(input), begin, end));
  }
  if (input[externalBuffer]) {
    input = concat(input[externalBuffer].concat([input]));
  }
  if (isUint8Array(input)) {
    return input.subarray(begin, end === Infinity ? input.length : end);
  }
  return input.slice(begin, end);
}

/**
 * Read a stream to the end and return its contents, concatenated by the join function (defaults to concat).
 * @param {ReadableStream|Uint8array|String} input
 * @param {Function} join
 * @returns {Promise<Uint8array|String|Any>} the return value of join()
 * @async
 */
async function readToEnd(input, join=concat) {
  if (isArrayStream(input)) {
    return input.readToEnd(join);
  }
  if (isStream(input)) {
    return getReader(input).readToEnd(join);
  }
  return input;
}

/**
 * Cancel a stream.
 * @param {ReadableStream|Uint8array|String} input
 * @param {Any} reason
 * @returns {Promise<Any>} indicates when the stream has been canceled
 * @async
 */
async function cancel(input, reason) {
  if (isStream(input)) {
    if (input.cancel) {
      const cancelled = await input.cancel(reason);
      // the stream is not always cancelled at this point, so we wait some more
      await new Promise(setTimeout);
      return cancelled;
    }
    if (input.destroy) {
      input.destroy(reason);
      await new Promise(setTimeout);
      return reason;
    }
  }
}

/**
 * Convert an async function to an ArrayStream. When the function returns, its return value is written to the stream.
 * @param {Function} fn
 * @returns {ArrayStream}
 */
function fromAsync(fn) {
  const arrayStream = new ArrayStream();
  (async () => {
    const writer = getWriter(arrayStream);
    try {
      await writer.write(await fn());
      await writer.close();
    } catch (e) {
      await writer.abort(e);
    }
  })();
  return arrayStream;
}

/**
 * Get a Reader
 * @param {ReadableStream|Uint8array|String} input
 * @returns {Reader}
 */
function getReader(input) {
  return new Reader(input);
}

/**
 * Get a Writer
 * @param {WritableStream} input
 * @returns {Writer}
 */
function getWriter(input) {
  return new Writer(input);
}


export {
  ArrayStream,
  toStream,
  concatStream,
  concat,
  getReader,
  getWriter,
  pipe,
  transformRaw,
  transform,
  transformPair,
  parse,
  clone,
  passiveClone,
  slice,
  readToEnd,
  cancel,
  fromAsync
};
