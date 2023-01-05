const { expect } = require('chai');
const {
  pipeline,
  Readable: NodeReadable,
  PassThrough: NodePassThrough,
} = require('stream');
const { promisify } = require('util');

const { nodeToWeb, webToNode } = require('../../lib/streams');

async function readStreamToString(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(chunk.toString());
  }

  return chunks.join('');
}

describe('Node Conversions', function () {
  it('should work', async function () {
    const input = webToNode(nodeToWeb(NodeReadable.from(['a', 'b', 'c'])));
    const output = await readStreamToString(input);
    expect(output).to.equal('abc');
  });

  it('should work within a pipeline', async function () {
    const input = webToNode(nodeToWeb(NodeReadable.from(['a', 'b', 'c'])));
    const sink = new NodePassThrough();
    await promisify(pipeline)(input, sink);
    const output = await readStreamToString(sink);
    expect(output).to.equal('abc');
  });
});
