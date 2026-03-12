/**
 * Flag icon component - uses CDN images for reliable flag display on all platforms.
 * Emoji flags often render as text codes (SA, FR, GB) on Windows.
 */

const FLAG_CDN = 'https://flagcdn.com';
const FLAG_SIZE = 40;

const COUNTRY_CODES = {
  ar: 'sa', // Arabic - Saudi Arabia
  fr: 'fr', // French - France
  en: 'gb', // English - UK
};

export default function FlagIcon({ langCode, size = FLAG_SIZE, className = '' }) {
  const countryCode = COUNTRY_CODES[langCode] || 'sa';
  const src = `${FLAG_CDN}/w${size}/${countryCode}.png`;
  const srcSet = `${FLAG_CDN}/w${size}/${countryCode}.png 1x, ${FLAG_CDN}/w${size * 2}/${countryCode}.png 2x`;

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt=""
      width={size}
      height={Math.round(size * 2 / 3)}
      className={`inline-block object-cover rounded-sm ${className}`}
      loading="lazy"
    />
  );
}

export { COUNTRY_CODES };
