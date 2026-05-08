export function buildICS(args: { userId: string; timezone: string; appUrl: string }): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const dtStartLocal = "T080000";  // 08:00 local
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PM Daily//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:pm-daily-${args.userId}@pmdaily.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${args.timezone}:${today}${dtStartLocal}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:PM Daily — 5 min",
    `DESCRIPTION:Today's quiz at ${args.appUrl}/today`,
    `URL:${args.appUrl}/today`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545: lines must be CRLF-separated
  return lines.join("\r\n");
}
