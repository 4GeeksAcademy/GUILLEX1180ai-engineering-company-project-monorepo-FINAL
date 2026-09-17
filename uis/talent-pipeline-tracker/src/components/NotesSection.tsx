"use client";

import { useState, useEffect, useCallback } from "react";
import { getNotes, addNote, deleteNote } from "@/lib/api";
import type { Note } from "@/lib/types";

export default function NotesSection({ candidateId }: { candidateId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Cargar notas ────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes(candidateId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notas");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ─── Añadir nota ─────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNote.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const created = await addNote(candidateId, { content });
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al añadir nota");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Eliminar nota ───────────────────────────────────────────────────
  const handleDelete = async (noteId: string) => {
    if (!confirm("¿Eliminar esta nota?")) return;

    setDeletingId(noteId);
    try {
      await deleteNote(candidateId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar nota");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Notas</h2>

      {/* Formulario nueva nota */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escribe una nota…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !newNote.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "…" : "Añadir"}
        </button>
      </form>

      {/* Estado de carga */}
      {loading && <p className="text-sm text-gray-400">Cargando notas…</p>}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {/* Lista de notas */}
      {!loading && notes.length === 0 && (
        <p className="text-sm text-gray-400 italic">No hay notas aún.</p>
      )}

      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 border"
          >
            <div className="flex-1 mr-3">
              <p className="text-sm text-gray-800">{note.content}</p>
              {note.created_at && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(note.created_at).toLocaleDateString("es-ES")}
                  {note.created_by ? ` — ${note.created_by}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={deletingId === note.id}
              className="text-red-400 hover:text-red-600 text-sm disabled:opacity-50 flex-shrink-0"
              title="Eliminar nota"
            >
              {deletingId === note.id ? "…" : "🗑️"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
