/**
 * Tests cases are taken from `typescript.test.ts` but do not include the WebStreamPonyfill
 * since the v3.3.3 ponyfill module resolution (required with the legacy TS version) does not work properly.
 */
import assert from 'assert';
import { Readable as NodeNativeReadableStream } from 'stream';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { NodeWebStream, Stream, toStream, transform, transformAsync, Data, readToEnd } from '@openpgp/web-stream-tools';
// @ts-expect-error missing defs
import { ArrayStream, isArrayStream } from '@openpgp/web-stream-tools';

const newEmptyTypedNodeWebStream = <T extends Data>() => (
  new NodeWebReadableStream({ start(ctrl) { ctrl.close() } }) as NodeWebStream<T>
);

(async () => {
  const nodeWebStream: NodeWebStream<string> = NodeNativeReadableStream.toWeb(new NodeNativeReadableStream());
  assert(nodeWebStream instanceof NodeWebReadableStream);
  // @ts-expect-error detect node stream type mismatch
  const nodeNativeStream: NodeWebStream<string> = new NodeNativeReadableStream();
  assert(nodeNativeStream instanceof NodeNativeReadableStream);

  await readToEnd(new Uint8Array([1])) as Uint8Array;
  await readToEnd(new Uint8Array([1]), _ => _) as Uint8Array[];
  // @ts-expect-error expect string type
  await readToEnd(newEmptyTypedNodeWebStream<string>()) as Uint8Array;
  await readToEnd(newEmptyTypedNodeWebStream<string>(), () => new Uint8Array()) as Uint8Array;

  const anotherNodeWebStream: NodeWebStream<string> = toStream(nodeWebStream);
  assert(anotherNodeWebStream instanceof NodeWebReadableStream);
  // The following type assertion may fail or not depending on the TS and @types/node versions;
  // it doesn't fail with TS v4.7
  // // @ts-expect-error expect node stream in output
  // const expectedWebStreamButActualNodeStream: WebStream<string> = toStream(nodeWebStream);
  // assert(expectedWebStreamButActualNodeStream instanceof NodeWebReadableStream);
  const newStringStream: Stream<string> = toStream('chunk');
  assert(newStringStream instanceof NodeWebReadableStream);
  // @ts-expect-error detect type parameter mismatch
  const anotherStringStream: Stream<Uint8Array> = toStream('chunk');
  assert(anotherStringStream instanceof NodeWebReadableStream);

  assert(isArrayStream(new ArrayStream())) ; // ensure Array is actually extended in e.g. es5

  const transformDefaultOutput: undefined = transform('string');
  assert(transformDefaultOutput === undefined);
  const transformStreamUndefinedOutput: Stream<never> = transform(newEmptyTypedNodeWebStream(), () => {});
  assert(transformStreamUndefinedOutput instanceof NodeWebReadableStream);
  const transformOutputStreamString: Stream<string> = transform(newEmptyTypedNodeWebStream<string>(), () => '');
  assert(transformOutputStreamString instanceof NodeWebReadableStream);
  const transformProcessOutputString: string = transform('string', () => '');
  assert(typeof transformProcessOutputString === 'string');
  const transformConcatOutputString: string = transform('string', () => '', () => '');
  assert(typeof transformConcatOutputString === 'string');
  const transformFinishOutputString: string = transform('string', undefined, () => '');
  assert(typeof transformFinishOutputString === 'string');
  const transformProcessOutputStreamBytes: Stream<Uint8Array> = transform(
    newEmptyTypedNodeWebStream<string>(),
    () => new Uint8Array()
  );
  assert(transformProcessOutputStreamBytes instanceof NodeWebReadableStream);
  // @ts-expect-error `finish()` and `process()` output types must match
  transform(newEmptyTypedNodeWebStream<string>(), () => new Uint8Array(), () => '');
  // @ts-expect-error on async callback
  transform(newEmptyTypedNodeWebStream<string>(), async () => 'string');
  const transformAsyncOutputStreamStringToBytes: Stream<Uint8Array> = await transformAsync(
    newEmptyTypedNodeWebStream<string>(),
    async () => new Uint8Array(),
    async () => new Uint8Array()
  );
  assert(transformAsyncOutputStreamStringToBytes instanceof NodeWebReadableStream);
  // @ts-expect-error on sync callback
  transformAsync(newEmptyTypedNodeWebStream<string>(), async () => new Uint8Array(), () => new Uint8Array());

  console.log('TypeScript definitions are correct');
})().catch(e => {
  console.error('TypeScript definitions tests failed by throwing the following error');
  console.error(e);
  process.exit(1);
});
