import { expect } from 'chai';
import { toStream, readToEnd, type WebStream } from '@openpgp/web-stream-tools';

describe('Browser integration tests', () => {
  it('accepts readable stream', async () => {
    const input = 'chunk';
    const stream: WebStream<string> = new ReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    expect(await readToEnd(streamedData)).to.equal(input);
  });

  it('casting a WebStream to ReadableStream allows using it as AsyncIterable (with lib="DOM.asyncIterable")', async () => {
    const input = 'chunk';
    const stream: WebStream<string> = new ReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });

    // NB: this works because test/tsconfig.json includes the DOM.asyncIterable lib
    for await (const chunk of stream as ReadableStream) { expect(chunk).to.not.be.undefined; }
  });
});
