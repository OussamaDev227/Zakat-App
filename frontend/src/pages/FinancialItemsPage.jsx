/**
 * Financial Items Page
 * 
 * Manage financial items for the active company
 */

import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import {
  getFinancialItems,
  createFinancialItem,
  updateFinancialItem,
  deleteFinancialItem,
} from '../api/financialItems';
import FinancialItemForm from '../components/FinancialItemForm';
import FinancialItemsTable from '../components/FinancialItemsTable';
import ExcelUploadForm from '../components/ExcelUploadForm';

export default function FinancialItemsPage() {
  const { activeCompany } = useCompany();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (activeCompany) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [activeCompany]);

  async function loadItems() {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const data = await getFinancialItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
      alert('فشل تحميل البنود المالية: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData) {
    if (!activeCompany) return;
    try {
      if (editingItem) {
        await updateFinancialItem(editingItem.id, formData);
      } else {
        await createFinancialItem(formData);
      }
      await loadItems();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      alert('فشل الحفظ: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من حذف هذا البند المالي؟')) {
      return;
    }

    try {
      await deleteFinancialItem(id);
      await loadItems();
    } catch (error) {
      alert('فشل الحذف: ' + error.message);
    }
  }

  if (!activeCompany) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">إدارة البنود المالية</h1>
          <p className="text-sm sm:text-base text-gray-600">إضافة وتعديل البنود المالية للشركة النشطة</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowExcelUpload(true)} 
            className="btn-secondary text-base sm:text-lg w-full sm:w-auto"
          >
            📊 استيراد من Excel
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-base sm:text-lg w-full sm:w-auto">
            + إضافة بند مالي جديد
          </button>
        </div>
      </div>

      {showExcelUpload && (
        <div className="mb-6">
          <ExcelUploadForm
            onImportComplete={async (result) => {
              // Refresh items list after import
              await loadItems();
              setShowExcelUpload(false);
            }}
            onCancel={() => {
              setShowExcelUpload(false);
            }}
          />
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <FinancialItemForm
            item={editingItem}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-700 font-medium">جاري التحميل...</div>
      ) : (
        <FinancialItemsTable
          items={items}
          onEdit={(item) => {
            setEditingItem(item);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
