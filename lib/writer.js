const doneWritingPromise = Symbol('doneWritingPromise');
const doneWritingResolve = Symbol('doneWritingResolve');
const doneWritingReject = Symbol('doneWritingReject');

const readingIndex = Symbol('readingIndex');

class ArrayStream extends Array {
  constructor() {
    super();
    // ES5 patch, see https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, ArrayStream.prototype);

    this[doneWritingPromise] = new Promise((resolve, reject) => {
      this[doneWritingResolve] = resolve;
      this[doneWritingReject] = reject;
    });
    this[doneWritingPromise].catch(() => {});
  }
}

ArrayStream.prototype.getReader = function() {
  if (this[readingIndex] === undefined) {
    this[readingIndex] = 0;
  }
  return {
    read: async () => {
      await this[doneWritingPromise];
      if (this[readingIndex] === this.length) {
        return { value: undefined, done: true };
      }
      return { value: this[this[readingIndex]++], done: false };
    }
  };
};

ArrayStream.prototype.readToEnd = async function(join) {
  await this[doneWritingPromise];
  const result = join(this.slice(this[readingIndex]));
  this.length = 0;
  return result;
};

ArrayStream.prototype.clone = function() {
  const clone = new ArrayStream();
  clone[doneWritingPromise] = this[doneWritingPromise].then(() => {
    clone.push(...this);
  });
  return clone;
};

/**
 * Check whether data is an ArrayStream
 * @param {Any} input  data to check
 * @returns {boolean}
 */
function isArrayStream(input) {
  return input && input.getReader && Array.isArray(input);
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
