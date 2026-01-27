/**
 * Rule Badge Component
 * 
 * Displays rule-driven status badges
 * Used to show zakatable/non-zakatable status based on backend decisions
 */

export default function RuleBadge({ included, zakatable }) {
  if (included !== undefined) {
    // From calculation result
    return (
      <span className={`badge ${included ? 'badge-success' : 'badge-danger'}`}>
        {included ? 'زكوي' : 'غير زكوي'}
      </span>
    );
  }

  if (zakatable !== undefined) {
    // From rule metadata
    return (
      <span className={`badge ${zakatable ? 'badge-info' : 'badge-danger'}`}>
        {zakatable ? 'قابل للزكاة' : 'غير قابل للزكاة'}
      </span>
    );
  }

  return null;
}
