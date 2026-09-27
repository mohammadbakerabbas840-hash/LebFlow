import { useI18n, localeTags } from '../../i18n';
import { beirutNow } from '../../features/cases/caseStorage';

export function DateSuggestions({
  value,
  onChange,
  disabled = false,
  skipSunday = false,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  skipSunday?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <div
      className="date-suggestions"
      role="group"
      aria-label={
        { en: 'Choose a nearby date', ar: 'اختر تاريخًا قريبًا', fr: 'Choisir une date proche' }[
          locale
        ]
      }
    >
      {[1, 3, 7].map((offset) => {
        const day = new Date(`${beirutNow().date}T12:00:00Z`);
        day.setUTCDate(day.getUTCDate() + offset);
        if (skipSunday && day.getUTCDay() === 0) day.setUTCDate(day.getUTCDate() + 1);
        const date = day.toISOString().slice(0, 10);
        return (
          <button
            key={offset}
            type="button"
            disabled={disabled}
            aria-pressed={value === date}
            onClick={() => onChange(date)}
          >
            {new Intl.DateTimeFormat(localeTags[locale], {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            }).format(day)}
          </button>
        );
      })}
    </div>
  );
}
