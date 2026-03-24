import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { getAdminDashboard, getOwnerDashboard } from '../api/dashboard';

function KpiCard({ title, value, tone = 'blue' }) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-900',
  };
  return (
    <div className={`rounded-xl border-2 p-4 ${toneClasses[tone] || toneClasses.blue}`}>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function StatusBar({ draft = 0, finalized = 0, draftLabel, finalizedLabel }) {
  const total = draft + finalized;
  const draftPercent = total > 0 ? (draft / total) * 100 : 0;
  const finalizedPercent = total > 0 ? (finalized / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="h-3 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full bg-yellow-500 float-left" style={{ width: `${draftPercent}%` }} />
        <div className="h-full bg-green-600" style={{ width: `${finalizedPercent}%` }} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
        <span>{draftLabel}: {draft}</span>
        <span>{finalizedLabel}: {finalized}</span>
      </div>
    </div>
  );
}

function RecentCalculations({ items, emptyText, finalizedText, draftText, amountLabel }) {
  if (!items?.length) {
    return <p className="text-sm text-gray-600">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.calculation_id} className="rounded-lg border border-gray-200 px-4 py-3 flex justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">#{item.calculation_id}</p>
            <p className="text-sm text-gray-600">
              {item.status === 'FINALIZED' ? finalizedText : draftText}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">{Number(item.zakat_amount || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{amountLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { systemRole, role } = useAuth();
  const { hasCompanySession } = useCompany();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);

  const canViewAdminDashboard = systemRole === 'ADMIN';
  const canViewOwnerDashboard = systemRole !== 'ADMIN' && role === 'OWNER';
  const cannotViewDashboard = !canViewAdminDashboard && !canViewOwnerDashboard;

  const alerts = useMemo(() => {
    if (canViewAdminDashboard && adminData) {
      const items = [];
      if (adminData.users_inactive > 0) {
        items.push(t('dashboard_alert_inactive_users', { count: adminData.users_inactive }));
      }
      if (adminData.status_breakdown?.draft > 0) {
        items.push(t('dashboard_alert_admin_drafts', { count: adminData.status_breakdown.draft }));
      }
      return items;
    }
    if (canViewOwnerDashboard && ownerData) {
      const items = [];
      if (!hasCompanySession) {
        items.push(t('dashboard_alert_select_company'));
      }
      if (ownerData.calculations_total === 0) {
        items.push(t('dashboard_alert_no_calculations'));
      }
      if (ownerData.has_active_draft) {
        items.push(t('dashboard_alert_owner_has_draft'));
      }
      return items;
    }
    return [];
  }, [adminData, canViewAdminDashboard, canViewOwnerDashboard, hasCompanySession, ownerData, t]);

  useEffect(() => {
    async function loadDashboard() {
      if (cannotViewDashboard) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        if (canViewAdminDashboard) {
          const data = await getAdminDashboard();
          setAdminData(data);
          setOwnerData(null);
          return;
        }
        if (canViewOwnerDashboard) {
          const data = await getOwnerDashboard();
          setOwnerData(data);
          setAdminData(null);
        }
      } catch (err) {
        setError(err.message || t('dashboard_load_failed'));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [canViewAdminDashboard, canViewOwnerDashboard, cannotViewDashboard, t]);

  if (loading) {
    return <div className="text-center py-10 text-gray-700 font-medium">{t('loading')}</div>;
  }

  if (cannotViewDashboard) {
    return (
      <div className="card text-center py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard_title')}</h1>
        <p className="text-gray-600">{t('dashboard_not_available')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard_title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {canViewAdminDashboard ? t('dashboard_admin_subtitle') : t('dashboard_owner_subtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}

      {!!alerts.length && (
        <div className="card border-2 border-yellow-200 bg-yellow-50">
          <h2 className="text-lg font-bold text-yellow-900 mb-2">{t('dashboard_alerts_title')}</h2>
          <ul className="space-y-1 text-sm text-yellow-900">
            {alerts.map((message) => (
              <li key={message}>- {message}</li>
            ))}
          </ul>
        </div>
      )}

      {canViewAdminDashboard && adminData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title={t('dashboard_kpi_users_total')} value={adminData.users_total} />
            <KpiCard title={t('dashboard_kpi_users_active')} value={adminData.users_active} tone="green" />
            <KpiCard title={t('dashboard_kpi_companies_total')} value={adminData.companies_total} tone="gray" />
            <KpiCard title={t('dashboard_kpi_calculations_total')} value={adminData.calculations_total} tone="yellow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="card border-2 border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_status_distribution')}</h2>
              <StatusBar
                draft={adminData.status_breakdown?.draft || 0}
                finalized={adminData.status_breakdown?.finalized || 0}
                draftLabel={t('status_draft')}
                finalizedLabel={t('status_finalized')}
              />
            </section>
            <section className="card border-2 border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_recent_calculations')}</h2>
              <RecentCalculations
                items={adminData.recent_calculations}
                emptyText={t('dashboard_recent_empty')}
                finalizedText={t('status_finalized')}
                draftText={t('status_draft')}
                amountLabel={t('zakat_amount')}
              />
            </section>
          </div>

          <div className="card border-2 border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_quick_actions')}</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/users" className="btn-primary">{t('nav_admin')}</Link>
              <Link to="/companies" className="btn-secondary">{t('nav_companies')}</Link>
            </div>
          </div>
        </>
      )}

      {canViewOwnerDashboard && ownerData && (
        <>
          <div className="card border-2 border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{ownerData.company?.name}</h2>
            <p className="text-sm text-gray-600">
              {t('company_type')}: {ownerData.company?.legal_type} | {t('fiscal_year_label')} {ownerData.company?.fiscal_year_start} - {ownerData.company?.fiscal_year_end}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title={t('dashboard_kpi_calculations_total')} value={ownerData.calculations_total} />
            <KpiCard title={t('dashboard_kpi_draft_count')} value={ownerData.status_breakdown?.draft || 0} tone="yellow" />
            <KpiCard title={t('dashboard_kpi_finalized_count')} value={ownerData.status_breakdown?.finalized || 0} tone="green" />
            <KpiCard
              title={t('dashboard_kpi_latest_finalized_zakat')}
              value={ownerData.latest_finalized_zakat_amount != null ? Number(ownerData.latest_finalized_zakat_amount).toFixed(2) : '-'}
              tone="gray"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="card border-2 border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_status_distribution')}</h2>
              <StatusBar
                draft={ownerData.status_breakdown?.draft || 0}
                finalized={ownerData.status_breakdown?.finalized || 0}
                draftLabel={t('status_draft')}
                finalizedLabel={t('status_finalized')}
              />
            </section>
            <section className="card border-2 border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_recent_calculations')}</h2>
              <RecentCalculations
                items={ownerData.recent_calculations}
                emptyText={t('dashboard_recent_empty')}
                finalizedText={t('status_finalized')}
                draftText={t('status_draft')}
                amountLabel={t('zakat_amount')}
              />
            </section>
          </div>

          <div className="card border-2 border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard_quick_actions')}</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/zakat" className="btn-primary">{t('nav_zakat')}</Link>
              <Link to="/history" className="btn-secondary">{t('nav_history')}</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
