import streams from './streams';

const NodeReadableStream = typeof window === 'undefined' && require('stream').Readable;

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
      cancel() {
        nodeStream.pause();
      }
    });
  };


  class NodeReadable extends NodeReadableStream {
    constructor(webStream, options) {
      super(options);
      this._webStream = webStream;
      this._reader = streams.getReader(webStream);
      this._reading = false;
    }

    _read(size) {
      if (this._reading) {
        return;
      }
      this._reading = true;
      const doRead = () => {
        this._reader.read()
          .then(res => {
            if (res.done) {
              this.push(null);
              return;
            }
            if (this.push(res.value)) {
              return doRead(size);
            } else {
              this._reading = false;
            }
          });
      };
      doRead();
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
