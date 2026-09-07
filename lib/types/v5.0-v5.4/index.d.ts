/// <reference lib="dom" />

import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
type DomReadableStream<R> = ReadableStream<R>;

type Data = Uint8Array | string;

export type WebStream<T extends Data> = DomReadableStream<T>;
export type NodeWebStream<T extends Data> = NodeWebReadableStream<T>;

type Stream<T extends Data> = WebStream<T> | NodeWebStream<T>;
type MaybeStream<T extends Data> = T | Stream<T>;
type MaybeStreamDataType<T extends MaybeStream<Data>> = T extends Stream<infer X> ? X : T;

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

type Defined<T> = T extends undefined ? never : T;
type TransformOutputMaybeToStream<
  InputType,
  CallbackReturnType extends Data | undefined | void
> = InputType extends Data ?
  CallbackReturnType :
  Stream<CallbackReturnType extends Data ? CallbackReturnType : Data extends CallbackReturnType ? any /* never | Data */ : never>;
export function transform<
  InputType extends MaybeStream<Data>,
  OutData extends Data,
  ProcessFn extends undefined | ((chunk: MaybeStreamDataType<InputType>) => OutData | undefined | void) = undefined,
  FinishFn extends undefined | (() => OutData | undefined | void) = undefined,
>(
  input: InputType,
  process?: ProcessFn,
  finish?: FinishFn,
  queuingStrategy?: { highWaterMark: number }
): TransformOutputMaybeToStream<
  InputType,
  ProcessFn extends undefined ?
    FinishFn extends undefined ?
      undefined :
      // we do not cover the case where FinishFn or ProcessFn are (undefined | function)
      ReturnType<Defined<FinishFn>> :
    FinishFn extends undefined ?
      ReturnType<Defined<ProcessFn>> :
      (ReturnType<Defined<FinishFn>> | ReturnType<Defined<ProcessFn>>)
>;

export function transformAsync<
  InputType extends MaybeStream<Data>,
  OutData extends Data,
  ProcessFn extends undefined | ((chunk: MaybeStreamDataType<InputType>) => Promise<OutData | undefined | void>) = undefined,
  FinishFn extends undefined | (() => Promise<OutData | undefined | void>) = undefined,
>(
  input: InputType,
  process?: ProcessFn,
  finish?: FinishFn,
  queuingStrategy?: { highWaterMark: number }
): Promise<TransformOutputMaybeToStream<
  InputType,
  Awaited<ProcessFn extends undefined ?
    FinishFn extends undefined ?
      undefined :
      // we do not cover the case where FinishFn or ProcessFn are (undefined | function)
      ReturnType<Defined<FinishFn>> :
    FinishFn extends undefined ?
      ReturnType<Defined<ProcessFn>> :
      (ReturnType<Defined<FinishFn>> | ReturnType<Defined<ProcessFn>>)
  >>>;
