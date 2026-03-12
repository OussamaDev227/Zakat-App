/**
 * PDF Generator Utility for Zakat Calculation Reports
 *
 * Generates PDF reports with company information and calculation summary.
 * Uses i18n for labels so PDF language matches current UI language.
 */

import { jsPDF } from 'jspdf';
import i18n from '../i18n';

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

    const lang = (i18n.language || 'ar').split('-')[0];
    const isRtl = lang === 'ar';
    doc.setR2L(isRtl);

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

    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
    const formatDate = (dateString) => {
      if (!dateString) return i18n.t('date_unspecified');
      const date = new Date(dateString);
      return date.toLocaleString(locale, {
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
    const titleText = i18n.t('report_title');
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
    doc.text(i18n.t('company_info'), pageWidth - margin, yPosition, { align: isRtl ? 'right' : 'left' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (calculation.company_name) {
      const companyNameHeight = addText(
        `${i18n.t('company_name_pdf')} ${calculation.company_name}`,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += companyNameHeight + 5;
    }

    if (calculation.company_type) {
      const companyTypeText = calculation.company_type === 'LLC'
        ? i18n.t('company_type_llc_pdf')
        : calculation.company_type === 'SOLE_PROPRIETORSHIP'
        ? i18n.t('company_type_sole_pdf')
        : `${i18n.t('company_type')}: ${calculation.company_type}`;
      
      const companyTypeHeight = addText(
        companyTypeText,
        pageWidth - margin,
        yPosition,
        { fontSize: 12, maxWidth: contentWidth }
      );
      yPosition += companyTypeHeight + 5;
    }

    const fiscalYear = formatFiscalYear();
    if (fiscalYear) {
      const fiscalYearHeight = addText(
        `${i18n.t('fiscal_year_label')} ${fiscalYear}`,
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
    doc.text(i18n.t('summary'), pageWidth - margin, yPosition, { align: isRtl ? 'right' : 'left' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const displayDate = calculation.calculation_date || calculation.created_at;
    const dateText = `${i18n.t('calculation_date_label')} ${formatDate(displayDate)}`;
    const dateHeight = addText(
      dateText,
      pageWidth - margin,
      yPosition,
      { fontSize: 12, maxWidth: contentWidth }
    );
    yPosition += dateHeight + 5;

    const statusText = calculation.status === 'FINALIZED'
      ? `${i18n.t('table_status')}: ${i18n.t('status_finalized')}`
      : calculation.status === 'DRAFT'
      ? `${i18n.t('table_status')}: ${i18n.t('status_draft')}`
      : `${i18n.t('table_status')}: ${calculation.status}`;
    
    const statusHeight = addText(
      statusText,
      pageWidth - margin,
      yPosition,
      { fontSize: 12, maxWidth: contentWidth }
    );
    yPosition += statusHeight + 5;

    // Nisab value (if set)
    if (calculation.nisab_value != null) {
      const nisabText = `${i18n.t('nisab_value')}: ${formatCurrency(calculation.nisab_value)} ${i18n.t('currency')}`;
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
      const hawlExcludedText = `${i18n.t('items_excluded_hawl')}: ${calculation.items_excluded_hawl}`;
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
    const zakatBaseText = `${i18n.t('zakat_base_pdf')}: ${formatCurrency(calculation.zakat_base)} ${i18n.t('currency')}`;
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
      ? `${i18n.t('zakat_amount_pdf')}: ${formatCurrency(calculation.zakat_amount)} ${i18n.t('currency')} — ${i18n.t('below_nisab')}`
      : `${i18n.t('zakat_amount_pdf')}: ${formatCurrency(calculation.zakat_amount)} ${i18n.t('currency')}`;
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
    const footerText = `${i18n.t('report_generated_at')} ${formatDate(new Date().toISOString())}`;
    doc.text(footerText, pageWidth - margin, footerY, { align: isRtl ? 'right' : 'left' });

    const companyName = calculation.company_name || i18n.t('company');
    const date = displayDate ? new Date(displayDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const filename = `تقرير_زكاة_${companyName}_${date}.pdf`.replace(/\s+/g, '_');

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(i18n.t('pdf_generation_failed'));
  }
}
