/**
 * Flag icon component
 *
 * Uses inline SVGs so flags always render correctly without relying on
 * external CDNs or emoji fonts (which can be unreliable on Windows).
 */

const FLAG_SIZE = 40;

const COUNTRY_CODES = {
  ar: 'sa', // Arabic - Saudi Arabia
  fr: 'fr', // French - France
  en: 'gb', // English - UK
};

function SaudiFlag({ size }) {
  const height = Math.round((size * 2) / 3);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 3 2"
      className="inline-block rounded-sm"
      aria-hidden="true"
    >
      <rect width="3" height="2" fill="#006c35" />
      {/* Simple stylised shahada + sword indication, not detailed */}
      <rect x="0.4" y="0.6" width="2.2" height="0.25" fill="#ffffff" opacity="0.9" rx="0.05" />
      <rect x="0.9" y="1.1" width="1.2" height="0.08" fill="#ffffff" rx="0.04" />
    </svg>
  );
}

function FranceFlag({ size }) {
  const height = Math.round((size * 2) / 3);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 3 2"
      className="inline-block rounded-sm"
      aria-hidden="true"
    >
      <rect width="1" height="2" x="0" fill="#0055a4" />
      <rect width="1" height="2" x="1" fill="#ffffff" />
      <rect width="1" height="2" x="2" fill="#ef4135" />
    </svg>
  );
}

function UKFlag({ size }) {
  const height = Math.round((size * 2) / 3);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 3 2"
      className="inline-block rounded-sm"
      aria-hidden="true"
    >
      <rect width="3" height="2" fill="#012169" />
      {/* White diagonals */}
      <polygon points="0,0 0.35,0 3,1.3 3,2 2.65,2 0,0.7" fill="#ffffff" />
      <polygon points="3,0 2.65,0 0,1.3 0,2 0.35,2 3,0.7" fill="#ffffff" />
      {/* Red diagonals */}
      <polygon points="0,0 0.2,0 3,1.2 3,1.4" fill="#c8102e" />
      <polygon points="3,0 2.8,0 0,1.2 0,1.4" fill="#c8102e" />
      {/* Central white cross */}
      <rect x="1.15" width="0.7" height="2" fill="#ffffff" />
      <rect y="0.65" width="3" height="0.7" fill="#ffffff" />
      {/* Central red cross */}
      <rect x="1.3" width="0.4" height="2" fill="#c8102e" />
      <rect y="0.8" width="3" height="0.4" fill="#c8102e" />
    </svg>
  );
}

export default function FlagIcon({ langCode, size = FLAG_SIZE, className = '' }) {
  const countryCode = COUNTRY_CODES[langCode] || 'sa';
  const commonProps = { size };

  let FlagComponent;
  if (countryCode === 'fr') FlagComponent = FranceFlag;
  else if (countryCode === 'gb') FlagComponent = UKFlag;
  else FlagComponent = SaudiFlag;

  return (
    <span className={className}>
      <FlagComponent {...commonProps} />
    </span>
  );
}

export { COUNTRY_CODES };
