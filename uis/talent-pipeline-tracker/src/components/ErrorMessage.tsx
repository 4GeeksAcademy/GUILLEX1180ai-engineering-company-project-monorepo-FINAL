import Link from "next/link";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
}

export default function ErrorMessage({
  title = "⚠️ Error",
  message,
  showBack = false,
}: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-red-800 mb-2">{title}</h2>
        <p className="text-red-600 mb-4">{message}</p>
        {showBack && (
          <Link
            href="/"
            className="inline-block text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Volver al listado
          </Link>
        )}
      </div>
    </div>
  );
}
