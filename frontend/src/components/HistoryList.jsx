/**
 * History List Component
 *
 * Displays list of zakat calculations (drafts + finalized)
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CalculationStatusBadge from './CalculationStatusBadge';

export default function HistoryList({ calculations }) {
  const { t } = useTranslation();

  if (calculations.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">{t('no_previous_calculations')}</p>
      </div>
    );
  }

  return (
    <div className="card border-2 border-blue-100">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('table_status')}</th>
              <th>{t('table_date')}</th>
              <th>{t('table_zakat_base')}</th>
              <th>{t('table_zakat_amount')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((calc) => {
              // Use calculation_date if available, otherwise use created_at
              const displayDate = calc.calculation_date || calc.created_at;
              const isDraft = calc.status === 'DRAFT';
              
              return (
                <tr key={calc.calculation_id || calc.id}>
                  <td>
                    <CalculationStatusBadge status={calc.status} />
                  </td>
                  <td className="font-medium text-gray-800 text-xs sm:text-sm">
                    {displayDate ? new Date(displayDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : t('date_unspecified')}
                  </td>
                  <td className="font-bold text-gray-900 text-sm sm:text-base">
                    {parseFloat(calc.zakat_base).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">{t('currency')}</span>
                  </td>
                  <td className="font-bold text-green-700 text-base sm:text-lg">
                    {parseFloat(calc.zakat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-green-600">{t('currency')}</span>
                  </td>
                  <td>
                    <Link
                      to={`/zakat?calculation_id=${calc.calculation_id || calc.id}`}
                      className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                    >
                      {isDraft ? t('continue_draft') : t('open_calculation')}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
