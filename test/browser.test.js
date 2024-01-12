import { expect } from 'chai';
import { toStream, readToEnd } from '../lib/index.js';

describe('Browser integration tests', () => {
  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  })
})
