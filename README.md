# Web Stream Tools

This library contains both basic convenience functions such as `readToEnd`, `concat`, `slice`, `clone`, `webToNode` and `nodeToWeb`, and more complex functions for transforming and parsing streams. Examples of the latter can be found below.

## Table of Contents
<!-- MarkdownTOC autolink="true" -->

- [Usage](#usage)
- [Documentation](#documentation)
- [Examples](#examples)
  - [Transforming a stream](#transforming-a-stream)
  - [Transforming a stream in chunks of 1024 bytes](#transforming-a-stream-in-chunks-of-1024-bytes)
  - [Parsing data on a stream which is expected to be in a specific format](#parsing-data-on-a-stream-which-is-expected-to-be-in-a-specific-format)
  - [Cloning and slicing streams](#cloning-and-slicing-streams)

<!-- /MarkdownTOC -->

## Usage

```bash
npm install --save web-stream-tools
```

```js
import stream from 'web-stream-tools';
```

## Documentation

See [the documentation](https://openpgpjs.org/web-stream-tools/global.html) for a full list of functions. 

## Examples

### Transforming a stream

In this example we're encrypting a stream using an imaginary API which has `process` and `finish` methods.

```js
const encryptor = new Encryptor();
const encrypted = stream.transform(input, function process(chunk) {
  return encryptor.process(chunk);
}, function finish() {
  return encryptor.finish();
});
```

Both the `process` and `finish` functions:

- are optional (by default no data is written to the transformed stream)
- may be asynchronous
- may throw (in which case the error is forwarded to the transformed stream)

`input` can be a stream containing anything, or it can be a plain value (Uint8Array or String) in which case `transform()` will simply return `process(input)` and `finish()` concatenated together.

### Transforming a stream in chunks of 1024 bytes

In this example we're encrypting a stream using an imaginary API which has a `process` method that requires us to pass in chunks of size 1024 (unless it's the last chunk).

```js
const encrypted = stream.transformPair(input, async (readable, writable) => {
  const reader = stream.getReader(readable);
  const writer = stream.getWriter(writable);
  try {
    while (true) {
      await writer.ready;
      const chunk = await reader.readBytes(1024);
        // The above will return 1024 bytes unless the stream closed before that, in which
        // case it either returns fewer bytes or undefined if no data is available.
      if (chunk === undefined) {
        await writer.close();
        break;
      }
      await writer.write(encryptor.process(chunk));
    }
  } catch(e) {
    await writer.abort(e);
  }
});
```

The above example may seem more complicated than necessary, but it correctly handles:

- Backpressure (if `encrypted` gets read slowly, `input` gets read slowly as well)
- Cancellation (if `encrypted` gets canceled, `input` gets cancelled as well)
- Erroring (if `input` errors, `encrypted` gets errored as well)

Unlike `transform`, `transformPair` will always return a stream, even if `input` is not.

### Parsing data on a stream which is expected to be in a specific format

There are also helper functions for reading a specific number of bytes, or a single line, etc:

```js
stream.parse(input, reader => {
  const byte = await reader.readByte(); // Single byte or undefined
  const bytes = await reader.readBytes(n); // Uint8Array of up to n bytes, or undefined
  const line = await reader.readLine(); // Returns String up to and including the first \n, or undefined. This function is specifically for a stream of Strings.
  // There's also peekBytes() and unshift(), which you can use to look ahead in the stream.

  const stream = reader.remainder(); // New stream containing the remainder of the original stream. Only available when using a Reader from stream.parse()
});
```

Most of the functions above are also available when getting a reader using `stream.getReader()` instead of `stream.parse()`.

All of the functions above also work when reading a stream containing Strings instead of a Uint8Arrays, and will return Strings in that case.

### Cloning and slicing streams

There are also a few functions not for reading the stream, but for manipulating the stream for another function to read:

```js
stream.slice(input, begin, end); // Returns a stream pointing to part of the original stream, or a Uint8Array
stream.clone(input); // Returns a copy of the stream so that two functions can read it. Note: this does *not* clone a Uint8Array, since this function is only meant for reading the same data twice.
stream.passiveClone(input); // Also returns a copy of the stream, but doesn't return data immediately when you read from it, only returns data when you read from the original stream. This is meant for respecting backpressure.
```

Note: these three functions do not work well with Node streams. Please convert Node streams to Web streams with `stream.nodeToWeb` first before using them.
