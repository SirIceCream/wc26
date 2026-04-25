export const APP_TIME_ZONE = "Europe/Vienna";
export const APP_TIME_ZONE_LABEL = "Vienna time";

export type MatchTimeParts = {
  compact: string;
  date: string;
  time: string;
};

export function formatViennaMatchTime(value: Date | string): MatchTimeParts {
  const date = typeof value === "string" ? new Date(value) : value;

  return {
    compact: `${formatViennaDate(date)} · ${formatViennaTime(date)}`,
    date: formatViennaDate(date),
    time: formatViennaTime(date),
  };
}

export function formatViennaDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatViennaTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    timeZoneName: "short",
  }).format(date);
}
