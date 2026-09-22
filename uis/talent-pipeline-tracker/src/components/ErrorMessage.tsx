import Link from "next/link";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
  retryAction?: () => void;
}

export default function ErrorMessage({
  title = "⚠️ Error",
  message,
  showBack = false,
  retryAction,
}: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-red-800 mb-2">{title}</h2>
        <p className="text-red-600 mb-4">{message}</p>
        <div className="flex flex-col items-center gap-2">
          {retryAction && (
            <button
              onClick={retryAction}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          )}
          {showBack && (
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              ← Volver al listado
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
