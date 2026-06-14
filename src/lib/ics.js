// Client-side "Add to calendar" — builds a one-event .ics and downloads it.
// All-day format (DTEND is exclusive per RFC 5545, so +1 day past the end).
const pad = (n) => String(n).padStart(2, "0");
const dstamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const dateOnly = (iso) => iso.replaceAll("-", "");
const esc = (s = "") => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function downloadIcs(ev) {
  const start = dateOnly(ev.start);
  const endIso = ev.end || ev.start;
  const [y, m, d] = endIso.split("-").map(Number);
  const endEx = new Date(Date.UTC(y, m - 1, d + 1)); // exclusive end
  const end = `${endEx.getUTCFullYear()}${pad(endEx.getUTCMonth() + 1)}${pad(endEx.getUTCDate())}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Troop 650//650rc.com//EN",
    "BEGIN:VEVENT",
    `UID:${ev.slug || ev.name}@650rc.com`,
    `DTSTAMP:${dstamp(new Date())}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(ev.name)}`,
    ev.place ? `LOCATION:${esc(ev.place)}` : null,
    "DESCRIPTION:Troop 650 adventure — details at https://650rc.com",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ev.slug || "troop650-event")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
