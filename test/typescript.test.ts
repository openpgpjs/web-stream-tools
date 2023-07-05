import assert from 'assert';
import { Readable as NodeReadableStream } from 'stream';
import { ReadableStream as WebReadableStream } from 'web-streams-polyfill';
import type { WebStream, NodeStream } from '@openpgp/web-stream-tools';
import { readToEnd } from '@openpgp/web-stream-tools';
// @ts-ignore missing defs
import { ArrayStream, isArrayStream } from '@openpgp/web-stream-tools';

(async () => {
  const nodeStream: NodeStream<string> = new NodeReadableStream();
  assert(nodeStream instanceof NodeReadableStream);
  // @ts-expect-error detect type parameter mismatch
  const webStream: WebStream<string> = new ReadableStream<Uint8Array>();
  assert(webStream instanceof WebReadableStream);

  const anotherWebStream: WebStream<Uint8Array> = new ReadableStream<Uint8Array>();
  assert(anotherWebStream instanceof WebReadableStream);

  await readToEnd(new Uint8Array([1])) as Uint8Array;
  await readToEnd(new Uint8Array([1]), _ => _) as Uint8Array[];

  assert(isArrayStream(new ArrayStream())); // ensure Array is actually extended in e.g. es5

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
