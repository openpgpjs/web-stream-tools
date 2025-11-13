/* global process */
import assert from 'assert';
import { Readable as NodeNativeReadableStream } from 'stream';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { ReadableStream as PonyfilledWebReadableStream } from 'web-streams-polyfill';
import { type WebStream, type NodeWebStream, type Stream, toStream, type Data } from '@openpgp/web-stream-tools';
import { readToEnd } from '@openpgp/web-stream-tools';
// @ts-expect-error missing defs
import { ArrayStream, isArrayStream } from '@openpgp/web-stream-tools';

const newEmptyWebStream = <T extends Data>(): WebStream<T> => (
  new PonyfilledWebReadableStream<T>({ start(ctrl) { ctrl.close(); } })
);

(async () => {
  const webStream: WebStream<string> = new PonyfilledWebReadableStream<string>();
  assert(webStream instanceof PonyfilledWebReadableStream);
  const nodeWebStream: NodeWebStream<string> = NodeNativeReadableStream.toWeb(new NodeNativeReadableStream());
  assert(nodeWebStream instanceof NodeWebReadableStream);
  // @ts-expect-error detect type parameter mismatch
  const anotherWebStream: WebStream<string> = new PonyfilledWebReadableStream<Uint8Array>();
  assert(anotherWebStream instanceof PonyfilledWebReadableStream);
  // @ts-expect-error detect node stream type mismatch
  const nodeNativeStream: NodeWebStream<string> = new NodeNativeReadableStream();
  assert(nodeNativeStream instanceof NodeNativeReadableStream);

  await readToEnd(new Uint8Array([1])) as Uint8Array;
  await readToEnd(new Uint8Array([1]), _ => _) as Uint8Array[];
  // @ts-expect-error expect string type
  await readToEnd(newEmptyWebStream<string>()) as Uint8Array;
  await readToEnd(newEmptyWebStream<string>(), () => new Uint8Array()) as Uint8Array;

  const anotherNodeWebStream: NodeWebStream<string> = toStream(nodeWebStream);
  assert(anotherNodeWebStream instanceof NodeWebReadableStream);
  // @ts-expect-error expect node stream in output
  const expectedWebStreamButActualNodeStream: WebStream<string> = toStream(nodeWebStream);
  assert(expectedWebStreamButActualNodeStream instanceof NodeWebReadableStream);
  const newStringStream: Stream<string> = toStream('chunk');
  assert(newStringStream instanceof NodeWebReadableStream);
  // @ts-expect-error detect type parameter mismatch
  const anotherStringStream: Stream<Uint8Array> = toStream('chunk');
  assert(anotherStringStream instanceof NodeWebReadableStream);

  // ensure a WebStream can be casted to a ponyfilled stream if needed to access the AsyncIterable
  for await (const _ of newEmptyWebStream<string>() as PonyfilledWebReadableStream) {}

  assert(isArrayStream(new ArrayStream())) ; // ensure Array is actually extended in e.g. es5

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
