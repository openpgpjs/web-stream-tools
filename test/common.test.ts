import { expect } from 'chai';
import { toStream, readToEnd, slice } from  '@openpgp/web-stream-tools';

describe('Common integration tests', () => {
  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  });

  it('slice', async () => {
    const input = 'another chunk';
    const streamedData = toStream(input);
    const slicedStream = slice(streamedData, 8);
    expect(await readToEnd(slicedStream)).to.equal('chunk');
  })
})
