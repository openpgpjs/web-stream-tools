import { isNode } from './util';
import streams from './streams';

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
    return new ReadableStream({
      start(controller) {
        nodeStream.pause();
        nodeStream.on('data', chunk => {
          controller.enqueue(chunk);
          nodeStream.pause();
        });
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', e => controller.error(e));
      },
      pull() {
        nodeStream.resume();
      },
      cancel(reason) {
        nodeStream.pause();
        if (nodeStream.cancel) {
          return nodeStream.cancel(reason);
        }
      }
    });
  };


  class NodeReadable extends NodeReadableStream {
    constructor(webStream, options) {
      super(options);
      this._webStream = webStream;
      this._reader = streams.getReader(webStream);
      this._reading = false;
      this._doneReadingPromise = Promise.resolve();
      this._cancelling = false;
    }

    _read(size) {
      if (this._reading || this._cancelling) {
        return;
      }
      this._reading = true;
      const doRead = async () => {
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
      };
      this._doneReadingPromise = doRead();
    }

    async cancel(reason) {
      this._cancelling = true;
      await this._doneReadingPromise;
      this._reader.releaseLock();
      return this._webStream.cancel(reason);
    }
  }

  /**
   * Convert a Web ReadableStream to a Node Readable Stream
   * @param {ReadableStream} webStream
   * @returns {Readable}
   */
  webToNode = function(webStream) {
    return new NodeReadable(webStream);
  };

}

export { nodeToWeb, webToNode };
