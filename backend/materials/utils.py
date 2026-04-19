import os

# Optional parsers
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

def extract_text_from_in_memory_file(file_obj, filename):
    """Safely extracts text from an in-memory file object."""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf' and PdfReader:
        text = ""
        file_obj.seek(0)
        reader = PdfReader(file_obj)
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    elif ext == 'docx' and DocxDocument:
        file_obj.seek(0)
        doc = DocxDocument(file_obj)
        return "\n".join([para.text for para in doc.paragraphs])
        
    elif ext in ['txt', 'md', 'csv']:
        file_obj.seek(0)
        return file_obj.read().decode('utf-8', errors='ignore')
            
    else:
        raise ValueError(f"Unsupported file format: {ext}")
