import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";

// Set worker source for pdfjs. Need to ensure it points to the correct build
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
