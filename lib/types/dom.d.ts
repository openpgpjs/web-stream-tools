/**
 * This file contains a partial and minimal re-declaration of the
 * DOM ReadableStream types (copied as-is), to be able to disambiguate them from
 * the ones in the Node types, which are also declared globally,
 * and can thus cause issues (interface override/merging) when
 * a TS codebase relies on both (even indirectly, e.g. if @types/node is
 * brought in by a dependency via triple-slash /// directive).
 *
 * Hopefully TS ships some native way of uniquely referencing the DOM
 * interface, see: https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2120 .
 */

// it'd be good to set <reference no-default-lib="true"/> (via /// directive) here to ensure the type definitions here
// do not implicitly reference others, but it currently disables including libs anywhere
// (see https://github.com/microsoft/TypeScript/issues/59067)
/// <reference lib="dom" />
/// <reference lib="es2018.asynciterable" />

export namespace DOM {
  /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

  interface WritableStream<W = any> {
    /**
         * The **`locked`** read-only property of the WritableStream interface returns a boolean indicating whether the `WritableStream` is locked to a writer.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/locked)
         */
    readonly locked: boolean;
    /**
         * The **`abort()`** method of the WritableStream interface aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be immediately moved to an error state, with any queued writes discarded.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/abort)
         */
    abort(reason?: any): Promise<void>;
    /**
         * The **`close()`** method of the WritableStream interface closes the associated stream.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/close)
         */
    close(): Promise<void>;
    /**
         * The **`getWriter()`** method of the WritableStream interface returns a new instance of WritableStreamDefaultWriter and locks the stream to that instance.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/getWriter)
         */
    getWriter(): WritableStreamDefaultWriter<W>;
  }
  /**
     * The `ReadableStream` interface of the Streams API represents a readable stream of byte data.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream)
     */
  export interface ReadableStream<R = any> {
    /**
         * The **`locked`** read-only property of the ReadableStream interface returns whether or not the readable stream is locked to a reader.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/locked)
         */
    readonly locked: boolean;
    /**
         * The **`cancel()`** method of the ReadableStream interface returns a Promise that resolves when the stream is canceled.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/cancel)
         */
    cancel(reason?: any): Promise<void>;
    /**
         * The **`getReader()`** method of the ReadableStream interface creates a reader and locks the stream to it.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/getReader)
         */
    getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;
    getReader(): ReadableStreamDefaultReader<R>;
    getReader(options?: globalThis.ReadableStreamGetReaderOptions): globalThis.ReadableStreamReader<R>;
    /**
         * The **`pipeThrough()`** method of the ReadableStream interface provides a chainable way of piping the current stream through a transform stream or any other writable/readable pair.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/pipeThrough)
         */
    pipeThrough<T>(
      transform: ReadableWritablePair<T, R>, options?: globalThis.StreamPipeOptions
    ): ReadableStream<T>;
    /**
         * The **`pipeTo()`** method of the ReadableStream interface pipes the current `ReadableStream` to a given WritableStream and returns a Promise that fulfills when the piping process completes successfully, or rejects if any errors were encountered.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/pipeTo)
         */
    pipeTo(destination: WritableStream<R>, options?: globalThis.StreamPipeOptions): Promise<void>;
    /**
         * The **`tee()`** method of the two-element array containing the two resulting branches as new ReadableStream instances.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStream/tee)
         */
    tee(): [ReadableStream<R>, ReadableStream<R>];

    // The AsyncIterator methods are declared as optional `?` here for informational purposes,
    // since the default DOM ReadableStream does not implement the AsyncIterator interface:
    // instead, the `dom.asyncinterable` lib needs to be explicitly included.
    // This is because the AsyncIterator browser support is still not widespread enough (missing Safari support).
    // To use the asyncIterable interface when available, users can manually cast a DOM.ReadableStream to
    // ReadableStream or PonyfilledReadableStream .
    [Symbol.asyncIterator]?(options?: globalThis.ReadableStreamIteratorOptions): ReadableStreamAsyncIterator<R>;
    values?(options?: globalThis.ReadableStreamIteratorOptions): ReadableStreamAsyncIterator<R>;
  }

  /**
     * The `ReadableStreamBYOBReader` interface of the Streams API defines a reader for a ReadableStream that supports zero-copy reading from an underlying byte source.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamBYOBReader)
     */
  export interface ReadableStreamBYOBReader extends globalThis.ReadableStreamGenericReader {
    /**
         * The **`read()`** method of the ReadableStreamBYOBReader interface is used to read data into a view on a user-supplied buffer from an associated readable byte stream.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamBYOBReader/read)
         */
    read<T extends ArrayBufferView>(view: T): Promise<globalThis.ReadableStreamReadResult<T>>;
    /**
         * The **`releaseLock()`** method of the ReadableStreamBYOBReader interface releases the reader's lock on the stream.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamBYOBReader/releaseLock)
         */
    releaseLock(): void;
  }

  /**
     * The **`ReadableStreamDefaultReader`** interface of the Streams API represents a default reader that can be used to read stream data supplied from a network (such as a fetch request).
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamDefaultReader)
     */
  export interface ReadableStreamDefaultReader<R = any> extends globalThis.ReadableStreamGenericReader {
    /**
         * The **`read()`** method of the ReadableStreamDefaultReader interface returns a Promise providing access to the next chunk in the stream's internal queue.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamDefaultReader/read)
         */
    read(): Promise<globalThis.ReadableStreamReadResult<R>>;
    /**
         * The **`releaseLock()`** method of the ReadableStreamDefaultReader interface releases the reader's lock on the stream.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamDefaultReader/releaseLock)
         */
    releaseLock(): void;
  }

  interface ReadableWritablePair<R = any, W = any> {
    readable: ReadableStream<R>;
    /**
         * Provides a convenient, chainable way of piping this readable stream through a transform stream (or any other { writable, readable } pair). It simply pipes the stream into the writable side of the supplied pair, and returns the readable side for further use.
         *
         * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
         */
    writable: WritableStream<W>;
  }

  interface ReadableStreamAsyncIterator<R> extends AsyncIterableIterator<R> {
    next(): Promise<IteratorResult<R, undefined>>;
    return?(value?: any): Promise<IteratorResult<R>>;
  }
}

export type DomReadableStream<R> = DOM.ReadableStream<R>;


