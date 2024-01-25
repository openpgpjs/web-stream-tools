import { expect } from 'chai';
import { Readable as NodeNativeReadableStream } from 'node:stream';
import { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { toStream, readToEnd } from '@openpgp/web-stream-tools';

describe('Node integration tests', () => {
  it('throws on node native stream', async () => {
    const input = new NodeNativeReadableStream();
    // @ts-expect-error `toStream` does not accept a native node stream
    expect(() => toStream(input)).to.throw(/Native Node streams are no longer supported/);
  });

  it('accepts node web stream', async () => {
    const input = 'chunk';
    const stream = new NodeWebReadableStream<string>({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    expect(await readToEnd(streamedData)).to.equal(input);
  });

  it('returned node web stream can be converted into node native stream', async () => {
    const input = 'chunk';
    const stream = new NodeWebReadableStream<string>({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    expect(NodeNativeReadableStream.fromWeb(streamedData)).to.exist;
  });

  it('polyfilled web stream cannot be converted into node native stream', async () => {
    const { ReadableStream: PolyfilledReadableStream } = await import ('web-streams-polyfill');

    // this test is just to keep track that this behaviour is expected
    const input = 'chunk';
    const stream = new PolyfilledReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    // @ts-expect-error `fromWeb` does not accept the polyfilled stream
    expect(() => NodeNativeReadableStream.fromWeb(streamedData)).to.throw(/must be an instance of ReadableStream/);
  });
});
