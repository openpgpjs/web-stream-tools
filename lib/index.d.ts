/// <reference lib="dom" />
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
type Data = Uint8Array | string;

export type WebStream<T extends Data> = ReadableStream<T>
export type NodeWebStream<T extends Data> = NodeWebReadableStream<T>;

type Stream<T extends Data> = WebStream<T> | NodeWebStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;

export function readToEnd<T extends Data, JoinFn extends (chunks: T[]) => any = (chunks: T[]) => T>(
  input: MaybeStream<T>,
  join?: JoinFn
): Promise<ReturnType<JoinFn>>;

export function toStream<T extends Data, InputType extends MaybeStream<T>>(
  input: InputType
): InputType extends T ? Stream<InputType> : InputType;

export function isStream<T extends Data>(input: MaybeStream<T>): input is Stream<T>;

export function slice<T extends Data, InputType extends MaybeStream<T>>(
  input: InputType,
  begin: number,
  end?: number | typeof Infinity
): InputType; // same as 'typeof input'
