import { useEffect, useState } from "react";
import "./LoadingButton.css";

function LoadingButton({ onUpload, label = "Upload Document", isUploading = false }) {
  const [progress, setProgress] = useState(0);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onUpload) {
      onUpload();
    }
  };

  useEffect(() => {
    if (!isUploading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isUploading]);

  return (
    <button
      className="loading-button"
      onClick={handleClick}
      disabled={isUploading}
    >
      <span
        className="loading-fill"
        style={{ width: `${progress}%` }}
      />
      <span className="button-text" style={{ color: isUploading ? '#fff' : 'inherit' }}>
        {isUploading ? (progress === 100 ? 'Uploaded!' : `${progress}%`) : label}
      </span>
    </button>
  );
}

export default LoadingButton;

