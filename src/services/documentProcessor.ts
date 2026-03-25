export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    // Instantiate the worker
    const worker = new Worker(new URL('../workers/documentWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      // Filter out internal messages (like Vite HMR in dev mode)
      if (e.data && typeof e.data.success === 'boolean') {
        if (e.data.success) {
          resolve(e.data.text);
        } else {
          reject(new Error(e.data.error || "Unknown worker error"));
        }
        worker.terminate();
      } else {
        console.debug("Worker received non-result message:", e.data);
      }
    };

    worker.onerror = (err) => {
      reject(new Error(err.message));
      worker.terminate();
    };

    worker.postMessage({ file, extension });
  });
}
