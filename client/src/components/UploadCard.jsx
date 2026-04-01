import { useMemo } from "react";

export default function UploadCard({
  selectedFile,
  onFileChange,
  onUpload,
  isUploading,
  progress,
  result,
  error
}) {
  const progressText = useMemo(() => `${Math.min(progress, 100)}%`, [progress]);

  return (
    <section className="card upload-card">
      <div className="card__top">
        <div>
          <h2>Upload to Google Drive</h2>
          <p>Choose your file and send it to the protected destination folder.</p>
        </div>
        <p className="upload-card__hint">Max file size: 20 MB</p>
      </div>

      <label className="file-picker" htmlFor="fileUpload">
        <span className="file-picker__title">Select file</span>
        <input
          id="fileUpload"
          type="file"
          onChange={onFileChange}
          disabled={isUploading}
        />
        {selectedFile ? (
          <span className="file-picker__name">{selectedFile.name}</span>
        ) : (
          <span className="file-picker__name file-picker__name--empty">
            No file selected
          </span>
        )}
      </label>

      <button
        className="btn btn--primary"
        onClick={onUpload}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </button>

      <div className="progress-wrap" aria-live="polite">
        <div className="progress-bar" style={{ width: progressText }} />
        <span>{progressText}</span>
      </div>

      {result?.webViewLink && (
        <p className="success-message">
          Uploaded successfully. Open file: <a href={result.webViewLink}>Google Drive Link</a>
        </p>
      )}

      {error && <p className="error-message">{error}</p>}
    </section>
  );
}
