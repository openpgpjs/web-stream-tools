import { expect } from 'chai';

import { webToNode, toStream, readToEnd } from '@openpgp/web-stream-tools';

describe('Node integration tests', () => {
  it('Node.js specific utils are defined', () => {
    expect(webToNode).to.not.be.null;
  })

  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  })
})
