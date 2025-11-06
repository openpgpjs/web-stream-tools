import { expect } from 'chai';
// @ts-expect-error Missing type definitions
import { toStream, toArrayStream, getReader, readToEnd, slice, pipe, ArrayStream, transform, transformAsync } from  '@openpgp/web-stream-tools';

describe('Common integration tests', () => {
  it('readToEnd non-stream', async () => {
    const input = 'chunk\nanother chunk';
    expect(await readToEnd(input)).to.equal('chunk\nanother chunk');
  });

  it('readToEnd arraystream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toArrayStream(input);
    expect(await readToEnd(inputStream)).to.equal('chunk\nanother chunk');
  });

  it('readToEnd stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    expect(await readToEnd(inputStream)).to.equal('chunk\nanother chunk');
  });

  it('readToEnd partially-read non-stream', async () => {
    const input = new String('chunk\nanother chunk');
    const reader = getReader(input);
    await reader.readLine();
    reader.releaseLock();
    // @ts-expect-error Passing String instead of string
    expect(await readToEnd(input)).to.equal('another chunk');
  });

  it('readToEnd partially-read arraystream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toArrayStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    expect(await readToEnd(inputStream)).to.equal('another chunk');
  });

  it('readToEnd partially-read stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    expect(await readToEnd(inputStream)).to.equal('another chunk');
  });

  it('slice non-stream', async () => {
    const input = 'chunk\nanother chunk';
    const sliced = slice(input, 6);
    expect(sliced).to.equal('another chunk');
  });

  it('slice stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    const sliced = slice(inputStream, 6);
    expect(await readToEnd(sliced)).to.equal('another chunk');
  });

  it('slice partially-read non-stream', async () => {
    const input = new String('chunk\nanother chunk');
    const reader = getReader(input);
    await reader.readLine();
    reader.releaseLock();
    // @ts-expect-error Passing String instead of string
    const sliced = slice(input, 8);
    expect(sliced).to.equal('chunk');
  });

  it('slice partially-read stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    const sliced = slice(inputStream, 8);
    expect(await readToEnd(sliced)).to.equal('chunk');
  });

  it('pipe from stream to stream', async () => {
    const input = 'chunk';
    const inputStream = toStream(input);
    const outputStream = new TransformStream();
    pipe(inputStream, outputStream.writable);
    expect(await readToEnd(outputStream.readable)).to.equal('chunk');
  });

  it('pipe from stream to arraystream', async () => {
    const input = 'chunk';
    const inputStream = toStream(input);
    const outputStream = new ArrayStream();
    pipe(inputStream, outputStream);
    expect(await readToEnd(outputStream)).to.equal('chunk');
  });

  it('pipe from arraystream to stream', async () => {
    const input = 'chunk';
    const inputStream = toArrayStream(input);
    const outputStream = new TransformStream();
    pipe(inputStream, outputStream.writable);
    expect(await readToEnd(outputStream.readable)).to.equal('chunk');
  });

  it('pipe from arraystream to arraystream', async () => {
    const input = 'chunk';
    const inputStream = toArrayStream(input);
    const outputStream = new ArrayStream();
    pipe(inputStream, outputStream);
    expect(await readToEnd(outputStream)).to.equal('chunk');
  });

  it('transform non-stream', async () => {
    const input = 'chunk';
    const transformed = transform(input, (str: string) => str.toUpperCase());
    expect(transformed).to.equal('CHUNK');
  });

  it('transform partially-read non-stream', async () => {
    const input = new String('chunk\nanother chunk');
    const reader = getReader(input);
    await reader.readLine();
    reader.releaseLock();
    const transformed = transform(input, (str: string) => str.toUpperCase());
    expect(transformed).to.equal('ANOTHER CHUNK');
  });

  it('transform arraystream', async () => {
    const input = 'chunk';
    const inputStream = toArrayStream(input);
    const transformed = transform(inputStream, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transform partially-read arraystream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toArrayStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    const transformed = transform(inputStream, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('ANOTHER CHUNK');
  });

  it('transform stream', async () => {
    const input = 'chunk';
    const inputStream = toStream(input);
    const transformed = transform(inputStream, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transform partially-read stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    const transformed = transform(inputStream, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('ANOTHER CHUNK');
  });

  it('transformAsync non-stream', async () => {
    const input = 'chunk';
    const transformed = await transformAsync(input, async (str: string) => str.toUpperCase());
    expect(transformed).to.equal('CHUNK');
  });

  it('transformAsync partially-read non-stream', async () => {
    const input = new String('chunk\nanother chunk');
    const reader = getReader(input);
    await reader.readLine();
    reader.releaseLock();
    const transformed = await transformAsync(input, async (str: string) => str.toUpperCase());
    expect(transformed).to.equal('ANOTHER CHUNK');
  });

  it('transformAsync arraystream', async () => {
    const input = 'chunk';
    const inputStream = toArrayStream(input);
    const transformed = await transformAsync(inputStream, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transformAsync partially-read arraystream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toArrayStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    const transformed = await transformAsync(inputStream, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('ANOTHER CHUNK');
  });

  it('transformAsync stream', async () => {
    const input = 'chunk';
    const inputStream = toStream(input);
    const transformed = await transformAsync(inputStream, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transformAsync partially-read stream', async () => {
    const input = 'chunk\nanother chunk';
    const inputStream = toStream(input);
    const reader = getReader(inputStream);
    await reader.readLine();
    reader.releaseLock();
    const transformed = await transformAsync(inputStream, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('ANOTHER CHUNK');
  });
});
