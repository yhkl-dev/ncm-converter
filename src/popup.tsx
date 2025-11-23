import { useCallback, useRef, useState } from "react";
import "./popup.css";
import { I18nProvider, useI18n } from "./i18n/context";

function PopupContent() {
  const { t, language, setLanguage } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [convertedInfo, setConvertedInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".ncm")) {
      setSelectedFile(file);
      setError("");
      setSuccess("");
      setProgress(0);
      setConvertedInfo(null);
    } else {
      setError(t('file.error'));
      setSelectedFile(null);
    }
  }, [t]);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) {
      setError(t('convert.start'));
      return;
    }

    setIsConverting(true);
    setError("");
    setSuccess("");
    setProgress(10);

    try {
      setProgress(20);
      const arrayBuffer = await selectedFile.arrayBuffer();

      setProgress(40);

      const { decryptNCM } = await import("~src/utils/ncmConverter");
      const result = await decryptNCM(arrayBuffer);

      setProgress(70);

      const metadata = result.metadata;
      const audioData = result.audioData;

      setProgress(85);

      const format = metadata?.format || "mp3";
      const mimeType = getMimeType(format);
      const filename = getOutputFileName(selectedFile.name, format);

      const blob = new Blob([audioData as any], { type: mimeType });

      setProgress(90);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);

      setConvertedInfo({
        filename,
        format,
        metadata
      });

      const artistName = metadata?.artist
        ? Array.isArray(metadata.artist)
          ? metadata.artist.join(", ")
          : metadata.artist
        : t('artist.unknown');

      setSuccess(
        t('convert.success', { filename })
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('artist.unknown');
      setError(t('convert.error', { error: errorMsg }));
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  }, [selectedFile, t]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="popup-container">
      <div className="popup-content">
        <div className="header-section">
          <div className="header-icon">🎵</div>
          <h1 className="header-title">{t('header.title')}</h1>
          <p className="header-subtitle">{t('header.subtitle')}</p>
        </div>

        <div className="main-section">
          <div className="action-row">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ncm"
                onChange={handleFileSelect}
                className="hidden-input"
              />

              <button
                onClick={handleClick}
                disabled={isConverting}
                className={`file-button ${isConverting ? "disabled" : ""} ${selectedFile ? "selected" : ""}`}
              >
                <div className="file-button-content">
                  <div className="file-icon">
                    {selectedFile ? "✓" : "📁"}
                  </div>
                  <div className="file-text">
                    <div className="file-label">
                      {selectedFile ? t('file.selected') : t('file.selectNcm')}
                    </div>
                    {selectedFile && (
                      <div className="file-name">{selectedFile.name}</div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className={`convert-button ${!selectedFile || isConverting ? "disabled" : ""}`}
            >
              {isConverting ? (
                <>
                  <span className="spinner"></span>
                  {t('button.converting')}
                </>
              ) : (
                <>
                  <span className="button-icon">⚡</span>
                  {t('button.convert')}
                </>
              )}
            </button>
          </div>

          {isConverting && progress > 0 && (
            <div className="progress-section">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{t('progress.converting', { progress })}</div>
            </div>
          )}

          {error && (
            <div className="message error-message">
              <div className="message-icon">❌</div>
              <div className="message-text">{error}</div>
            </div>
          )}

          {success && (
            <div className="message success-message">
              <div className="message-icon">✨</div>
              <div className="message-text">{success}</div>
            </div>
          )}
        </div>

        <div className="footer-section">
          <p className="footer-text">{t('footer.text')}</p>
        </div>
      </div>
    </div>
  );
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    flac: "audio/flac",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    wav: "audio/wav"
  };
  return mimeTypes[format.toLowerCase()] || "application/octet-stream";
}

function getOutputFileName(inputPath: string, format: string): string {
  const baseName = inputPath.split(/[\\/]/).pop()?.split(".")[0] || "output";
  return `${baseName}.${format}`;
}

function IndexPopup() {
  return (
    <I18nProvider>
      <PopupContent />
    </I18nProvider>
  );
}

export default IndexPopup;
