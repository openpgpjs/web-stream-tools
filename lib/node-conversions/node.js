// This file is only included in the Node build
import { Buffer as NodeBuffer } from 'buffer';
import { Readable as NodeReadableStream } from 'stream';
export { NodeBuffer, NodeReadableStream };

import { getReader } from '../streams.js';

/**
 * Web / node stream conversion functions
 * From https://github.com/gwicke/node-web-streams
 */

  /**
   * Convert a Node Readable Stream to a Web ReadableStream
   * @param {Readable} nodeStream
   * @returns {ReadableStream}
   */
export function nodeToWeb(nodeStream) {
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
}


class NodeReadable extends NodeReadableStream {
  constructor(webStream, options) {
    super(options);
    this._reader = getReader(webStream);
  }

  async _read(size) {
    try {
      // eslint-disable-next-line no-constant-condition
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
export function webToNode(webStream, options) {
  return new NodeReadable(webStream, options);
}
