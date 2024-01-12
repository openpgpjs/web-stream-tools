/// <reference lib="dom" />
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
type Data = Uint8Array | string;

export type WebStream<T extends Data> = ReadableStream<T>
export type NodeWebStream<T extends Data> = NodeWebReadableStream<T>;

type Stream<T extends Data> = WebStream<T> | NodeWebStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;

export function readToEnd<T extends Data, R extends any = T>(input: MaybeStream<T>, join?: (chunks: T[]) => R): Promise<R>;
