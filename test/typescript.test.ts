import assert from 'assert';
import { Readable as NodeNativeReadableStream } from 'stream';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { ReadableStream as WebReadableStream } from 'web-streams-polyfill';
import type { WebStream, NodeWebStream } from '@openpgp/web-stream-tools';
import { readToEnd } from '@openpgp/web-stream-tools';
// @ts-ignore missing defs
import { ArrayStream, isArrayStream } from '@openpgp/web-stream-tools';

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

  assert(isArrayStream(new ArrayStream())) ; // ensure Array is actually extended in e.g. es5

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
