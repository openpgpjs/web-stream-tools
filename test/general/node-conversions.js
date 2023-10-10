import { expect } from 'chai';
import {
  pipeline,
  Readable as NodeReadable,
  PassThrough as NodePassThrough,
} from 'stream' ;
import { promisify } from 'util';

import { nodeToWeb, webToNode, loadStreamsPonyfill } from '../../lib/streams';

async function readStreamToString(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(chunk.toString());
  }

  return chunks.join('');
}

describe('Node Conversions', function () {
  let input;

  before(async () => loadStreamsPonyfill());

  beforeEach(function () {
    input = webToNode(nodeToWeb(NodeReadable.from(['a', 'b', 'c'])));
  });

  it('should work', async function () {
    const output = await readStreamToString(input);
    expect(output).to.equal('abc');
  });

  it('should work within a pipeline', async function () {
    const sink = new NodePassThrough();
    await promisify(pipeline)(input, sink);
    const output = await readStreamToString(sink);
    expect(output).to.equal('abc');
  });

  describe('when underlying readable throws', function () {
    const mockError = new Error('Oops!');

    beforeEach(function () {
      function* generator() {
        yield 'a';
        yield 'b';
        throw mockError;
      }
      input = webToNode(nodeToWeb(NodeReadable.from(generator())));
    });

    it('should throw too', async function () {
      try {
        await readStreamToString(input);
        expect.fail();
      } catch (e) {
        expect(e).to.equal(mockError);
      }
    });

    it('should propagate the error through a pipeline correctly', async function () {
      try {
        const sink = new NodePassThrough();
        await promisify(pipeline)(input, sink);
        await readStreamToString(sink);
        expect.fail();
      } catch (e) {
        expect(e).to.equal(mockError);
      }
    });
  });
});
