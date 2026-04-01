import { useState } from "react";
import UploadCard from "./components/UploadCard.jsx";

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
    setProgress(20);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const responseText = await response.text();
      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        const detailedMessage = data?.details
          ? `${data?.message || "Upload failed"}: ${data.details}`
          : data?.message || `Upload failed (HTTP ${response.status})`;
        throw new Error(detailedMessage);
      }

      setProgress(100);
      setResult(data);
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
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
