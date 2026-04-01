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
    <div className="card">
      <div className="card__top">
        <div>
          <h2>Upload to Google Drive</h2>
          <p>Select a file and upload. It will be sent to the owner's folder.</p>
        </div>
      </div>

      <label className="file-picker" htmlFor="fileUpload">
        <input
          id="fileUpload"
          type="file"
          onChange={onFileChange}
          disabled={isUploading}
        />
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
    </div>
  );
}
