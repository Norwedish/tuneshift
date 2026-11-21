"use client";

import { useCallback } from "react";
import {
  STORAGE_KEYS,
  isKind,
  isPlatform,
  isRecord,
  isString,
} from "@/lib/storage/local";
import { useLocalStore } from "./use-local-store";
import type { FavoriteEntry } from "@/types/music";

const MAX_FAVORITES = 500;

function sanitizeFavorites(value: unknown): FavoriteEntry[] {
  if (!Array.isArray(value)) return [];
  const favorites: FavoriteEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (!isString(item.id) || !isString(item.title) || !isString(item.url)) continue;
    if (!isPlatform(item.platform) || !isKind(item.kind)) continue;
    if (typeof item.addedAt !== "number") continue;
    favorites.push({
      id: item.id,
      addedAt: item.addedAt,
      platform: item.platform,
      kind: item.kind,
      title: item.title,
      url: item.url,
      ...(isString(item.subtitle) ? { subtitle: item.subtitle } : {}),
      ...(isString(item.artworkUrl) ? { artworkUrl: item.artworkUrl } : {}),
      ...(typeof item.durationMs === "number" ? { durationMs: item.durationMs } : {}),
    });
    if (favorites.length >= MAX_FAVORITES) break;
  }
  return favorites.sort((a, b) => b.addedAt - a.addedAt);
}

export function favoriteId(platform: string, kind: string, id: string): string {
  return `${platform}:${kind}:${id}`;
}

export function useFavorites() {
  const {
    value: favorites,
    setValue,
    hydrated,
    error: storageError,
  } = useLocalStore<FavoriteEntry[]>(STORAGE_KEYS.favorites, [], sanitizeFavorites);

  const isFavorite = useCallback(
    (id: string) => favorites.some((entry) => entry.id === id),
    [favorites],
  );

  const add = useCallback(
    (entry: Omit<FavoriteEntry, "addedAt">) => {
      setValue((previous) => {
        if (previous.some((existing) => existing.id === entry.id)) return previous;
        return [{ ...entry, addedAt: Date.now() }, ...previous].slice(0, MAX_FAVORITES);
      });
    },
    [setValue],
  );

  const remove = useCallback(
    (id: string) => {
      setValue((previous) => previous.filter((entry) => entry.id !== id));
    },
    [setValue],
  );

  const toggle = useCallback(
    (entry: Omit<FavoriteEntry, "addedAt">) => {
      let added = false;
      setValue((previous) => {
        const exists = previous.some((existing) => existing.id === entry.id);
        added = !exists;
        if (exists) return previous.filter((existing) => existing.id !== entry.id);
        return [{ ...entry, addedAt: Date.now() }, ...previous].slice(0, MAX_FAVORITES);
      });
      return added;
    },
    [setValue],
  );

  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return {
    favorites,
    hydrated,
    storageError,
    isFavorite,
    add,
    remove,
    toggle,
    clear,
  };
}
