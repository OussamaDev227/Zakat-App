/**
 * Excel Parser Utility
 * 
 * Client-side Excel file parsing using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract financial data rows
 * @param {File} file - Excel file (.xlsx)
 * @returns {Promise<Array>} Array of row objects with item_name, category, amount, notes, row_number
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, // Use first row as header
          defval: null, // Default value for empty cells
          raw: false // Convert numbers to strings for processing
        });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        // Find header row (first non-empty row)
        let headerRowIndex = 0;
        let headerMap = {};
        
        // Try to find header row
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const row = jsonData[i];
          if (row && row.length > 0) {
            const rowValues = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
            if (rowValues.length >= 2) {
              // Check if this looks like a header row
              const rowText = rowValues.map(cell => String(cell).toLowerCase()).join(' ');
              if (rowText.includes('item') || rowText.includes('category') || rowText.includes('amount') || rowText.includes('name')) {
                headerRowIndex = i;
                // Map columns to field names
                row.forEach((cell, colIndex) => {
                  if (cell) {
                    const cellLower = String(cell).toLowerCase().trim();
                    if ((cellLower.includes('item') && cellLower.includes('name')) || (cellLower.includes('name') && !cellLower.includes('category'))) {
                      headerMap[colIndex] = 'item_name';
                    } else if (cellLower.includes('category')) {
                      headerMap[colIndex] = 'category';
                    } else if (cellLower.includes('amount') || cellLower.includes('value')) {
                      headerMap[colIndex] = 'amount';
                    } else if (cellLower.includes('note') || cellLower.includes('comment') || cellLower.includes('description')) {
                      headerMap[colIndex] = 'notes';
                    }
                  }
                });
                break;
              }
            }
          }
        }
        
        // If no header map found, use default order: item_name, category, amount, notes
        if (Object.keys(headerMap).length === 0) {
          headerMap = { 0: 'item_name', 1: 'category', 2: 'amount', 3: 'notes' };
        }
        
        // Parse data rows
        const rows = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const rowData = {};
          let hasData = false;
          
          // Extract data based on header map
          Object.entries(headerMap).forEach(([colIndex, fieldName]) => {
            const colIdx = parseInt(colIndex);
            if (colIdx < row.length && row[colIdx] !== null && row[colIdx] !== undefined) {
              const value = row[colIdx];
              
              if (fieldName === 'amount') {
                // Try to parse as number
                if (typeof value === 'number') {
                  rowData[fieldName] = value;
                  hasData = true;
                } else if (typeof value === 'string') {
                  // Remove commas and whitespace, then parse
                  const cleanValue = value.replace(/,/g, '').replace(/\s/g, '').trim();
                  const numValue = parseFloat(cleanValue);
                  if (!isNaN(numValue)) {
                    rowData[fieldName] = numValue;
                    hasData = true;
                  } else {
                    rowData[fieldName] = null;
                  }
                } else {
                  rowData[fieldName] = null;
                }
              } else {
                // String fields
                const strValue = String(value).trim();
                if (strValue) {
                  rowData[fieldName] = strValue;
                  hasData = true;
                } else {
                  rowData[fieldName] = null;
                }
              }
            } else {
              rowData[fieldName] = null;
            }
          });
          
          // Only include row if it has at least item_name or category
          if (hasData || rowData.item_name || rowData.category) {
            rowData.row_number = i + 1; // Excel row number (1-indexed)
            rows.push(rowData);
          }
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate that parsed rows have required structure
 * @param {Array} rows - Array of parsed row objects
 * @returns {{valid: boolean, errors: Array<string>}} Validation result
 */
export function validateExcelStructure(rows) {
  const errors = [];
  
  if (!rows || rows.length === 0) {
    errors.push('Excel file contains no data rows');
    return { valid: false, errors };
  }
  
  // Check for required fields in at least some rows
  const hasItemName = rows.some(row => row.item_name);
  const hasCategory = rows.some(row => row.category);
  const hasAmount = rows.some(row => row.amount !== null && row.amount !== undefined);
  
  if (!hasItemName) {
    errors.push('Missing required column: item_name');
  }
  if (!hasCategory) {
    errors.push('Missing required column: category');
  }
  if (!hasAmount) {
    errors.push('Missing required column: amount');
  }
  
  const valid = hasItemName && hasCategory && hasAmount;
  return { valid, errors };
}
