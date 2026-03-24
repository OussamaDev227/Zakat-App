/**
 * Financial Items Page
 *
 * Manage financial items for the active company
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManageFinancialItems = hasPermission('manageFinancialItems');
  const canImportExcel = hasPermission('importExcel');
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
      alert(t('load_items_failed') + ': ' + error.message);
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
      alert(t('save_failed') + ': ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('confirm_delete_item'))) {
      return;
    }

    try {
      await deleteFinancialItem(id);
      await loadItems();
    } catch (error) {
      alert(t('delete_failed') + ': ' + error.message);
    }
  }

  if (!activeCompany) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('manage_financial_items')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('add_edit_items_intro')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {canImportExcel && (
            <button
              onClick={() => setShowExcelUpload(true)}
              className="btn-secondary text-base sm:text-lg w-full sm:w-auto"
            >
              📊 {t('excel_import')}
            </button>
          )}
          {canManageFinancialItems && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-base sm:text-lg w-full sm:w-auto">
              + {t('add_financial_item')}
            </button>
          )}
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
        <div className="text-center py-8 text-gray-700 font-medium">{t('loading')}</div>
      ) : (
        <FinancialItemsTable
          items={items}
          onEdit={canManageFinancialItems ? (item) => {
            setEditingItem(item);
            setShowForm(true);
          } : undefined}
          onDelete={canManageFinancialItems ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
