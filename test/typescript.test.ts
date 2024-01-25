import assert from 'assert';
import { Readable as NodeNativeReadableStream } from 'stream';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { ReadableStream as WebReadableStream } from 'web-streams-polyfill';
import { WebStream, NodeWebStream, Stream, toStream, Data } from '@openpgp/web-stream-tools';
import { readToEnd } from '@openpgp/web-stream-tools';
// @ts-ignore missing defs
import { ArrayStream, isArrayStream } from '@openpgp/web-stream-tools';

const newEmptyWebStream = <T extends Data>(): WebStream<T> => new WebReadableStream<T>({ start(ctrl) { ctrl.close() } });

(async () => {
  const webStream: WebStream<string> = new WebReadableStream<string>();
  assert(webStream instanceof WebReadableStream);
  const nodeWebStream: NodeWebStream<string> = NodeNativeReadableStream.toWeb(new NodeNativeReadableStream());
  assert(nodeWebStream instanceof NodeWebReadableStream);
  // @ts-expect-error detect type parameter mismatch
  const anotherWebStream: WebStream<string> = new WebReadableStream<Uint8Array>();
  assert(anotherWebStream instanceof WebReadableStream);
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
  assert(newStringStream instanceof WebReadableStream); // ReadableStream is polyfilled
  // @ts-expect-error detect type parameter mismatch
  const anotherStringStream: Stream<Uint8Array> = toStream('chunk');
  assert(anotherStringStream instanceof WebReadableStream);  // ReadableStream is polyfilled

  assert(isArrayStream(new ArrayStream())) ; // ensure Array is actually extended in e.g. es5

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
