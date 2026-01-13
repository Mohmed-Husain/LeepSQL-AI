import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { ConnectionInfo } from "../types";

const API_BASE_URL = "http://localhost:8000";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
  connectionInfo?: ConnectionInfo;
}

export default function QueryInput({
  onSubmit,
  isProcessing,
  connectionInfo,
}: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
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
    if (!selectedFile || !tableName.trim()) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("table_name", tableName.trim());
      if (connectionInfo?.connectionString) {
        formData.append("connection_string", connectionInfo.connectionString);
      }

      const response = await fetch(`${API_BASE_URL}/api/import-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setUploadStatus(data.message || "CSV imported successfully");
      setSelectedFile(null);
      setTableName("");
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
    setTableName("");
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-null p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Upload CSV Data</h3>
              <button onClick={closeCsvModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="tableName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Table Name <span className="text-red-500">*</span>
              </label>
              <input
                id="tableName"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter the table name for this CSV"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This will be the name of the table created from the CSV file.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                CSV File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {selectedFile && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: {selectedFile.name}
              </p>
            )}

            {uploadStatus && (
              <p className={`mt-2 text-sm ${uploadStatus.includes("success") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {uploadStatus}
              </p>
            )}

            <button
              onClick={handleUploadCsv}
              disabled={!selectedFile || !tableName.trim() || isUploading}
              className="mt-4 w-full bg-blue-900 dark:bg-blue-700 text-white py-2 px-4 rounded-null font-medium hover:bg-blue-800 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Confirm Upload"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Ask LeapSQL about your data…"
            rows={2}
            className="rounded-none flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50 dark:disabled:bg-slate-700 disabled:text-slate-500"
          />
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Add CSV
          </button>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isProcessing}
            className="px-6 py-3 bg-black dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium hover:bg-gray-700 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-slate-300 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "Run Query"}
          </button>
        </div>
      </div>
    </>
  );
}
