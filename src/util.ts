export function seconds_to_display_time(seconds: number | string): string {
  const d = Number(seconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);

  return (
    (h > 0 ? h + 'h' : '') + (m > 0 ? m + 'm' : '') + (s > 0 ? s + 's' : '')
  );
}

/**
 * Formats a duration in seconds as a clock, e.g. `83` as `1:23`. Preferred over
 * `seconds_to_display_time` in a column, where `1m23s` and `2m3s` would not line up.
 */
export function seconds_to_clock(seconds: number | string): string {
  const total = Math.floor(Number(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return [
    ...(h > 0 ? [String(h), String(m).padStart(2, '0')] : [String(m)]),
    String(s).padStart(2, '0'),
  ].join(':');
}

export function get_today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function get_one_week_ago(): Date {
  const now = new Date();
  const days = (now.getDay() + 7 - 1) % 7;
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now;
}
