import type { Appointment } from '../types/case';
const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function appointmentCalendar(id: string, title: string, appointment: Appointment) {
  const date = appointment.date.replace(/-/g, '') + 'T' + appointment.time.replace(':', '') + '00';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LebFlow//Preparation planner//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${id}@lebflow.local`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=Asia/Beirut:${date}`,
    'DURATION:PT30M',
    `SUMMARY:${escape(title)}`,
    'STATUS:TENTATIVE',
    'DESCRIPTION:Personal planning reminder. This is not a confirmed government appointment.',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
export function downloadCalendar(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lebflow-planned-visit.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
