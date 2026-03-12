import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPrimaryReference } from '../config/academicReferences';

function getRefContentByLang(ref, lng) {
  if (!ref?.text) return null;
  const lang = (lng || 'ar').split('-')[0];
  const isAr = lang === 'ar';
  const isFr = lang === 'fr';
  return {
    title: isAr ? ref.titleAr : isFr ? ref.titleFr : ref.titleEn,
    methodologyStatement: isAr ? ref.text.methodologyStatementAr : isFr ? ref.text.methodologyStatementFr : ref.text.methodologyStatementEn,
    disclaimer: isAr ? ref.text.disclaimerAr : isFr ? ref.text.disclaimerFr : ref.text.disclaimerEn,
    badgeLabel: isAr ? ref.text.badgeLabelAr : isFr ? ref.text.badgeLabelFr : ref.text.badgeLabelEn,
    badgeStatement: isAr ? ref.text.badgeStatementAr : isFr ? ref.text.badgeStatementFr : ref.text.badgeStatementEn,
  };
}

export default function AboutMethodologyPage() {
  const { t, i18n } = useTranslation();
  const ref = getPrimaryReference();
  const [showRules, setShowRules] = useState(false);
  const rulesSectionRef = useRef(null);
  const refContent = ref ? getRefContentByLang(ref, i18n.language) : null;

  useEffect(() => {
    if (window.location.hash === '#rules') {
      setShowRules(true);
      setTimeout(() => {
        rulesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, []);

  if (!ref) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('methodology_page_title')}</h1>
        <p className="text-gray-700 text-base">{t('methodology_page_intro')}</p>
      </header>

      <section className="card border-2 border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              {refContent?.title ?? ref.titleAr}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base text-gray-800">
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_degree')}</dt>
                <dd>{ref.degreeAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_field')}</dt>
                <dd>{ref.fieldAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_specialization')}</dt>
                <dd>{ref.specializationAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_researcher')}</dt>
                <dd>{ref.author}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_supervisor')}</dt>
                <dd>{ref.supervisor}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_university')}</dt>
                <dd>{ref.university}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">{t('methodology_defense_date')}</dt>
                <dd>{ref.defenseDate}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
              {refContent?.badgeLabel ?? ref.text.badgeLabelAr}
            </span>
            <p className="text-sm text-gray-500 text-left md:text-right leading-relaxed max-w-xs">
              {refContent?.badgeStatement ?? ref.text.badgeStatementAr}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="card border-2 border-blue-100 bg-blue-50">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('methodology_app_methodology')}</h2>
          <p className="text-gray-800 text-base leading-relaxed">
            {refContent?.methodologyStatement ?? ref.text.methodologyStatementAr}
          </p>
        </div>

        <div className="card border-2 border-yellow-100 bg-yellow-50">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('methodology_professional_disclaimer')}</h2>
          <p className="text-gray-800 text-base leading-relaxed">
            {refContent?.disclaimer ?? ref.text.disclaimerAr}
          </p>
        </div>
      </section>

      <section className="card border-2 border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('methodology_rules_relation')}</h2>
        <p className="text-gray-800 text-base leading-relaxed mb-2">
          {t('methodology_relation_para1')}
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">
          {t('methodology_relation_para2')}
        </p>
      </section>

      <section
        id="rules"
        ref={rulesSectionRef}
        className="card border-2 border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{t('methodology_rules_section_title')}</h2>
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="text-sm text-blue-700 hover:text-blue-900 underline decoration-dotted"
          >
            {showRules ? t('methodology_hide_details') : t('methodology_show_details')}
          </button>
        </div>

        {showRules && (
          <div className="space-y-6">
            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">{t('methodology_classifications')}</h3>
              <p className="text-gray-800 text-base leading-relaxed mb-4">
                {t('methodology_classifications_intro')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_CASH')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_cash_desc')}</p>
                  <p className="text-sm font-semibold text-green-800">{t('methodology_cash_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_TRADING_GOODS')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_trading_desc')}</p>
                  <p className="text-sm font-semibold text-green-800">{t('methodology_trading_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_PRODUCTION_INVENTORY')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_production_inv_desc')}</p>
                  <p className="text-sm font-semibold text-yellow-800">{t('methodology_production_inv_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_RECEIVABLE')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_receivable_desc')}</p>
                  <p className="text-sm font-semibold text-green-800">{t('methodology_receivable_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('methodology_fixed_assets_title')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_fixed_assets_desc')}</p>
                  <p className="text-sm font-semibold text-red-800">{t('methodology_fixed_assets_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_LONG_TERM_INVESTMENT')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_investment_desc')}</p>
                  <p className="text-sm font-semibold text-yellow-800">{t('methodology_investment_zakat')}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">{t('methodology_liabilities_equity_title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_SHORT_TERM_LIABILITY')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_short_liab_desc')}</p>
                  <p className="text-sm font-semibold text-green-800">{t('methodology_short_liab_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('rule_LONG_TERM_LIABILITY')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_long_liab_desc')}</p>
                  <p className="text-sm font-semibold text-yellow-800">{t('methodology_long_liab_zakat')}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">{t('methodology_equity_capital_title')}</h4>
                  <p className="text-sm text-gray-700 mb-1">{t('methodology_equity_capital_desc')}</p>
                  <p className="text-sm font-semibold text-gray-800">{t('methodology_equity_capital_zakat')}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">{t('methodology_classification_logic')}</h3>
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                {t('methodology_classification_logic_para')}
              </p>
              <ul className="list-disc pr-6 text-base text-gray-800 space-y-1">
                <li>{t('methodology_classification_logic_list1')}</li>
                <li>{t('methodology_classification_logic_list2')}</li>
                <li>{t('methodology_classification_logic_list3')}</li>
              </ul>
              <p className="text-gray-800 text-base leading-relaxed mt-3">
                {t('methodology_classification_logic_para2')}
              </p>
            </section>

            <section className="border-t border-yellow-100 pt-4 mt-2">
              <h3 className="text-base font-bold text-gray-900 mb-2">{t('methodology_professional_disclaimer')}</h3>
              <p className="text-gray-800 text-sm leading-relaxed">
                {refContent?.disclaimer ?? ref.text.disclaimerAr}
              </p>
            </section>
          </div>
        )}
      </section>

      <section className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowRules(true);
            rulesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="btn-secondary text-sm"
        >
          {t('methodology_show_rules_button')}
        </button>
      </section>
    </div>
  );
}
