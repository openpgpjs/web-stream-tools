const doneWritingPromise = Symbol('doneWritingPromise');
const doneWritingResolve = Symbol('doneWritingResolve');
const doneWritingReject = Symbol('doneWritingReject');

class ArrayStream extends Array {
  constructor() {
    super();
    this[doneWritingPromise] = new Promise((resolve, reject) => {
      this[doneWritingResolve] = resolve;
      this[doneWritingReject] = reject;
    });
    this[doneWritingPromise].catch(() => {});
  }
}

ArrayStream.prototype.getReader = function() {
  return {
    read: async () => {
      await this[doneWritingPromise];
      if (!this.length) {
        return { value: undefined, done: true };
      }
      return { value: this.shift(), done: false };
    }
  };
};

/**
 * Check whether data is an ArrayStream
 * @param {Any} input  data to check
 * @returns {boolean}
 */
function isArrayStream(input) {
  return ArrayStream.prototype.isPrototypeOf(input);
}

/**
 * A wrapper class over the native WritableStreamDefaultWriter.
 * It also lets you "write data to" array streams instead of streams.
 * @class
 */
function Writer(input) {
  if (!isArrayStream(input)) {
    const writer = input.getWriter();
    const releaseLock = writer.releaseLock;
    writer.releaseLock = () => {
      writer.closed.catch(function() {});
      releaseLock.call(writer);
    };
    return writer;
  }
  this.stream = input;
}

/**
 * Write a chunk of data.
 * @returns {Promise<undefined>}
 * @async
 */
Writer.prototype.write = async function(chunk) {
  this.stream.push(chunk);
};

/**
 * Close the stream.
 * @returns {Promise<undefined>}
 * @async
 */
Writer.prototype.close = async function() {
  this.stream[doneWritingResolve]();
};

/**
 * Error the stream.
 * @returns {Promise<Object>}
 * @async
 */
Writer.prototype.abort = async function(reason) {
  this.stream[doneWritingReject](reason);
  return reason;
};

/**
 * Release the writer's lock.
 * @returns {undefined}
 * @async
 */
Writer.prototype.releaseLock = function() {};


export { ArrayStream, isArrayStream, Writer, doneWritingPromise };
