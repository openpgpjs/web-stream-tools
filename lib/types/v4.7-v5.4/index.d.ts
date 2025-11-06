/// <reference lib="dom" />

import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
type DomReadableStream<R> = ReadableStream<R>;

type Data = Uint8Array | string;

export type WebStream<T extends Data> = DomReadableStream<T>
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

type EmptyStream = DomReadableStream<undefined> | NodeWebReadableStream<undefined>;

// We use function overload instead of type parameter inference because the latter cannot capture the
// default values set in JS for `process` and `finish`, which overcomplicates things
export function transform<InData extends Data, InputType extends MaybeStream<InData>, OutData extends Data = InData>(
  input: InputType,
  process: (chunk: InData) => OutData,
  finish?: () => OutData | undefined,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? OutData : Stream<OutData>;
export function transform<InData extends Data, InputType extends MaybeStream<InData>, OutData extends Data = InData>(
  input: InputType,
  process: undefined | ((chunk: InData) => undefined),
  finish: () => OutData,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? OutData : Stream<OutData>;
export function transform<InData extends Data, InputType extends MaybeStream<InData>, _OutData extends Data = InData>(
  input: InputType,
  process?: (chunk: InData) => undefined,
  finish?: () => undefined,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? undefined : EmptyStream;

export function transformAsync<InData extends Data, InputType extends MaybeStream<InData>, OutData extends Data = InData>(
  input: InputType,
  process: (chunk: InData) => Promise<OutData>,
  finish?: () => Promise<OutData> | Promise<undefined>,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? Promise<OutData> : Stream<OutData>;
export function transformAsync<InData extends Data, InputType extends MaybeStream<InData>, OutData extends Data = InData>(
  input: InputType,
  process: undefined | ((chunk: InData) => Promise<undefined>),
  finish: () => Promise<OutData>,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? Promise<OutData> : Stream<OutData>;
export function transformAsync<InData extends Data, InputType extends MaybeStream<InData>, _OutData extends Data = InData>(
  input: InputType,
  process?: (chunk: InData) => Promise<undefined>,
  finish?: () => Promise<undefined>,
  queuingStrategy?: { highWaterMark: number }
): InputType extends InData ? Promise<undefined> : EmptyStream;
