import { expect } from 'chai';
import { toStream, readToEnd } from '@openpgp/web-stream-tools';

describe('Browser integration tests', () => {
  it('accepts readable stream', async () => {
    const input = 'chunk';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
    const streamedData = toStream(stream);
    expect(await readToEnd(streamedData)).to.equal(input);
  });
})
