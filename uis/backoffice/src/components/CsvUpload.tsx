// ──────────────────────────────────────────────
// CsvUpload — Componente de carga de CSV
// compatible con drag & drop y selector tradicional
// Backoffice TrackFlow
// ──────────────────────────────────────────────

"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface CsvUploadProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

export function CsvUpload({ onFileSelected, loading }: CsvUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleClick = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragOver
          ? "border-tf-blue bg-blue-50"
          : "border-gray-300 bg-white hover:border-tf-blue-light hover:bg-gray-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-tf-blue border-t-transparent" />
          <p className="text-gray-500">Analizando incidencias…</p>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tf-blue/10">
            <svg
              className="h-6 w-6 text-tf-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {selectedFile
              ? `📄 ${selectedFile.name}`
              : "Arrastra un archivo CSV aquí o haz clic para seleccionar"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Solo archivos .csv con incidencias de TrackFlow
          </p>
          {selectedFile && !loading && (
            <p className="mt-2 text-xs text-green-600">
              ✅ Archivo listo — se analizará automáticamente
            </p>
          )}
        </>
      )}
    </div>
  );
}