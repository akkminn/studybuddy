import React, { useState } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileText, File as FileIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Progress } from "../components/ui/progress";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { motion, AnimatePresence } from "motion/react";

export function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { uploadFile, loading, status, error, setError } = useDocumentUpload(user?.uid);

  React.useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => setProgress((p) => Math.min(p + (100 / 150), 99)), 100);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    uploadFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Upload Study Material</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">Upload a document to generate interactive quizzes and flashcards.</p>
      </div>

      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardContent className="p-12 text-center">
          <AnimatePresence mode="wait">
            {!loading ? (
              <motion.div
                key="upload-ui"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-6">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <FileUp size={40} />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {file ? file.name : "Select a file to upload"}
                </h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                  Support for PDF, DOCX, and TXT files. Max size 10MB.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} disabled={loading} />
                    <div className="inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900 h-10 px-4 py-2">
                      <span>{file ? "Change File" : "Browse Files"}</span>
                    </div>
                  </label>
                  {file && (
                    <Button onClick={handleUpload} disabled={loading} className="gap-2">
                      Generate Study Buddy
                      <CheckCircle2 size={18} />
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="mt-6 p-4 rounded-xl bg-rose-50 text-rose-600 flex items-center gap-3 justify-center">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div className="py-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-6 relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                  <FileText className="absolute inset-0 m-auto text-indigo-600" size={24} />
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Processing Document</h3>
                  <p className="text-sm text-slate-500 animate-pulse">{status}</p>
                </div>
                <Progress value={progress} className="max-w-xs mx-auto h-2" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Best Results
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>• Use clear, structured text documents.</p>
            <p>• Ensure the document is between 500 and 5000 words.</p>
            <p>• Avoid documents with only images or complex tables.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileIcon size={20} className="text-indigo-500" />
              Supported Formats
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>• <strong>.txt</strong> - Plain text files</p>
            <p>• <strong>.docx</strong> - Microsoft Word documents</p>
            <p>• <strong>.pdf</strong> - Portable Document Format (Text-based)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
