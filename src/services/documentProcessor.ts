export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    // Instantiate the worker
    const worker = new Worker(new URL('../workers/documentWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      if (e.data.success) {
        resolve(e.data.text);
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(new Error(err.message));
      worker.terminate();
    };

    worker.postMessage({ file, extension });
  });
}
