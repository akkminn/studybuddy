import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
// @ts-ignore - Vite handles the ?url import correctly
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Use Vite's ?url import to bundle the worker directly instead of fetching from unpkg, preventing CORS/COOP issues
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

self.onmessage = async (e: MessageEvent) => {
  const { file, extension } = e.data;
  try {
    let text = "";
    if (extension === "txt") {
      text = await file.text();
    } else if (extension === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else if (extension === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
    } else {
      throw new Error("Unsupported file format");
    }
    
    self.postMessage({ success: true, text });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message || "Failed to process document" });
  }
};
