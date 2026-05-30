let pipe = null;

self.addEventListener('message', async (e) => {
  const msg = e.data;

  if (msg.type === 'init') {
    try {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        progress_callback: (data) => {
          self.postMessage({ type: 'progress', status: data.status, loaded: data.loaded, total: data.total });
        },
      });
      self.postMessage({ type: 'init_done' });
    } catch (e) {
      self.postMessage({ type: 'error', message: e.message });
    }
  } else if (msg.type === 'transcribe') {
    if (!pipe) {
      self.postMessage({ type: 'error', message: 'Pipeline not initialized' });
      return;
    }
    try {
      const samples = new Float32Array(msg.samples);
      const result = await pipe(samples, {
        top_k: 1,
        max_new_tokens: 448,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      self.postMessage({ type: 'result', text: result.text?.trim() || '' });
    } catch (e) {
      self.postMessage({ type: 'error', message: e.message });
    }
  }
});
