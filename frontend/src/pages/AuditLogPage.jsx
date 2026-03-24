import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getCompanyAuditLogs } from '../api/auditLogs';

const ENTITY_OPTIONS = ['', 'FINANCIAL_ITEM', 'ZAKAT_CALCULATION', 'COMPANY'];
const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'START', 'RECALCULATE', 'FINALIZE', 'CREATE_REVISION', 'UPDATE_LANGUAGE'];

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function AuditLogPage() {
  const { t } = useTranslation();
  const { systemRole, role } = useAuth();
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = systemRole === 'ADMIN' || role === 'OWNER';

  useEffect(() => {
    async function load() {
      if (!canView) return;
      try {
        setLoading(true);
        setError('');
        const data = await getCompanyAuditLogs({ entityType, action, limit: 100 });
        setItems(data);
      } catch (err) {
        setError(err.message || t('audit_load_failed'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [action, canView, entityType, t]);

  const rows = useMemo(() => {
    return items.map((item) => {
      const changes = item.field_changes || {};
      const keys = Object.keys(changes);
      const firstKey = keys[0];
      const beforeValue = firstKey ? formatValue(changes[firstKey]?.before) : '-';
      const afterValue = firstKey ? formatValue(changes[firstKey]?.after) : '-';
      return {
        ...item,
        firstKey: firstKey || '-',
        beforeValue,
        afterValue,
      };
    });
  }, [items]);

  if (!canView) {
    return (
      <div className="card text-center py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('audit_title')}</h1>
        <p className="text-gray-600">{t('audit_not_available')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('audit_title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{t('audit_subtitle')}</p>
      </div>

      <div className="card border-2 border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input-field" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {ENTITY_OPTIONS.map((option) => (
              <option key={option || 'ALL'} value={option}>
                {option ? t(`audit_entity_${option.toLowerCase()}`) : t('audit_filter_all_entities')}
              </option>
            ))}
          </select>
          <select className="input-field" value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTION_OPTIONS.map((option) => (
              <option key={option || 'ALL'} value={option}>
                {option ? t(`audit_action_${option.toLowerCase()}`) : t('audit_filter_all_actions')}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={() => { setEntityType(''); setAction(''); }}>
            {t('audit_reset_filters')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-700 font-medium">{t('loading')}</div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">{t('audit_empty')}</p>
        </div>
      ) : (
        <div className="card border-2 border-blue-100">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('audit_user')}</th>
                  <th>{t('audit_transaction')}</th>
                  <th>{t('audit_date')}</th>
                  <th>{t('audit_field')}</th>
                  <th>{t('audit_before')}</th>
                  <th>{t('audit_after')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="text-sm">
                        <div className="font-semibold">#{row.actor_user_id || '-'}</div>
                        <div className="text-gray-500">{row.actor_system_role || '-'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="font-semibold">{t(`audit_action_${String(row.action).toLowerCase()}`)}</div>
                        <div className="text-gray-500">{t(`audit_entity_${String(row.entity_type).toLowerCase()}`)} #{row.entity_id || '-'}</div>
                      </div>
                    </td>
                    <td className="text-sm">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="text-sm font-semibold">{row.firstKey}</td>
                    <td className="text-sm">{row.beforeValue}</td>
                    <td className="text-sm">{row.afterValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
