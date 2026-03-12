/**
 * Academic References Configuration
 *
 * Centralized metadata for academic / research sources that
 * underpin the Zakat calculation methodology in this application.
 *
 * NOTE:
 * - Keep this file free of long-form dissertation text.
 * - Store only structured metadata and short, reusable statements.
 */

export const academicReferences = [
  {
    id: 'primary-phd-zakat-accounting',
    type: 'DISSERTATION',
    degree: 'Doctorate (PhD)',
    degreeAr: 'دكتوراه',
    field: 'Accounting & Financial Sciences',
    fieldAr: 'علوم المحاسبة والمالية',
    specialization: 'Corporate Finance',
    specializationAr: 'المالية المؤسسية',
    titleAr:
      'نحو وضع إطار تصوري لمحاسبة زكاة الأموال في المؤسسة الاقتصادية – من وجهة نظر ممارسي مهنة المحاسبة والتدقيق',
    titleEn:
      'Towards a conceptual framework for Zakat accounting in the economic institution – from the perspective of accounting and auditing professionals',
    titleFr:
      'Vers un cadre conceptuel pour la comptabilité de la Zakat dans l\'entreprise économique – du point de vue des praticiens de la comptabilité et de l\'audit',
    author: 'حساني سليم',
    supervisor: 'الأستاذ الدكتور العياشي أحمد',
    university: 'جامعة أحمد دراية – أدرار',
    defenseDate: '17/11/2024',
    year: '2024',
    committeeMembers: [],
    text: {
      methodologyStatementAr:
        'يعتمد هذا التطبيق في منهجيته وقواعده المحاسبية على أطروحة دكتوراه محكّمة في مجال محاسبة زكاة الأموال.',
      methodologyStatementEn:
        'This application relies on a peer-reviewed doctoral thesis in Zakat accounting for its methodology and accounting rules.',
      methodologyStatementFr:
        'Cette application s\'appuie sur une thèse de doctorat évaluée dans le domaine de la comptabilité de la Zakat pour sa méthodologie et ses règles comptables.',
      rulesStatementAr:
        'تم اشتقاق القواعد المحاسبية وتصنيف البنود المالية من الإطار التصوري المقترح في هذه الأطروحة.',
      disclaimerAr:
        'التطبيق أداة مساعدة، ولا يغني عن استشارة أهل الاختصاص الشرعي والمحاسبي قبل اتخاذ القرارات النهائية.',
      disclaimerEn:
        'This application is a support tool and does not replace consulting Sharia and accounting specialists before making final decisions.',
      disclaimerFr:
        'Cette application est un outil d\'aide et ne remplace pas la consultation des spécialistes du droit musulman et de la comptabilité avant toute décision finale.',
      badgeLabelAr: 'مرجعية أكاديمية – بحث دكتوراه',
      badgeLabelEn: 'Academic reference – doctoral research',
      badgeLabelFr: 'Référence académique – recherche doctorale',
      badgeStatementAr: 'يتم اعتماد هذه الأطروحة كمرجع أكاديمي أساسي للإطار التصوري لمحاسبة زكاة الأموال في هذا التطبيق.',
      badgeStatementEn: 'This thesis is adopted as the primary academic reference for the conceptual framework of Zakat accounting in this application.',
      badgeStatementFr: 'Cette thèse est adoptée comme référence académique principale pour le cadre conceptuel de la comptabilité de la Zakat dans cette application.',
    },
  },
];

/**
 * Get the primary academic reference used by the application.
 * If multiple references are added in the future, this can be
 * extended with selection logic (e.g., based on type or priority).
 */
export function getPrimaryReference() {
  return academicReferences[0] || null;
}

export default academicReferences;

