import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * LocalizedDateInput
 *
 * Wraps the native date input, but:
 * - Forces numeric yyyy-mm-dd format for value/onChange
 * - Shows a localized, human-readable date string under the field
 *   (so month/day names follow the UI language instead of OS settings)
 */

const FORMATTER_CACHE = {};

function getFormatter(lang) {
  const base = (lang || 'ar').split('-')[0];
  if (FORMATTER_CACHE[base]) return FORMATTER_CACHE[base];
  const formatter = new Intl.DateTimeFormat(base === 'ar' ? 'ar-EG' : base === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
  FORMATTER_CACHE[base] = formatter;
  return formatter;
}

export default function LocalizedDateInput({
  id,
  label,
  required = false,
  value,
  onChange,
  error,
  helperText,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'ar';
  const dir = lang.startsWith('ar') ? 'rtl' : 'ltr';

  const localizedText = useMemo(() => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return getFormatter(lang).format(date);
    } catch {
      return '';
    }
  }, [value, lang]);

  return (
    <div>
      <input
        id={id}
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'border-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
        // Keep digits left-to-right for clarity in all languages
        dir="ltr"
        lang={lang}
      />
      {localizedText && (
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-600" dir={dir}>
          {/* Show both stored ISO value and localized long form for clarity */}
          {value} — {localizedText}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-red-600 text-sm font-medium mt-1"
          role="alert"
          dir={dir}
        >
          {error}
        </p>
      )}
    </div>
  );
}

