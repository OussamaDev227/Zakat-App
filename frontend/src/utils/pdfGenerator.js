/**
 * PDF Generator Utility for Zakat Calculation Reports
 * 
 * Generates PDF reports with company information and calculation summary
 * Supports RTL (Right-to-Left) layout for Arabic content
 */

import { jsPDF } from 'jspdf';

/**
 * Generate a PDF report for a zakat calculation
 * @param {Object} calculation - Calculation data object
 * @returns {Promise<void>} - Resolves when PDF is generated and downloaded
 */
export async function generateZakatReportPDF(calculation) {
  try {
    // Create new PDF document (A4 size, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set RTL direction for Arabic text
    doc.setR2L(true);

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 12,
        fontStyle = 'normal',
        align = 'right',
        maxWidth = contentWidth
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      // Split text into lines that fit within maxWidth
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      
      return lines.length * (fontSize * 0.4); // Return height used
    };

    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'غير محدد';
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
      return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Helper function to format fiscal year
    const formatFiscalYear = () => {
      if (calculation.fiscal_year_start && calculation.fiscal_year_end) {
        const start = new Date(calculation.fiscal_year_start);
        const end = new Date(calculation.fiscal_year_end);
        return `${start.getFullYear()} - ${end.getFullYear()}`;
      }
      return null;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34); // Green color matching theme
    const titleText = 'تقرير حساب الزكاة';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 15;

    // Divider line
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Company Information Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('معلومات الشركة', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Company Name
    if (calculation.company_name) {
      const companyNameHeight = addText(
        `اسم الشركة: ${calculation.company_name}`,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += companyNameHeight + 5;
    }

    // Company Type
    if (calculation.company_type) {
      const companyTypeText = calculation.company_type === 'LLC' 
        ? 'نوع الشركة: شركة ذات مسؤولية محدودة'
        : calculation.company_type === 'SOLE_PROPRIETORSHIP'
        ? 'نوع الشركة: مؤسسة فردية'
        : `نوع الشركة: ${calculation.company_type}`;
      
      const companyTypeHeight = addText(
        companyTypeText,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += companyTypeHeight + 5;
    }

    // Fiscal Year
    const fiscalYear = formatFiscalYear();
    if (fiscalYear) {
      const fiscalYearHeight = addText(
        `السنة المالية: ${fiscalYear}`,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += fiscalYearHeight + 5;
    }

    yPosition += 5;

    // Calculation Summary Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ملخص الحساب', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Calculation Date
    const displayDate = calculation.calculation_date || calculation.created_at;
    const dateText = `تاريخ الحساب: ${formatDate(displayDate)}`;
    const dateHeight = addText(
      dateText,
      pageWidth - margin,
      yPosition,
      { fontSize: 12, maxWidth: contentWidth }
    );
    yPosition += dateHeight + 5;

    // Status
    const statusText = calculation.status === 'FINALIZED' 
      ? 'الحالة: نهائي'
      : calculation.status === 'DRAFT'
      ? 'الحالة: مسودة'
      : `الحالة: ${calculation.status}`;
    
    const statusHeight = addText(
      statusText,
      pageWidth - margin,
      yPosition,
      { fontSize: 12, maxWidth: contentWidth }
    );
    yPosition += statusHeight + 5;

    // Nisab value (if set)
    if (calculation.nisab_value != null) {
      const nisabText = `قيمة النصاب: ${formatCurrency(calculation.nisab_value)} د.ج`;
      const nisabHeight = addText(
        nisabText,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += nisabHeight + 5;
    }

    // Items excluded due to Hawl
    if (calculation.items_excluded_hawl > 0) {
      const hawlExcludedText = `بنود مستبعدة (لم يمر عليها الحول): ${calculation.items_excluded_hawl}`;
      const hawlHeight = addText(
        hawlExcludedText,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += hawlHeight + 5;
    }

    yPosition += 5;

    // Zakat Base (highlighted)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    const zakatBaseText = `وعاء الزكاة: ${formatCurrency(calculation.zakat_base)} د.ج`;
    const zakatBaseHeight = addText(
      zakatBaseText,
      pageWidth - margin,
      yPosition,
      { fontSize: 16, maxWidth: contentWidth }
    );
    yPosition += zakatBaseHeight + 8;

    // Zakat Amount (highlighted)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    const zakatAmountText = calculation.below_nisab
      ? `مبلغ الزكاة (2.5%): ${formatCurrency(calculation.zakat_amount)} د.ج — لا زكاة (دون النصاب)`
      : `مبلغ الزكاة (2.5%): ${formatCurrency(calculation.zakat_amount)} د.ج`;
    const zakatAmountHeight = addText(
      zakatAmountText,
      pageWidth - margin,
      yPosition,
      { fontSize: 20, maxWidth: contentWidth }
    );
    yPosition += zakatAmountHeight + 15;

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    const footerText = `تم إنشاء التقرير في: ${formatDate(new Date().toISOString())}`;
    doc.text(footerText, pageWidth - margin, footerY, { align: 'right' });

    // Generate filename
    const companyName = calculation.company_name || 'شركة';
    const date = displayDate ? new Date(displayDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const filename = `تقرير_زكاة_${companyName}_${date}.pdf`.replace(/\s+/g, '_');

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
  }
}
