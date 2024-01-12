import { expect } from 'chai';
import { Readable } from 'stream';
import { ReadableStream as NodeWebReadableStream } from 'stream/web';
import { toStream, readToEnd } from '@openpgp/web-stream-tools';

describe('Node integration tests', () => {
  it('throws on node native stream', async () => {
    const input = new Readable();
    expect(() => toStream(input)).to.throw(/Native Node streams are no longer supported/);
  });

  it('accepts on node web stream', async () => {
    const input = 'chunk';
    const stream = new NodeWebReadableStream({
      start(controller) {
        controller.enqueue('chunk');
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    expect(await readToEnd(streamedData)).to.equal(input);
  });

  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  })
})
