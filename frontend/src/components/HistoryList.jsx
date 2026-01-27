/**
 * History List Component
 * 
 * Displays list of zakat calculations (drafts + finalized)
 */

import { Link } from 'react-router-dom';
import CalculationStatusBadge from './CalculationStatusBadge';

export default function HistoryList({ calculations }) {
  if (calculations.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">لا توجد حسابات سابقة</p>
      </div>
    );
  }

  return (
    <div className="card border-2 border-blue-100">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th>وعاء الزكاة</th>
              <th>مبلغ الزكاة</th>
              <th>الإجراءات</th>
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
                  <td className="font-medium text-gray-800">
                    {displayDate ? new Date(displayDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'غير محدد'}
                  </td>
                  <td className="font-bold text-gray-900">
                    {parseFloat(calc.zakat_base).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">د.ج</span>
                  </td>
                  <td className="font-bold text-green-700 text-lg">
                    {parseFloat(calc.zakat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-green-600">د.ج</span>
                  </td>
                  <td>
                    <Link
                      to={`/zakat?calculation_id=${calc.calculation_id || calc.id}`}
                      className="text-blue-700 hover:text-blue-900 text-sm font-bold hover:underline"
                    >
                      {isDraft ? 'متابعة' : 'فتح الحساب'}
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
