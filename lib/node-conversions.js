import { isNode } from './util.js';
import * as streams from './streams.js';

const NodeBuffer = isNode && require('buffer').Buffer;
const NodeReadableStream = isNode && require('stream').Readable;

/**
 * Web / node stream conversion functions
 * From https://github.com/gwicke/node-web-streams
 */

let nodeToWeb;
let webToNode;

if (NodeReadableStream) {

  /**
   * Convert a Node Readable Stream to a Web ReadableStream
   * @param {Readable} nodeStream
   * @returns {ReadableStream}
   */
  nodeToWeb = function(nodeStream) {
    let canceled = false;
    return new ReadableStream({
      start(controller) {
        nodeStream.pause();
        nodeStream.on('data', chunk => {
          if (canceled) {
            return;
          }
          if (NodeBuffer.isBuffer(chunk)) {
            chunk = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          }
          controller.enqueue(chunk);
          nodeStream.pause();
        });
        nodeStream.on('end', () => {
          if (canceled) {
            return;
          }
          controller.close();
        });
        nodeStream.on('error', e => controller.error(e));
      },
      pull() {
        nodeStream.resume();
      },
      cancel(reason) {
        canceled = true;
        nodeStream.destroy(reason);
      }
    });
  };


  class NodeReadable extends NodeReadableStream {
    constructor(webStream, options) {
      super(options);
      this._reader = streams.getReader(webStream);
    }

    async _read(size) {
      try {
        while (true) {
          const { done, value } = await this._reader.read()
          if (done) {
            this.push(null);
            break;
          }
          if (!this.push(value) || this._cancelling) {
            this._reading = false;
            break;
          }
        }
      } catch(e) {
        this.emit('error', e);
      }
    }

    _destroy(reason) {
      this._reader.cancel(reason);
    }
  }

  /**
   * Convert a Web ReadableStream to a Node Readable Stream
   * @param {ReadableStream} webStream
   * @param {Object} options
   * @returns {Readable}
   */
  webToNode = function(webStream, options) {
    return new NodeReadable(webStream, options);
  };

}

export { nodeToWeb, webToNode };
