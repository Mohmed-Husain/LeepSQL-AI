import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

const API_BASE_URL = "http://10.238.80.252:8000";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
}

export default function QueryInput({
  onSubmit,
  isProcessing,
}: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleUploadCsv = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/import-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setUploadStatus(data.message || "CSV imported successfully");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const closeCsvModal = () => {
    setShowCsvModal(false);
    setSelectedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-null p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">Upload CSV Data</h3>
              <button onClick={closeCsvModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />

            {selectedFile && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: {selectedFile.name}
              </p>
            )}

            {uploadStatus && (
              <p className={`mt-2 text-sm ${uploadStatus.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {uploadStatus}
              </p>
            )}

            <button
              onClick={handleUploadCsv}
              disabled={!selectedFile || isUploading}
              className="mt-4 w-full bg-blue-900 text-white py-2 px-4 rounded-null font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Confirm Upload"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Ask LeapSQL about your data…"
            rows={2}
            className="rounded-none flex-1 px-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-500"
          />
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-3 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Add CSV
          </button>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isProcessing}
            className="px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "Run Query"}
          </button>
        </div>
      </div>
    </>
  );
}
