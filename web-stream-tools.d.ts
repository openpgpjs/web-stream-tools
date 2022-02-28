// Type definitions for @openpgp/web-stream-tools
// Contributors:
// - Flowcrypt a.s. <human@flowcrypt.com>

export namespace ReadableStreamInternals {
  // copied+simplified version of ReadableStream from lib.dom.d.ts, needed to enforce type checks in WebStream below
  interface ReadableStreamDefaultReadDoneResult {
    done: true;
    value?: undefined;
  }
  interface ReadableStreamDefaultReadValueResult<T> {
    done: false;
    value: T;
  }
  interface ReadableStreamDefaultReader<R = any> {
    readonly closed: Promise<undefined>;
    cancel(reason?: any): Promise<void>;
    read(): Promise<ReadableStreamDefaultReadValueResult<R> | ReadableStreamDefaultReadDoneResult>;
    releaseLock(): void;
  }
}

type Data = Uint8Array | string;

interface WebStream<T extends Data> { // copied+simplified version of ReadableStream from lib.dom.d.ts
  readonly locked: boolean; pipeThrough: Function; pipeTo: Function; tee: Function;
  cancel(reason?: any): Promise<void>;
  getReader(): ReadableStreamInternals.ReadableStreamDefaultReader<T>;
}

interface NodeStream<T extends Data> extends AsyncIterable<T> { // copied+simplified version of ReadableStream from @types/node/index.d.ts
  readable: boolean; pipe: Function; unpipe: Function; wrap: Function; setEncoding(encoding: string): this; pause(): this; resume(): this;
  isPaused(): boolean; unshift(chunk: string | Uint8Array): void;
  read(size?: number): T;
}

type Stream<T extends Data> = WebStream<T> | NodeStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;

export function readToEnd<T extends Data, R extends any = T>(input: MaybeStream<T>, join?: (chunks: T[]) => R): Promise<R>;
