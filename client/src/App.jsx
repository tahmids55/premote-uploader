import { useState } from "react";
import axios from "axios";
import UploadCard from "./components/UploadCard.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setError("");
    setResult(null);
    setProgress(0);
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const total = event.total || 1;
          const value = Math.round((event.loaded / total) * 100);
          setProgress(value);
        }
      });

      setProgress(100);
      setResult(response.data);
    } catch (uploadError) {
      if (!uploadError.response) {
        setError(
          "Upload failed: backend is unreachable. Check if server is running and MongoDB is connected."
        );
      } else if (uploadError.response.status === 413) {
        setError("Upload failed: file is too large (limit is 20MB).");
      } else {
        setError(uploadError.response?.data?.message || "Upload failed.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <h1>Personal Cloud Uploader</h1>
        <p>Upload files to the owner's fixed Google Drive folder.</p>
      </section>

      <UploadCard
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        isUploading={isUploading}
        progress={progress}
        result={result}
        error={error}
      />
    </main>
  );
}
