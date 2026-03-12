/**
 * Rule Badge Component
 *
 * Displays rule-driven status badges
 */

import { useTranslation } from 'react-i18next';

export default function RuleBadge({ included, zakatable }) {
  const { t } = useTranslation();

  if (included !== undefined) {
    return (
      <span className={`badge ${included ? 'badge-success' : 'badge-danger'}`}>
        {included ? t('zakatable') : t('not_zakatable')}
      </span>
    );
  }

  if (zakatable !== undefined) {
    return (
      <span className={`badge ${zakatable ? 'badge-info' : 'badge-danger'}`}>
        {zakatable ? t('zakatable_eligible') : t('not_zakatable_eligible')}
      </span>
    );
  }

  return null;
}
