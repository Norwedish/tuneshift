"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardPaste,
  Clock3,
  Link2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchHistory } from "@/hooks/use-search-history";
import { useToast } from "@/components/providers/toast-provider";
import { parseMusicLink } from "@/lib/validation/links";
import { cn } from "@/lib/utils/cn";

export function SearchBar({
  initialValue = "",
  size = "hero",
  autoFocus = false,
  className,
}: {
  initialValue?: string;
  size?: "hero" | "compact";
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { searches, remember } = useSearchHistory();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const detection = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length < 8) return null;
    return parseMusicLink(trimmed);
  }, [value]);

  const looksLikeLink = Boolean(
    detection || /https?:\/\/|open\.spotify\.com|spotify:|youtube\.com|youtu\.be/i.test(value),
  );
  const isReadyLink = detection?.ok === true;

  const suggestions = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) return searches.slice(0, 5);
    return searches
      .filter((item) => item.toLowerCase().includes(trimmed) && item.toLowerCase() !== trimmed)
      .slice(0, 5);
  }, [searches, value]);

  const showSuggestions = focused && suggestions.length > 0 && !isReadyLink;

  function submit(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    if (looksLikeLink) {
      const parsed = parseMusicLink(trimmed);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      router.push(`/convert?url=${encodeURIComponent(trimmed)}`);
      return;
    }

    if (trimmed.length < 2) {
      setError("Type at least two characters.");
      return;
    }

    remember(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.info("Clipboard is empty");
        return;
      }
      setValue(text.trim());
      setError(null);
      inputRef.current?.focus();
    } catch {
      toast.error("Clipboard access was blocked", "Paste manually with Ctrl/Cmd + V.");
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((previous) => (previous + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((previous) => (previous <= 0 ? suggestions.length - 1 : previous - 1));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        event.preventDefault();
        setValue(suggestion);
        setActiveIndex(-1);
        submit(suggestion);
      }
      return;
    }
    if (event.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  const hero = size === "hero";

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(event) => {
        event.preventDefault();
        setFocused(false);
        setActiveIndex(-1);
        submit(value);
      }}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-[20px] border bg-surface transition-all duration-200",
          hero ? "p-1.5 pl-4 shadow-sm" : "p-1 pl-3.5 shadow-xs",
          error ? "border-danger/45" : "border-line-strong",
          "focus-within:border-pine/45 focus-within:ring-4 focus-within:ring-pine/10",
        )}
      >
        {looksLikeLink ? (
          <Link2 className="size-4 shrink-0 text-pine" aria-hidden />
        ) : (
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
        )}

        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Let a suggestion click land before the list unmounts.
            window.setTimeout(() => setFocused(false), 120);
          }}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          type="text"
          inputMode="search"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listId : undefined}
          aria-autocomplete="list"
          aria-label="Search for music or paste a link"
          aria-invalid={Boolean(error)}
          placeholder={
            hero ? "Search a song, artist, or paste a Spotify / YouTube link" : "Search or paste a link"
          }
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint",
            hero ? "h-11 text-[17px]" : "h-9 text-[15px]",
          )}
        />

        {isReadyLink ? (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-1 font-mono text-[15px] uppercase tracking-wider text-muted sm:flex">
            {detection?.platform === "spotify" ? "Spotify" : "YouTube"}
            <ArrowRight className="size-2.5" aria-hidden />
            {detection?.platform === "spotify" ? "YT Music" : "Spotify"}
          </span>
        ) : null}

        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setError(null);
              inputRef.current?.focus();
            }}
            aria-label="Clear"
            className="shrink-0 rounded-md p-1 text-faint transition-colors hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={pasteFromClipboard}
            aria-label="Paste from clipboard"
            title="Paste a link"
            className="hidden shrink-0 rounded-md p-1.5 text-faint transition-colors hover:text-ink sm:block"
          >
            <ClipboardPaste className="size-3.5" aria-hidden />
          </button>
        )}

        <Button
          type="submit"
          size={hero ? "md" : "sm"}
          className={cn("shrink-0", hero ? "h-11 rounded-[16px] px-5" : "rounded-[12px]")}
        >
          {looksLikeLink ? "Convert" : "Search"}
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 pl-1 text-[15px] text-danger">
          {error}
        </p>
      ) : null}

      {showSuggestions ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Recent searches"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden glass rounded-[18px] p-1"
        >
          <p className="px-2.5 py-1.5 font-mono text-[15px] uppercase tracking-[0.14em] text-faint">
            {value.trim() ? "Matching searches" : "Recent searches"}
          </p>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                setValue(suggestion);
                setFocused(false);
                submit(suggestion);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[15px] transition-colors",
                index === activeIndex ? "bg-surface-2 text-ink" : "text-ink-2",
              )}
            >
              <Clock3 className="size-3.5 text-faint" aria-hidden />
              <span className="truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
