// Type definitions for @openpgp/web-stream-tools
// Contributors:
// - Flowcrypt a.s. <human@flowcrypt.com>

declare module "@openpgp/web-stream-tools" {
    type Data = Uint8Array | string;

    interface BaseStream<T extends Data> extends AsyncIterable<T> { }

    interface WebStream<T extends Data> extends BaseStream<T> { // copied+simplified version of ReadableStream from lib.dom.d.ts
      readonly locked: boolean; getReader: Function; pipeThrough: Function; pipeTo: Function; tee: Function;
      cancel(reason?: any): Promise<void>;
    }

    interface NodeStream<T extends Data> extends BaseStream<T> { // copied+simplified version of ReadableStream from @types/node/index.d.ts
      readable: boolean; pipe: Function; unpipe: Function; wrap: Function;
      read(size?: number): string | Uint8Array; setEncoding(encoding: string): this; pause(): this; resume(): this;
      isPaused(): boolean; unshift(chunk: string | Uint8Array): void;
    }

    type Stream<T extends Data> = WebStream<T> | NodeStream<T>;

    type MaybeStream<T extends Data> = T | Stream<T>;

    export function readToEnd<T extends Data>(input: MaybeStream<T>, concat?: (list: T[]) => T): Promise<T>;
}
