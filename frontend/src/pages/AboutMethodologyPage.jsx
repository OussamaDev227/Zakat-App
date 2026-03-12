import { useEffect, useRef, useState } from 'react';
import { getPrimaryReference } from '../config/academicReferences';

export default function AboutMethodologyPage() {
  const ref = getPrimaryReference();
  const [showRules, setShowRules] = useState(false);
  const rulesSectionRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === '#rules') {
      setShowRules(true);
      // Scroll after initial render
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
        <h1 className="text-3xl font-bold text-gray-900">المرجعية العلمية للتطبيق</h1>
        <p className="text-gray-700 text-base">
          هذا النظام المعلوماتي لدعم قرار حساب زكاة الشركات مبني على إطار تصوري محاسبي وبحث أكاديمي محكّم في
          مستوى الدكتوراه.
        </p>
      </header>

      <section className="card border-2 border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              {ref.titleAr}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base text-gray-800">
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">الدرجة العلمية</dt>
                <dd>{ref.degreeAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">المجال</dt>
                <dd>{ref.fieldAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">التخصص</dt>
                <dd>{ref.specializationAr}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">الباحث</dt>
                <dd>{ref.author}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">المشرف</dt>
                <dd>{ref.supervisor}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">الجامعة</dt>
                <dd>{ref.university}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="font-semibold">تاريخ المناقشة</dt>
                <dd>{ref.defenseDate}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
              {ref.text.badgeLabelAr}
            </span>
            <p className="text-sm text-gray-500 text-left md:text-right leading-relaxed max-w-xs">
              يتم اعتماد هذه الأطروحة كمرجع أكاديمي أساسي للإطار التصوري لمحاسبة زكاة الأموال في هذا التطبيق.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="card border-2 border-blue-100 bg-blue-50">
          <h2 className="text-lg font-bold text-gray-900 mb-2">منهجية التطبيق</h2>
          <p className="text-gray-800 text-base leading-relaxed">
            {ref.text.methodologyStatementAr}
          </p>
        </div>

        <div className="card border-2 border-yellow-100 bg-yellow-50">
          <h2 className="text-lg font-bold text-gray-900 mb-2">تنبيه مهني وأكاديمي</h2>
          <p className="text-gray-800 text-base leading-relaxed">
            {ref.text.disclaimerAr}
          </p>
        </div>
      </section>

      <section className="card border-2 border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900 mb-3">العلاقة بين البيانات والقواعد والمرجعية العلمية</h2>
        <p className="text-gray-800 text-base leading-relaxed mb-2">
          يعتمد محرك الحساب في هذا التطبيق على قواعد محاسبية لتمييز البنود الزكوية من غير الزكوية، وتصنيف الأصول
          والالتزامات وفقاً للإطار التصوري المقترح في الأطروحة. يتم إدخال البيانات المالية من قبل المستخدم، بينما
          يتولى محرك القواعد المشتق من البحث الأكاديمي تطبيق المعايير المحاسبية الخاصة بزكاة الأموال للوصول إلى
          وعاء الزكاة ومبلغ الزكاة المقترح.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">
          تم تصميم هذا التطبيق كـ <span className="font-semibold">نظام دعم قرار</span> يساعد المحاسب والمراجع
          في توثيق المنهجية واستعراض القواعد المعتمدة، دون أن يحل محل الحكم المهني أو الفتوى الشرعية المتخصصة.
        </p>
      </section>

      <section
        id="rules"
        ref={rulesSectionRef}
        className="card border-2 border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">القواعد المعتمدة في الحساب</h2>
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="text-sm text-blue-700 hover:text-blue-900 underline decoration-dotted"
          >
            {showRules ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        </div>

        {showRules && (
          <div className="space-y-6">
            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">تصنيفات البنود المالية</h3>
              <p className="text-gray-800 text-base leading-relaxed mb-4">
                يعتمد التطبيق على تصنيف البنود المالية إلى فئات محاسبية رئيسية تساعد في تحديد ما يدخل في وعاء
                الزكاة وما يستبعد منه. هذه الفئات مستمدة من الإطار التصوري لمحاسبة زكاة الأموال في المؤسسة
                الاقتصادية.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">النقدية وما في حكمها</h4>
                  <p className="text-sm text-gray-700 mb-1">مثل الأرصدة البنكية والصندوق والودائع الجارية.</p>
                  <p className="text-sm font-semibold text-green-800">تُعتبر بالكامل ضمن وعاء الزكاة.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">عروض التجارة / البضاعة المعدة للبيع</h4>
                  <p className="text-sm text-gray-700 mb-1">البضاعة والسلع المعدة للبيع (عروض التجارة).</p>
                  <p className="text-sm font-semibold text-green-800">
                    تُعتبر ضمن وعاء الزكاة بقيمتها القابلة للتحقق (عروض تجارة).
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">المخزون الإنتاجي</h4>
                  <p className="text-sm text-gray-700 mb-1">المواد الأولية، والإنتاج تحت التصنيع، ومخزون التصنيع.</p>
                  <p className="text-sm font-semibold text-yellow-800">
                    يُصنّف حسب الإطار التصوري؛ لا يُعدّ بالضرورة عروض تجارة، وقد يحتاج تقديراً مهنياً وشرعياً.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">الذمم المدينة</h4>
                  <p className="text-sm text-gray-700 mb-1">الديون المستحقة للشركة على الغير.</p>
                  <p className="text-sm font-semibold text-green-800">
                    تُعتبر ضمن وعاء الزكاة إذا كانت مرجُوّة التحصيل، مع مراعاة المعالجة الخاصة للديون المشكوك فيها.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">الأصول الثابتة والمعنوية</h4>
                  <p className="text-sm text-gray-700 mb-1">مثل العقارات، الآلات، والبرمجيات المملوكة للاستعمال.</p>
                  <p className="text-sm font-semibold text-red-800">
                    لا تُعتبر في الأصل ضمن وعاء الزكاة، بينما يُراعى العائد الناتج عنها وفق الأحكام الشرعية.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">الاستثمارات طويلة الأجل</h4>
                  <p className="text-sm text-gray-700 mb-1">حصص أو مساهمات مخصصة للاحتفاظ طويل الأجل.</p>
                  <p className="text-sm font-semibold text-yellow-800">
                    قد تخضع للزكاة وفقاً لطبيعة الاستثمار وسياسة التوزيعات، وتحتاج لتقدير مهني وشرعي.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">الالتزامات ورأس المال</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">الخصوم قصيرة الأجل</h4>
                  <p className="text-sm text-gray-700 mb-1">الالتزامات المستحقة خلال دورة تشغيلية أو سنة واحدة.</p>
                  <p className="text-sm font-semibold text-green-800">
                    يتم خصم ما كان منها واجب الأداء فعلاً عند حولان الحول من وعاء الزكاة وفق ضوابط الأطروحة.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">الخصوم طويلة الأجل</h4>
                  <p className="text-sm text-gray-700 mb-1">الالتزامات التي تتجاوز فترة سنة مالية.</p>
                  <p className="text-sm font-semibold text-yellow-800">
                    لا يُخصم منها إلا الجزء المستحق خلال الفترة محل الزكاة وفقاً للمنهجية المحاسبية المعتمدة.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">رأس المال وحقوق الملكية</h4>
                  <p className="text-sm text-gray-700 mb-1">حقوق الملاك في صافي أصول الشركة.</p>
                  <p className="text-sm font-semibold text-gray-800">
                    لا يُعامل مباشرة كوعاء للزكاة، بل يتم احتساب الزكاة على وعاء صافي الأصول الزكوية وفقاً للإطار
                    التصوري.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">منطق التصنيف في التطبيق</h3>
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                عند إدخال البنود المالية في النظام، يتم ربط كل بند بفئة محاسبية (أصل / التزام) ونوع تفصيلي (مثل
                نقدية، عروض تجارة، مخزون إنتاجي، ذمم مدينة، أصول ثابتة، خصوم قصيرة الأجل، ...). يعتمد محرك القواعد
                على هذا التصنيف لتحديد ما إذا كان البند:
              </p>
              <ul className="list-disc pr-6 text-base text-gray-800 space-y-1">
                <li>يدخل بالكامل في وعاء الزكاة،</li>
                <li>يُستبعد من وعاء الزكاة،</li>
                <li>أو يحتاج إلى معالجة خاصة (مثل بعض أنواع الديون والاستثمارات).</li>
              </ul>
              <p className="text-gray-800 text-base leading-relaxed mt-3">
                يتم توثيق القواعد المطبقة عملياً في كل حساب من خلال قسم القواعد في تفاصيل الحساب، حيث يمكن للمستخدم
                مراجعة رموز القواعد وأوصافها العربية وسبب تطبيق كل قاعدة على بند معين.
              </p>
            </section>

            <section className="border-t border-yellow-100 pt-4 mt-2">
              <h3 className="text-base font-bold text-gray-900 mb-2">تنبيه مهني وأكاديمي</h3>
              <p className="text-gray-800 text-sm leading-relaxed">
                {ref.text.disclaimerAr}
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
          عرض القواعد المعتمدة في الحساب
        </button>
      </section>
    </div>
  );
}

