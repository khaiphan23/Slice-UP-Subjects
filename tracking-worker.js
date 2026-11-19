// The pinned MediaPipe WASM loader uses importScripts(), which needs a classic worker.
let models, readTrackingFrame;

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      if (typeof OffscreenCanvas !== 'function') throw new Error('OffscreenCanvas unavailable');
      const tracking = await import('./tracking-models.js');
      models = await tracking.createTrackingModels(() => new OffscreenCanvas(1, 1));
      readTrackingFrame = tracking.readTrackingFrame;
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
    }
    return;
  }
  if (data.type !== 'frame') return;

  const { bitmap, timestamp, includePose, generation } = data;
  try {
    const result = readTrackingFrame(models, bitmap, timestamp, includePose);
    self.postMessage({ type: 'result', timestamp, generation, result });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  } finally {
    bitmap.close();
  }
};
