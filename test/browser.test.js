import { expect } from 'chai';
import { webToNode, toStream, readToEnd } from '../lib/index.js';

describe('Browser integration tests', () => {
  it('Node.js specific utils are not defined', () => {
    expect(webToNode).to.be.null;
  })

  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  })
})
