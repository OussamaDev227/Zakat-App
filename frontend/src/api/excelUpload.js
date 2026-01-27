/**
 * Excel Upload API
 * 
 * Functions for uploading Excel files or importing parsed items
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zakat-app-y6su.onrender.com';

/**
 * Upload Excel file to backend endpoint
 * @param {number} companyId - Company ID
 * @param {File} file - Excel file
 * @returns {Promise<Object>} Upload result with calculation and import statistics
 */
export async function uploadExcelFile(companyId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = `${API_BASE_URL}/zakat/excel/upload/${companyId}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Import parsed Excel items by creating them via financial items API
 * @param {number} companyId - Company ID
 * @param {Array} items - Array of validated item objects
 * @returns {Promise<Array>} Array of created financial items
 */
export async function importExcelItems(companyId, items) {
  const { createFinancialItem } = await import('./financialItems');
  
  const createdItems = [];
  const errors = [];
  
  // Create items one by one to handle individual errors
  for (const item of items) {
    try {
      const itemData = {
        company_id: companyId,
        name: item.item_name,
        category: item.mapped.category,
        amount: item.amount,
        accounting_label: item.notes || null,
        metadata: item.mapped.metadata || {},
      };
      
      // Add category-specific fields
      if (item.mapped.category === 'ASSET') {
        itemData.asset_type = item.mapped.asset_type;
      } else if (item.mapped.category === 'LIABILITY') {
        itemData.liability_code = item.mapped.liability_code;
      } else if (item.mapped.category === 'EQUITY') {
        itemData.equity_code = item.mapped.equity_code;
      }
      
      const created = await createFinancialItem(itemData);
      createdItems.push(created);
    } catch (error) {
      errors.push({
        row_number: item.row_number,
        item_name: item.item_name,
        error: error.message
      });
    }
  }
  
  if (errors.length > 0 && createdItems.length === 0) {
    throw new Error(`Failed to import items: ${errors.map(e => e.error).join('; ')}`);
  }
  
  return { createdItems, errors };
}

/**
 * Submit items for zakat calculation
 * @param {number} companyId - Company ID
 * @param {Array} items - Array of prepared item objects with category_code, amount, etc.
 * @param {boolean} createItems - If true, create items in database and link to calculation. If false, calculate only without saving items.
 * @returns {Promise<Object>} Calculation result with calculation_id, zakat_base, zakat_amount, etc.
 */
export async function submitForCalculation(companyId, items, createItems = true) {
  const { startCalculation, addItemToCalculation } = await import('./zakat');
  const { createFinancialItem } = await import('./financialItems');
  
  if (createItems) {
    // Option A: Create Items & Calculate
    // 1. Start or get draft calculation (this auto-links unlinked items)
    const calculation = await startCalculation(companyId);
    const calculationId = calculation.calculation_id;
    
    // 2. Create financial items (they will be auto-linked by startCalculation if unlinked)
    const createdItems = [];
    const errors = [];
    
    for (const item of items) {
      try {
        // Create financial item
        const itemData = {
          company_id: companyId,
          name: item.item_name,
          category: item.category,
          amount: item.amount,
          accounting_label: item.notes || null,
          metadata: item.metadata || {},
        };
        
        // Add category-specific fields
        if (item.category === 'ASSET') {
          itemData.asset_type = item.asset_type;
        } else if (item.category === 'LIABILITY') {
          itemData.liability_code = item.liability_code;
        } else if (item.category === 'EQUITY') {
          itemData.equity_code = item.equity_code;
        }
        
        const createdItem = await createFinancialItem(itemData);
        createdItems.push(createdItem);
      } catch (error) {
        errors.push({
          row_number: item.row_number,
          item_name: item.item_name,
          error: error.message
        });
      }
    }
    
    if (errors.length > 0 && createdItems.length === 0) {
      throw new Error(`Failed to create items: ${errors.map(e => e.error).join('; ')}`);
    }
    
    // 3. Start calculation again to auto-link the newly created items
    // This will link all unlinked items and recalculate
    const updatedCalculation = await startCalculation(companyId);
    
    // 4. Get final calculation result
    const { getCalculation } = await import('./zakat');
    const finalCalculation = await getCalculation(updatedCalculation.calculation_id);
    
    return {
      calculation_id: updatedCalculation.calculation_id,
      createdItems,
      errors,
      calculation: finalCalculation
    };
  } else {
    // Option B: Calculate Only (without creating items)
    // Create a temporary calculation by adding items directly to a draft calculation
    const calculation = await startCalculation(companyId);
    const calculationId = calculation.calculation_id;
    
    // Add items directly to calculation without creating permanent financial items
    const addedItems = [];
    const errors = [];
    
    for (const item of items) {
      try {
        const itemData = {
          name: item.item_name,
          category: item.category,
          amount: item.amount,
          accounting_label: item.notes || null,
          metadata: item.metadata || {},
        };
        
        // Add category-specific fields
        if (item.category === 'ASSET') {
          itemData.asset_type = item.asset_type;
        } else if (item.category === 'LIABILITY') {
          itemData.liability_code = item.liability_code;
        } else if (item.category === 'EQUITY') {
          itemData.equity_code = item.equity_code;
        }
        
        // Add item to calculation (this creates a temporary item linked to calculation)
        await addItemToCalculation(calculationId, itemData);
        addedItems.push(item);
      } catch (error) {
        errors.push({
          row_number: item.row_number,
          item_name: item.item_name,
          error: error.message
        });
      }
    }
    
    if (errors.length > 0 && addedItems.length === 0) {
      throw new Error(`Failed to add items for calculation: ${errors.map(e => e.error).join('; ')}`);
    }
    
    // Recalculate
    const { recalculateCalculation, getCalculation } = await import('./zakat');
    await recalculateCalculation(calculationId);
    
    // Get calculation result
    const finalCalculation = await getCalculation(calculationId);
    
    return {
      calculation_id: calculationId,
      addedItems,
      errors,
      calculation: finalCalculation,
      mode: 'calculate_only'
    };
  }
}
