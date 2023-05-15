import assert from 'assert';
import { Readable as NodeReadableStream } from 'stream';
import { ReadableStream as WebReadableStream } from 'web-streams-polyfill';
import type { WebStream, NodeStream } from '../lib/index.js';
import { readToEnd } from '../lib/index.js';

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

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
