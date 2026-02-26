/**
 * Excel Upload Form Component
 * 
 * Upload Excel file, parse client-side, show preview with validation,
 * and import valid rows
 */

import { useState, useRef } from 'react';
import { parseExcelFile, validateExcelStructure } from '../utils/excelParser';
import { mapCategoryToZakatCode, getArabicLabel, categoryCodeToZakatClassification, CATEGORY_CODE_OPTIONS } from '../utils/categoryMapper';
import { importExcelItems } from '../api/excelUpload';

export default function ExcelUploadForm({ onImportComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  // Validate a single row
  function validateRow(row) {
    const errors = [];
    const warnings = [];
    
    // Validate category code
    if (!row.categoryCode || row.categoryCode.trim() === '') {
      errors.push('يرجى اختيار رمز الفئة');
    }
    
    // Validate amount
    if (row.amount === null || row.amount === undefined) {
      errors.push('المبلغ مطلوب');
    } else if (typeof row.amount !== 'number' || isNaN(row.amount)) {
      errors.push('المبلغ يجب أن يكون رقماً صحيحاً');
    } else if (row.amount < 0) {
      errors.push('المبلغ لا يمكن أن يكون سالباً');
    }
    
    // Determine row status
    const hasCategoryCode = row.categoryCode && row.categoryCode.trim() !== '';
    const hasValidAmount = row.amount !== null && row.amount !== undefined && 
                          typeof row.amount === 'number' && !isNaN(row.amount) && row.amount >= 0;
    
    let rowStatus = 'green'; // green, yellow, or red
    if (errors.length > 0 || !hasValidAmount) {
      rowStatus = 'red';
    } else if (!hasCategoryCode) {
      rowStatus = 'yellow';
    } else if (hasCategoryCode && hasValidAmount && row.isAutoMapped) {
      rowStatus = 'green';
    } else if (hasCategoryCode && hasValidAmount) {
      rowStatus = 'green'; // User corrected it
    }
    
    return {
      isValid: errors.length === 0 && hasCategoryCode && hasValidAmount,
      errors,
      warnings,
      rowStatus
    };
  }

  // Handle file selection
  async function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('يرجى اختيار ملف Excel بصيغة .xlsx فقط');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setImportResults(null);
    setLoading(true);

    try {
      // Parse Excel file
      const rows = await parseExcelFile(selectedFile);
      
      // Validate structure
      const structureValidation = validateExcelStructure(rows);
      if (!structureValidation.valid) {
        setError(`خطأ في بنية الملف: ${structureValidation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Map categories and validate each row
      const validated = rows.map(row => {
        const errors = [];
        const warnings = [];
        
        // Validate required fields
        if (!row.item_name || !row.item_name.trim()) {
          errors.push('اسم البند مطلوب');
        }
        
        if (!row.category || !row.category.trim()) {
          errors.push('الفئة مطلوبة');
        }
        
        if (row.amount === null || row.amount === undefined) {
          errors.push('المبلغ مطلوب');
        } else if (typeof row.amount === 'number' && row.amount < 0) {
          errors.push('المبلغ لا يمكن أن يكون سالباً');
        }
        
        // Map category (pass item_name for equity resolution)
        const mapped = mapCategoryToZakatCode(row.category, row.item_name);
        
        // Derive initial categoryCode from mapped result
        let initialCategoryCode = '';
        if (mapped.category === 'ASSET' && mapped.asset_type) {
          if (mapped.asset_type === 'CASH') initialCategoryCode = 'Cash';
          else if (mapped.asset_type === 'TRADING_GOODS' || mapped.asset_type === 'INVENTORY') initialCategoryCode = 'Trading Goods';  // INVENTORY = legacy
          else if (mapped.asset_type === 'PRODUCTION_INVENTORY') initialCategoryCode = 'Production Inventory';
          else if (mapped.asset_type === 'RECEIVABLE') initialCategoryCode = 'Receivable';
          else if (mapped.asset_type === 'FIXED_ASSET') initialCategoryCode = 'Fixed Assets';
        } else if (mapped.category === 'LIABILITY' && mapped.liability_code) {
          if (mapped.liability_code === 'SHORT_TERM_LIABILITY') initialCategoryCode = 'Liability';
          else if (mapped.liability_code === 'LONG_TERM_LIABILITY') initialCategoryCode = 'Long-term Loan';
        } else if (mapped.category === 'EQUITY' && mapped.equity_code) {
          if (mapped.equity_code === 'PAID_IN_CAPITAL') initialCategoryCode = 'Capital';
          else if (mapped.equity_code === 'RETAINED_EARNINGS') initialCategoryCode = 'Retained Earnings';
        }
        
        if (mapped.error && !initialCategoryCode) {
          // Only add error if we couldn't map it
          errors.push(mapped.error);
        }
        
        const isAutoMapped = !!initialCategoryCode && !mapped.error;
        
        // Create row object
        const rowObj = {
          ...row,
          mapped,
          categoryCode: initialCategoryCode, // Editable field
          amount: row.amount || 0, // Editable field (ensure it's a number)
          notes: row.notes || '', // Editable field
          errors,
          warnings,
          isAutoMapped
        };
        
        // Validate row to determine status
        const validation = validateRow(rowObj);
        rowObj.isValid = validation.isValid;
        rowObj.rowStatus = validation.rowStatus;
        rowObj.errors = validation.errors;
        rowObj.warnings = validation.warnings;
        
        return rowObj;
      });

      setParsedRows(rows);
      setValidatedRows(validated);
    } catch (err) {
      setError(`خطأ في قراءة الملف: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Prepare rows for submission (convert categoryCode to zakat classification)
  function prepareRowsForSubmission(rows) {
    return rows.map(row => {
      const zakatClassification = categoryCodeToZakatClassification(row.categoryCode);
      
      if (zakatClassification.error) {
        throw new Error(`Invalid category code for row ${row.row_number}: ${zakatClassification.error}`);
      }
      
      return {
        item_name: row.item_name,
        arabic_label: row.category, // Original category from Excel
        category_code: row.categoryCode,
        amount: row.amount,
        notes: row.notes || null,
        row_number: row.row_number, // Preserve for error reporting
        is_zakatable: zakatClassification.category === 'ASSET' && 
                     (zakatClassification.asset_type === 'CASH' || 
                      zakatClassification.asset_type === 'TRADING_GOODS' || 
                      zakatClassification.asset_type === 'RECEIVABLE'),
        // Include zakat classification for backend
        category: zakatClassification.category,
        asset_type: zakatClassification.asset_type,
        liability_code: zakatClassification.liability_code,
        equity_code: zakatClassification.equity_code,
        metadata: zakatClassification.metadata || {}
      };
    });
  }

  // Handle Create Items & Calculate
  async function handleCreateItemsAndCalculate() {
    // Validate all rows have category code
    const rowsWithoutCategory = validatedRows.filter(row => !row.categoryCode || row.categoryCode.trim() === '');
    if (rowsWithoutCategory.length > 0) {
      setError(`يرجى اختيار رمز الفئة لجميع الصفوف. يوجد ${rowsWithoutCategory.length} صف بدون رمز فئة`);
      return;
    }

    // Validate all amounts
    const rowsWithInvalidAmount = validatedRows.filter(row => 
      row.amount === null || row.amount === undefined || 
      typeof row.amount !== 'number' || isNaN(row.amount) || row.amount < 0
    );
    if (rowsWithInvalidAmount.length > 0) {
      setError(`يرجى إدخال مبلغ صحيح لجميع الصفوف. يوجد ${rowsWithInvalidAmount.length} صف بمبلغ غير صحيح`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const { submitForCalculation } = await import('../api/excelUpload');
      const preparedRows = prepareRowsForSubmission(validatedRows);
      const result = await submitForCalculation(preparedRows, true);
      
      if (onImportComplete) {
        onImportComplete(result);
      }
      
      // Navigate to calculation page if calculation was created
      if (result.calculation_id) {
        alert(`تم إنشاء ${preparedRows.length} بند وحساب الزكاة بنجاح`);
        // Optionally navigate: window.location.href = `/zakat?calculation_id=${result.calculation_id}`;
      }
    } catch (err) {
      setError(`فشل الإنشاء والحساب: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  // Handle Calculate Only
  async function handleCalculateOnly() {
    // Validate all rows have category code
    const rowsWithoutCategory = validatedRows.filter(row => !row.categoryCode || row.categoryCode.trim() === '');
    if (rowsWithoutCategory.length > 0) {
      setError(`يرجى اختيار رمز الفئة لجميع الصفوف. يوجد ${rowsWithoutCategory.length} صف بدون رمز فئة`);
      return;
    }

    // Validate all amounts
    const rowsWithInvalidAmount = validatedRows.filter(row => 
      row.amount === null || row.amount === undefined || 
      typeof row.amount !== 'number' || isNaN(row.amount) || row.amount < 0
    );
    if (rowsWithInvalidAmount.length > 0) {
      setError(`يرجى إدخال مبلغ صحيح لجميع الصفوف. يوجد ${rowsWithInvalidAmount.length} صف بمبلغ غير صحيح`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const { submitForCalculation } = await import('../api/excelUpload');
      const preparedRows = prepareRowsForSubmission(validatedRows);
      const result = await submitForCalculation(preparedRows, false);
      
      // Show calculation results
      setImportResults({
        calculation: result,
        mode: 'calculate_only'
      });
    } catch (err) {
      setError(`فشل الحساب: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  // Handle row field changes
  function handleRowChange(index, field, value) {
    const updatedRows = [...validatedRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };
    
    // Re-validate the row
    const validation = validateRow(updatedRows[index]);
    updatedRows[index] = {
      ...updatedRows[index],
      ...validation
    };
    
    setValidatedRows(updatedRows);
  }

  // Statistics
  const totalRows = validatedRows.length;
  const validRows = validatedRows.filter(r => r.isValid).length;
  const invalidRows = validatedRows.filter(r => !r.isValid).length;
  const needsReview = validatedRows.filter(r => r.rowStatus === 'yellow').length;
  const errorCount = validatedRows.reduce((sum, r) => sum + r.errors.length, 0);

  // Reset form
  function handleReset() {
    setFile(null);
    setParsedRows([]);
    setValidatedRows([]);
    setError(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="card border-2 border-blue-200 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">استيراد من ملف Excel</h2>
        <p className="text-gray-600">قم بتحميل ملف Excel يحتوي على البنود المالية</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-900 font-bold">{error}</p>
        </div>
      )}

      {!file && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              اختر ملف Excel (.xlsx)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-600">
              الملف يجب أن يحتوي على الأعمدة: item_name, category, amount, notes (اختياري)
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-700 font-medium">جاري قراءة الملف...</p>
        </div>
      )}

      {file && validatedRows.length > 0 && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">إجمالي الصفوف</p>
              <p className="text-2xl font-bold text-blue-700">{totalRows}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700 mb-1">صحيحة</p>
              <p className="text-2xl font-bold text-green-700">{validRows}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700 mb-1">تتطلب مراجعة</p>
              <p className="text-2xl font-bold text-yellow-700">{needsReview}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-700 mb-1">غير صحيحة</p>
              <p className="text-2xl font-bold text-red-700">{invalidRows}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-1">الأخطاء</p>
              <p className="text-2xl font-bold text-gray-700">{errorCount}</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">#</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">اسم البند</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">الفئة</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">رمز الفئة *</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">المبلغ *</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">ملاحظات</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">الحالة</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-900 border-b">الأخطاء</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedRows.map((row, index) => {
                    // Determine row background color based on status
                    let rowBgClass = 'bg-gray-50';
                    if (row.rowStatus === 'green') {
                      rowBgClass = 'bg-green-50';
                    } else if (row.rowStatus === 'yellow') {
                      rowBgClass = 'bg-yellow-50';
                    } else if (row.rowStatus === 'red') {
                      rowBgClass = 'bg-red-50';
                    }
                    
                    return (
                      <tr key={index} className={rowBgClass}>
                        <td className="px-4 py-2 border-b text-gray-700">{row.row_number}</td>
                        <td className="px-4 py-2 border-b font-bold text-gray-900">{row.item_name || '(فارغ)'}</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          {/* Show original category from Excel (read-only) */}
                          {row.category || '(فارغ)'}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {/* Editable Category Code dropdown */}
                          <select
                            value={row.categoryCode || ''}
                            onChange={(e) => handleRowChange(index, 'categoryCode', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm ${
                              !row.categoryCode || row.categoryCode.trim() === ''
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300 bg-white'
                            }`}
                            dir="rtl"
                          >
                            <option value="">غير محدد - يتطلب مراجعة</option>
                            {CATEGORY_CODE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 border-b">
                          {/* Editable Amount input */}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.amount || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleRowChange(index, 'amount', value);
                            }}
                            className={`w-full px-2 py-1 border rounded text-sm text-right ${
                              row.amount === null || row.amount === undefined || 
                              (typeof row.amount === 'number' && (isNaN(row.amount) || row.amount < 0))
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-300 bg-white'
                            }`}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          {/* Editable Notes input */}
                          <input
                            type="text"
                            value={row.notes || ''}
                            onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                            placeholder="ملاحظات (اختياري)"
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          {/* Status badge */}
                          {row.rowStatus === 'green' && (
                            <span className="badge badge-success">صحيح</span>
                          )}
                          {row.rowStatus === 'yellow' && (
                            <span className="badge badge-warning">يتطلب مراجعة</span>
                          )}
                          {row.rowStatus === 'red' && (
                            <span className="badge badge-danger">خطأ</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {/* Error messages */}
                          {row.errors && row.errors.length > 0 ? (
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {row.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-green-700">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="btn-secondary"
              disabled={importing}
            >
              إعادة اختيار ملف
            </button>
            {validatedRows.length > 0 && (
              <>
                <button
                  onClick={handleCreateItemsAndCalculate}
                  className="btn-primary"
                  disabled={importing || validRows === 0}
                >
                  {importing ? 'جاري المعالجة...' : 'إنشاء البنود وحساب الزكاة'}
                </button>
                <button
                  onClick={handleCalculateOnly}
                  className="btn-secondary"
                  disabled={importing || validRows === 0}
                >
                  {importing ? 'جاري الحساب...' : 'حساب الزكاة فقط'}
                </button>
              </>
            )}
            <button
              onClick={onCancel}
              className="btn-secondary"
              disabled={importing}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {importResults && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          {importResults.mode === 'calculate_only' && importResults.calculation ? (
            // Calculate Only Results
            <div>
              <p className="text-green-900 font-bold text-lg mb-4">نتائج حساب الزكاة</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-sm text-gray-700 mb-1">وعاء الزكاة</p>
                  <p className="text-2xl font-bold text-green-700">
                    {parseFloat(importResults.calculation.zakat_base || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg">د.ج</span>
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-sm text-gray-700 mb-1">مبلغ الزكاة (2.5%)</p>
                  <p className="text-2xl font-bold text-green-700">
                    {parseFloat(importResults.calculation.zakat_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg">د.ج</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                ملاحظة: هذا حساب مؤقت. يمكنك إنشاء البنود وحفظ الحساب بالنقر على "إنشاء البنود وحساب الزكاة"
              </p>
            </div>
          ) : (
            // Create Items Results
            <>
              <p className="text-green-900 font-bold">
                تم استيراد {importResults.createdItems?.length || 0} بند بنجاح
              </p>
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 font-bold">فشل استيراد {importResults.errors.length} بند:</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {importResults.errors.map((err, i) => (
                      <li key={i}>صف {err.row_number}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
