import { expect } from 'chai';
// @ts-expect-error Missing type definitions
import { toStream, toArrayStream, readToEnd, slice, pipe, ArrayStream, transform, transformAsync, type Stream } from  '@openpgp/web-stream-tools';

describe('Common integration tests', () => {
  it('toStream/readToEnd', async () => {
    const input = 'chunk';
    const streamedData = toStream('chunk');
    expect(await readToEnd(streamedData)).to.equal(input);
  });

  it('slice', async () => {
    const input = 'another chunk';
    const streamedData = toStream(input);
    const slicedStream = slice(streamedData, 8);
    expect(await readToEnd(slicedStream)).to.equal('chunk');
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
    const inputStream: Stream<string> = toArrayStream(input);
    const outputStream = new ArrayStream();
    pipe(inputStream, outputStream);
    expect(await readToEnd(outputStream)).to.equal('chunk');
  });

  it('transform non-stream', async () => {
    const input = 'chunk';
    const transformed = transform(input, (str: string) => str.toUpperCase());
    expect(transformed).to.equal('CHUNK');
  });

  it('transform arraystream', async () => {
    const input = 'chunk';
    const streamedData: Stream<string> = toArrayStream(input);
    const transformed = transform(streamedData, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transform stream', async () => {
    const input = 'chunk';
    const streamedData = toStream(input);
    const transformed = transform(streamedData, (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transformAsync non-stream', async () => {
    const input = 'chunk';
    const transformed = await transformAsync(input, async (str: string) => str.toUpperCase());
    expect(transformed).to.equal('CHUNK');
  });

  it('transformAsync arraystream', async () => {
    const input = 'chunk';
    const streamedData: Stream<string> = toArrayStream(input);
    const transformed = await transformAsync(streamedData, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });

  it('transformAsync stream', async () => {
    const input = 'chunk';
    const streamedData = toStream(input);
    const transformed = await transformAsync(streamedData, async (str: string) => str.toUpperCase());
    expect(await readToEnd(transformed)).to.equal('CHUNK');
  });
});
