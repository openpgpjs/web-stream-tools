/// <reference lib="dom" />

type Data = Uint8Array | string;

export type WebStream<T extends Data> = ReadableStream<T>;

interface NodeStream<T extends Data> extends AsyncIterable<T> { // copied+simplified version of ReadableStream from @types/node/index.d.ts, which does no support generics
  readable: boolean; pipe: Function; unpipe: Function; wrap: Function; setEncoding(encoding: string): this; pause(): this; resume(): this;
  isPaused(): boolean; unshift(chunk: string | Uint8Array): void;
  read(size?: number): T;
}

type Stream<T extends Data> = WebStream<T> | NodeStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;

export function readToEnd<T extends Data, R extends any = T>(input: MaybeStream<T>, join?: (chunks: T[]) => R): Promise<R>;
