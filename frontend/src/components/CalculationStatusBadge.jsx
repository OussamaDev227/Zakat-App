/**
 * Calculation Status Badge Component
 * 
 * Displays calculation status with color coding
 */

export default function CalculationStatusBadge({ status }) {
  if (status === 'DRAFT') {
    return (
      <span className="badge badge-warning bg-yellow-100 text-yellow-800 border-2 border-yellow-300 font-bold">
        مسودة
      </span>
    );
  }
  
  if (status === 'FINALIZED') {
    return (
      <span className="badge badge-success bg-green-100 text-green-800 border-2 border-green-300 font-bold">
        نهائي
      </span>
    );
  }
  
  return (
    <span className="badge bg-gray-100 text-gray-800 border-2 border-gray-300">
      {status}
    </span>
  );
}
