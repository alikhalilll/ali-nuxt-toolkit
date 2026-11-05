/**
 * `pendingImages` + `imageReady` — per-image load tracking.
 *
 * happy-dom doesn't implement real image decoding; we stub `img.complete`
 * and `img.decode()` to assert the pipeline wires up correctly.
 */
import { describe, expect, it, vi } from 'vitest';
import { imageReady, pendingImages } from '../src/utils/images';

describe('pendingImages', () => {
  it('filters out images that are already complete', () => {
    const root = document.createElement('div');
    const done = document.createElement('img');
    Object.defineProperty(done, 'complete', { get: () => true });
    const pending = document.createElement('img');
    Object.defineProperty(pending, 'complete', { get: () => false });
    root.append(done, pending);
    const result = pendingImages(root);
    expect(result).toEqual([pending]);
  });

  it('returns an empty array when the root has no images', () => {
    const root = document.createElement('div');
    expect(pendingImages(root)).toEqual([]);
  });
});

describe('imageReady', () => {
  it('resolves immediately when the image is already complete', async () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { get: () => true });
    await expect(imageReady(img)).resolves.toBeUndefined();
  });

  it('resolves on load event', async () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { get: () => false });
    const promise = imageReady(img);
    img.dispatchEvent(new Event('load'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves on error event (does not reject)', async () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { get: () => false });
    const promise = imageReady(img);
    img.dispatchEvent(new Event('error'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('calls image.decode() when available and swallows failures', async () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { get: () => true });
    const decode = vi.fn().mockRejectedValue(new Error('bad'));
    (img as unknown as { decode: () => Promise<void> }).decode = decode;
    await expect(imageReady(img)).resolves.toBeUndefined();
    expect(decode).toHaveBeenCalled();
  });
});
