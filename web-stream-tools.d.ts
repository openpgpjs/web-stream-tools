// Type definitions for @openpgp/web-stream-tools
// Contributors:
// - Flowcrypt a.s. <human@flowcrypt.com>

export namespace ReadableStreamInternals {
  // copied+simplified version of ReadableStream from lib.dom.d.ts, needed to enforce type checks in WebStream below
  interface ReadableStreamReadDoneResult<T> {
    done: true;
    value?: T;
  }
  interface ReadableStreamReadValueResult<T> {
    done: false;
    value: T;
  }
  interface ReadableStreamGenericReader {
    readonly closed: Promise<undefined>;
    cancel(reason?: any): Promise<void>;
  }

  type ReadableStreamReadResult<T> = ReadableStreamReadValueResult<T> | ReadableStreamReadDoneResult<T>;

  interface ReadableStreamDefaultReader<R = any> extends ReadableStreamGenericReader {
    read(): Promise<ReadableStreamReadResult<R>>;
    releaseLock(): void;
  }

  interface ReadableStreamBYOBReader extends ReadableStreamGenericReader {
    read<T extends ArrayBufferView>(view: T): Promise<ReadableStreamReadResult<T>>;
    releaseLock(): void;
  }
}

type Data = Uint8Array | string;

interface WebStream<T extends Data> { // copied+simplified version of ReadableStream from lib.dom.d.ts
  readonly locked: boolean; pipeThrough: Function; pipeTo: Function; tee: Function;
  cancel(reason?: any): Promise<void>;
  getReader(): ReadableStreamInternals.ReadableStreamDefaultReader<T>;
  getReader(options: { mode: "byob" }): ReadableStreamInternals.ReadableStreamBYOBReader;
  getReader(options?: { mode?: "byob" }): ReadableStreamInternals.ReadableStreamDefaultReader<T> | ReadableStreamInternals.ReadableStreamBYOBReader;
}

interface NodeStream<T extends Data> extends AsyncIterable<T> { // copied+simplified version of ReadableStream from @types/node/index.d.ts
  readable: boolean; pipe: Function; unpipe: Function; wrap: Function; setEncoding(encoding: string): this; pause(): this; resume(): this;
  isPaused(): boolean; unshift(chunk: string | Uint8Array): void;
  read(size?: number): T;
}

type Stream<T extends Data> = WebStream<T> | NodeStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;

export function readToEnd<T extends Data, R extends any = T>(input: MaybeStream<T>, join?: (chunks: T[]) => R): Promise<R>;
