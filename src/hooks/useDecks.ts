import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { DeckWithProgress } from "../types/deck";

export function useDecks() {
  const [decks, setDecks] = useState<DeckWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<DeckWithProgress[]>("fetch_decks")
      .then(setDecks)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { decks, loading, error };
}