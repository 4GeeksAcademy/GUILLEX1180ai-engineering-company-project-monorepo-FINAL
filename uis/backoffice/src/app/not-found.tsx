import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-tf-dark">404</h1>
      <p className="mt-2 text-gray-500">Página no encontrada</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}