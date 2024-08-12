export function seconds_to_display_time(seconds: number | string): string {
  const d = Number(seconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);

  return (
    (h > 0 ? h + 'h' : '') + (m > 0 ? m + 'm' : '') + (s > 0 ? s + 's' : '')
  );
}
