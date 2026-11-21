import type { ApiErrorBody } from "@/types/api";
import type { MatchResult, Track } from "@/types/music";

export type TrackConversionState = "pending" | "matching" | "matched" | "uncertain" | "failed";

export interface TrackConversion {
  source: Track;
  state: TrackConversionState;
  match?: MatchResult;
  error?: ApiErrorBody["error"];
  /** Set when the user picked a different candidate than the top one. */
  manualSelection?: boolean;
}

export interface ConversionSummary {
  total: number;
  matched: number;
  uncertain: number;
  failed: number;
  pending: number;
}

export type ExportFormat = "txt" | "csv" | "json";

export function summarizeConversions(items: TrackConversion[]): ConversionSummary {
  return items.reduce<ConversionSummary>(
    (accumulator, item) => {
      accumulator.total += 1;
      if (item.state === "matched") accumulator.matched += 1;
      else if (item.state === "uncertain") accumulator.uncertain += 1;
      else if (item.state === "failed") accumulator.failed += 1;
      else accumulator.pending += 1;
      return accumulator;
    },
    { total: 0, matched: 0, uncertain: 0, failed: 0, pending: 0 },
  );
}

/** Best available destination track, manual override included. */
export function selectedTrack(item: TrackConversion): Track | undefined {
  if (!item.match) return undefined;
  if (item.manualSelection && item.match.best) return item.match.best.track;
  return item.match.best?.track;
}

export function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function exportConversions(
  items: TrackConversion[],
  format: ExportFormat,
  meta: { title: string; sourcePlatform: string; destinationPlatform: string },
): { filename: string; mime: string; content: string } {
  const slug = meta.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "tuneshift-conversion";

  const rows = items.map((item, index) => {
    const target = selectedTrack(item);
    return {
      position: index + 1,
      sourceTitle: item.source.title,
      sourceArtist: item.source.artists.map((artist) => artist.name).join(", "),
      destinationTitle: target?.title ?? "",
      destinationArtist: target?.artists.map((artist) => artist.name).join(", ") ?? "",
      confidence: item.match?.confidence ?? "none",
      status: item.state,
      url: target?.url ?? "",
    };
  });

  if (format === "json") {
    return {
      filename: `${slug}.json`,
      mime: "application/json",
      content: JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          exportedBy: "TuneShift",
          ...meta,
          tracks: rows,
        },
        null,
        2,
      ),
    };
  }

  if (format === "csv") {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = [
      "position",
      "source_title",
      "source_artist",
      "destination_title",
      "destination_artist",
      "confidence",
      "status",
      "url",
    ].join(",");
    const body = rows
      .map((row) =>
        [
          row.position,
          escape(row.sourceTitle),
          escape(row.sourceArtist),
          escape(row.destinationTitle),
          escape(row.destinationArtist),
          row.confidence,
          row.status,
          escape(row.url),
        ].join(","),
      )
      .join("\r\n");
    return { filename: `${slug}.csv`, mime: "text/csv", content: `${header}\r\n${body}` };
  }

  const lines = [
    `${meta.title}`,
    `${meta.sourcePlatform} → ${meta.destinationPlatform}`,
    `${rows.length} tracks · exported ${new Date().toLocaleDateString()}`,
    "",
    ...rows.map(
      (row) =>
        `${String(row.position).padStart(2, "0")}. ${row.destinationTitle || row.sourceTitle}${
          row.destinationArtist ? ` — ${row.destinationArtist}` : ""
        }${row.url ? `\n    ${row.url}` : ""}`,
    ),
  ];

  return { filename: `${slug}.txt`, mime: "text/plain", content: lines.join("\n") };
}
