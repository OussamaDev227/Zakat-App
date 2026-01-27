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
    author: 'حساني سليم',
    supervisor: 'الأستاذ الدكتور العياشي أحمد',
    university: 'جامعة أحمد دراية – أدرار',
    defenseDate: '17/11/2024',
    year: '2024',
    // Optional: can be extended later with committee members and other details
    committeeMembers: [],
    text: {
      methodologyStatementAr:
        'يعتمد هذا التطبيق في منهجيته وقواعده المحاسبية على أطروحة دكتوراه محكّمة في مجال محاسبة زكاة الأموال.',
      rulesStatementAr:
        'تم اشتقاق القواعد المحاسبية وتصنيف البنود المالية من الإطار التصوري المقترح في هذه الأطروحة.',
      disclaimerAr:
        'التطبيق أداة مساعدة، ولا يغني عن استشارة أهل الاختصاص الشرعي والمحاسبي قبل اتخاذ القرارات النهائية.',
      badgeLabelAr: 'مرجعية أكاديمية – بحث دكتوراه',
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

