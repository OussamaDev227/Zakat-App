/**
 * Category Mapper Utility
 * 
 * Maps Excel category strings to zakat ruleset codes
 * Same logic as backend category_mapper.py
 * 
 * Supports both Arabic and English category labels from Excel files.
 * Arabic labels are mapped to English equivalents, then to zakat codes.
 */

// Arabic category labels to English category names
// Format: Arabic label -> English category name (or null for excluded items)
const ARABIC_TO_ENGLISH_MAP = {
  // Zakatable assets
  "النقدية وما في حكمها": "Cash",
  "المخزونات وعروض التجارة": "Trading Goods",  // backward compat: map to Trading Goods
  "عروض التجارة / البضاعة المعدة للبيع": "Trading Goods",
  "المخزون الإنتاجي": "Production Inventory",
  "الذمم المدينة": "Receivable",
  
  // Liabilities
  "الخصوم قصيرة الأجل": "Liability",
  "الخصوم طويلة الأجل": "Long-term Loan",
  
  // Equity (specific)
  "رأس المال": "Capital",
  "الأرباح المحتجزة": "Retained Earnings",
  "حقوق الملكية": "Equity", // Generic - needs further resolution via item_name
  
  // Non-zakatable assets (excluded from zakat base per fiqh-accounting rules)
  // These are productive tools, not trade goods, and are excluded from zakat base
  "الأصول الثابتة العينية": null, // Fixed assets - excluded (productive tools, not trade goods)
  "الأصول المعنوية": null, // Intangible assets - excluded (not zakatable in corporate accounting)
  "الاستثمارات طويلة الأجل": null, // Long-term investments - excluded (non-trading investments)
};

// Mapping from Excel category strings (case-insensitive) to zakat classification
// Format: [category, asset_type, liability_code, equity_code, metadata]
const CATEGORY_MAPPINGS = {
  // Assets
  "cash": ["ASSET", "CASH", null, null, {}],
  "cash and cash equivalents": ["ASSET", "CASH", null, null, {}],
  "bank balance": ["ASSET", "CASH", null, null, {}],
  "bank": ["ASSET", "CASH", null, null, {}],
  
  // Trading goods (merchandise) — zakatable
  "inventory": ["ASSET", "TRADING_GOODS", null, null, {}],  // backward compat
  "finished goods": ["ASSET", "TRADING_GOODS", null, null, {}],
  "goods for resale": ["ASSET", "TRADING_GOODS", null, null, {}],
  "trade goods": ["ASSET", "TRADING_GOODS", null, null, {}],
  "trading goods": ["ASSET", "TRADING_GOODS", null, null, {}],
  "merchandise": ["ASSET", "TRADING_GOODS", null, null, {}],
  // Production inventory — classified per framework
  "raw materials": ["ASSET", "PRODUCTION_INVENTORY", null, null, {}],
  "work in progress": ["ASSET", "PRODUCTION_INVENTORY", null, null, {}],
  "wip": ["ASSET", "PRODUCTION_INVENTORY", null, null, {}],
  "production inventory": ["ASSET", "PRODUCTION_INVENTORY", null, null, {}],
  "manufacturing stock": ["ASSET", "PRODUCTION_INVENTORY", null, null, {}],
  
  "receivable": ["ASSET", "RECEIVABLE", null, null, { collectibility: "strong_debt" }],
  "accounts receivable": ["ASSET", "RECEIVABLE", null, null, { collectibility: "strong_debt" }],
  "customer debts": ["ASSET", "RECEIVABLE", null, null, { collectibility: "strong_debt" }],
  "trade receivables": ["ASSET", "RECEIVABLE", null, null, { collectibility: "strong_debt" }],
  
  "fixed asset": ["ASSET", "FIXED_ASSET", null, null, {}],
  "fixed assets": ["ASSET", "FIXED_ASSET", null, null, {}],
  "property": ["ASSET", "FIXED_ASSET", null, null, {}],
  "equipment": ["ASSET", "FIXED_ASSET", null, null, {}],
  "machinery": ["ASSET", "FIXED_ASSET", null, null, {}],
  "vehicles": ["ASSET", "FIXED_ASSET", null, null, {}],
  "buildings": ["ASSET", "FIXED_ASSET", null, null, {}],
  
  "intangible asset": ["ASSET", "INTANGIBLE_ASSET", null, null, {}],
  "intangible assets": ["ASSET", "INTANGIBLE_ASSET", null, null, {}],
  
  "long-term investment": ["ASSET", "LONG_TERM_INVESTMENT", null, null, {}],
  "long-term investments": ["ASSET", "LONG_TERM_INVESTMENT", null, null, {}],
  
  // Liabilities
  "liability": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "liabilities": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "supplier payable": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "supplier payables": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "payables": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "accounts payable": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "short-term liability": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "short-term liabilities": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "accrued expenses": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  "short-term loan": ["LIABILITY", null, "SHORT_TERM_LIABILITY", null, {}],
  
  "long-term loan": ["LIABILITY", null, "LONG_TERM_LIABILITY", null, {}],
  "long-term loans": ["LIABILITY", null, "LONG_TERM_LIABILITY", null, {}],
  "long-term liability": ["LIABILITY", null, "LONG_TERM_LIABILITY", null, {}],
  "long-term liabilities": ["LIABILITY", null, "LONG_TERM_LIABILITY", null, {}],
  "bonds": ["LIABILITY", null, "LONG_TERM_LIABILITY", null, {}],
  
  // Equity
  "capital": ["EQUITY", null, null, "PAID_IN_CAPITAL", {}],
  "share capital": ["EQUITY", null, null, "PAID_IN_CAPITAL", {}],
  "paid-in capital": ["EQUITY", null, null, "PAID_IN_CAPITAL", {}],
  "contributed capital": ["EQUITY", null, null, "PAID_IN_CAPITAL", {}],
  "capital stock": ["EQUITY", null, null, "PAID_IN_CAPITAL", {}],
  
  "retained earnings": ["EQUITY", null, null, "RETAINED_EARNINGS", {}],
  "retained profit": ["EQUITY", null, null, "RETAINED_EARNINGS", {}],
  "accumulated profit": ["EQUITY", null, null, "RETAINED_EARNINGS", {}],
  "reserves": ["EQUITY", null, null, "RETAINED_EARNINGS", {}],
};

// English category names to Arabic labels (for display)
const ENGLISH_TO_ARABIC_LABELS = {
  "Cash": "النقدية وما في حكمها",
  "Trading Goods": "عروض التجارة / البضاعة المعدة للبيع",
  "Production Inventory": "المخزون الإنتاجي",
  "Receivable": "الذمم المدينة",
  "Liability": "الخصوم قصيرة الأجل",
  "Long-term Loan": "الخصوم طويلة الأجل",
  "Capital": "رأس المال",
  "Retained Earnings": "الأرباح المحتجزة",
};

// Zakat codes to Arabic labels (for display)
const ZAKAT_CODE_TO_ARABIC = {
  "CASH": "النقدية وما في حكمها",
  "TRADING_GOODS": "عروض التجارة / البضاعة المعدة للبيع",
  "PRODUCTION_INVENTORY": "المخزون الإنتاجي",
  "RECEIVABLE": "الذمم المدينة",
  "SHORT_TERM_LIABILITY": "الخصوم قصيرة الأجل",
  "LONG_TERM_LIABILITY": "الخصوم طويلة الأجل",
  "PAID_IN_CAPITAL": "رأس المال",
  "RETAINED_EARNINGS": "الأرباح المحتجزة",
  "FIXED_ASSET": "الأصول الثابتة العينية",
  "INTANGIBLE_ASSET": "الأصول المعنوية",
  "LONG_TERM_INVESTMENT": "الاستثمارات طويلة الأجل",
  "INVENTORY": "عروض التجارة / البضاعة المعدة للبيع",  // legacy; map to Trading Goods label
};

/**
 * Get Arabic label for English category name or zakat code
 * @param {string} englishCategory - English category name (e.g., "Cash", "Liability")
 * @param {string} zakatCode - Zakat code (e.g., "CASH", "SHORT_TERM_LIABILITY")
 * @returns {string} Arabic label or original if not found
 */
export function getArabicLabel(englishCategory = null, zakatCode = null) {
  // Try zakat code first (more specific)
  if (zakatCode && ZAKAT_CODE_TO_ARABIC[zakatCode]) {
    return ZAKAT_CODE_TO_ARABIC[zakatCode];
  }
  
  // Try English category name
  if (englishCategory && ENGLISH_TO_ARABIC_LABELS[englishCategory]) {
    return ENGLISH_TO_ARABIC_LABELS[englishCategory];
  }
  
  // Return original if no mapping found
  return englishCategory || zakatCode || '';
}

/**
 * Category Code options for dropdown (English codes with Arabic labels)
 * Assets: Cash, Trading Goods, Production Inventory, Fixed Assets, Receivables
 */
export const CATEGORY_CODE_OPTIONS = [
  { value: "Cash", label: "النقدية وما في حكمها" },
  { value: "Trading Goods", label: "عروض التجارة / البضاعة المعدة للبيع" },
  { value: "Production Inventory", label: "المخزون الإنتاجي" },
  { value: "Receivable", label: "الذمم المدينة" },
  { value: "Fixed Assets", label: "الأصول الثابتة العينية" },
  { value: "Liability", label: "الخصوم قصيرة الأجل" },
  { value: "Long-term Loan", label: "الخصوم طويلة الأجل" },
  { value: "Capital", label: "رأس المال" },
  { value: "Retained Earnings", label: "الأرباح المحتجزة" },
];

/**
 * Convert Category Code (e.g., "Cash", "Inventory") to zakat classification
 * @param {string} categoryCode - Category code from dropdown ("Cash", "Inventory", "Receivable", "Liability", "Long-term Loan", "Capital", "Retained Earnings")
 * @returns {Object} Object with category, asset_type, liability_code, equity_code, metadata
 */
export function categoryCodeToZakatClassification(categoryCode) {
  if (!categoryCode || categoryCode.trim() === '') {
    return {
      category: null,
      asset_type: null,
      liability_code: null,
      equity_code: null,
      metadata: {},
      error: "Category code is required"
    };
  }

  const code = categoryCode.trim();
  
  // Map Category Code to zakat classification
  switch (code) {
    case "Cash":
      return {
        category: "ASSET",
        asset_type: "CASH",
        liability_code: null,
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Trading Goods":
      return {
        category: "ASSET",
        asset_type: "TRADING_GOODS",
        liability_code: null,
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Production Inventory":
      return {
        category: "ASSET",
        asset_type: "PRODUCTION_INVENTORY",
        liability_code: null,
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Receivable":
      return {
        category: "ASSET",
        asset_type: "RECEIVABLE",
        liability_code: null,
        equity_code: null,
        metadata: { collectibility: "strong_debt" },
        error: null
      };
    
    case "Liability":
      return {
        category: "LIABILITY",
        asset_type: null,
        liability_code: "SHORT_TERM_LIABILITY",
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Long-term Loan":
      return {
        category: "LIABILITY",
        asset_type: null,
        liability_code: "LONG_TERM_LIABILITY",
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Fixed Assets":
      return {
        category: "ASSET",
        asset_type: "FIXED_ASSET",
        liability_code: null,
        equity_code: null,
        metadata: {},
        error: null
      };
    
    case "Capital":
      return {
        category: "EQUITY",
        asset_type: null,
        liability_code: null,
        equity_code: "PAID_IN_CAPITAL",
        metadata: {},
        error: null
      };
    
    case "Retained Earnings":
      return {
        category: "EQUITY",
        asset_type: null,
        liability_code: null,
        equity_code: "RETAINED_EARNINGS",
        metadata: {},
        error: null
      };
    
    default:
      return {
        category: null,
        asset_type: null,
        liability_code: null,
        equity_code: null,
        metadata: {},
        error: `Unknown category code: ${categoryCode}. Use: Cash, Trading Goods, Production Inventory, Receivable, Fixed Assets, Liability, Long-term Loan, Capital, Retained Earnings`
      };
  }
}

/**
 * Check if text contains Arabic characters
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains Arabic Unicode characters (U+0600-U+06FF)
 */
function isArabicText(text) {
  if (!text || typeof text !== 'string') return false;
  // Arabic Unicode range: U+0600 to U+06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

/**
 * Resolve generic "حقوق الملكية" (Equity) category using item_name keywords
 * @param {string} itemName - Item name to analyze
 * @returns {string} "Capital" or "Retained Earnings"
 */
function resolveEquityCategory(itemName) {
  if (!itemName || typeof itemName !== 'string') {
    // Default to Capital if item_name is missing
    return "Capital";
  }
  
  const nameLower = itemName.toLowerCase();
  const nameArabic = itemName;
  
  // Check for Capital keywords (Arabic and English)
  const capitalKeywords = [
    "رأس", "رأس مال", "رأس المال", "capital", "share capital", 
    "paid-in", "contributed", "stock"
  ];
  
  // Check for Retained Earnings keywords (Arabic and English)
  const retainedKeywords = [
    "أرباح", "أرباح محتجزة", "الأرباح المحتجزة", "احتياطي", 
    "retained", "earnings", "profit", "reserves", "accumulated"
  ];
  
  // Check Arabic keywords first
  for (const keyword of capitalKeywords) {
    if (nameArabic.includes(keyword) || nameLower.includes(keyword)) {
      return "Capital";
    }
  }
  
  for (const keyword of retainedKeywords) {
    if (nameArabic.includes(keyword) || nameLower.includes(keyword)) {
      return "Retained Earnings";
    }
  }
  
  // Default to Capital (most common case)
  return "Capital";
}

/**
 * Map Excel category string to zakat classification
 * Supports both Arabic and English category labels.
 * 
 * @param {string} category - Excel category string (e.g., "Cash", "Inventory", "Liability", or Arabic)
 * @param {string} itemName - Optional item name for resolving ambiguous equity categories
 * @returns {Object} Object with category, asset_type, liability_code, equity_code, metadata, originalCategory, englishCategory, error
 */
export function mapCategoryToZakatCode(category, itemName = null) {
  if (!category || typeof category !== 'string') {
    return {
      category: null,
      asset_type: null,
      liability_code: null,
      equity_code: null,
      metadata: {},
      originalCategory: category || null,
      englishCategory: null,
      error: "Category is empty"
    };
  }
  
  const originalCategory = category.trim();
  let englishCategory = null;
  let categoryToMap = originalCategory;
  
  // Step 1: Check if input is Arabic and map to English
  if (isArabicText(originalCategory)) {
    // Direct Arabic mapping
    if (ARABIC_TO_ENGLISH_MAP[originalCategory] !== undefined) {
      const mapped = ARABIC_TO_ENGLISH_MAP[originalCategory];
      
      // Handle excluded items (non-zakatable assets)
      if (mapped === null) {
        return {
          category: null,
          asset_type: null,
          liability_code: null,
          equity_code: null,
          metadata: {},
          originalCategory: originalCategory,
          englishCategory: null,
          error: `Non-zakatable asset excluded: ${originalCategory}. Fixed assets, intangible assets, and long-term investments are productive tools, not trade goods, and are excluded from zakat base per fiqh-accounting rules.`
        };
      }
      
      // Handle generic "حقوق الملكية" (Equity) - needs resolution
      if (mapped === "Equity") {
        englishCategory = resolveEquityCategory(itemName);
        categoryToMap = englishCategory;
      } else {
        englishCategory = mapped;
        categoryToMap = mapped;
      }
    } else {
      // Try partial matching for Arabic variations
      let found = false;
      for (const [arabicKey, englishValue] of Object.entries(ARABIC_TO_ENGLISH_MAP)) {
        if (originalCategory.includes(arabicKey) || arabicKey.includes(originalCategory)) {
          if (englishValue === null) {
            return {
              category: null,
              asset_type: null,
              liability_code: null,
              equity_code: null,
              metadata: {},
              originalCategory: originalCategory,
              englishCategory: null,
              error: `Non-zakatable asset excluded: ${originalCategory}`
            };
          }
          if (englishValue === "Equity") {
            englishCategory = resolveEquityCategory(itemName);
            categoryToMap = englishCategory;
          } else {
            englishCategory = englishValue;
            categoryToMap = englishValue;
          }
          found = true;
          break;
        }
      }
      
      if (!found) {
        return {
          category: null,
          asset_type: null,
          liability_code: null,
          equity_code: null,
          metadata: {},
          originalCategory: originalCategory,
          englishCategory: null,
          error: `Unknown Arabic category: ${originalCategory}. Please use one of: النقدية وما في حكمها, المخزونات وعروض التجارة, الذمم المدينة, الخصوم قصيرة الأجل, الخصوم طويلة الأجل, رأس المال, الأرباح المحتجزة`
        };
      }
    }
  } else {
    // English category - use as-is
    englishCategory = originalCategory;
  }
  
  // Step 2: Map English category to zakat code (existing logic)
  const normalized = categoryToMap.toLowerCase().trim();
  
  // Direct lookup
  if (CATEGORY_MAPPINGS[normalized]) {
    const [cat, asset_type, liability_code, equity_code, metadata] = CATEGORY_MAPPINGS[normalized];
    return {
      category: cat,
      asset_type: asset_type,
      liability_code: liability_code,
      equity_code: equity_code,
      metadata: { ...metadata },
      originalCategory: originalCategory,
      englishCategory: englishCategory || categoryToMap,
      error: null
    };
  }
  
  // Try partial matching for common variations
  for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      const [cat, asset_type, liability_code, equity_code, metadata] = value;
      return {
        category: cat,
        asset_type: asset_type,
        liability_code: liability_code,
        equity_code: equity_code,
        metadata: { ...metadata },
        originalCategory: originalCategory,
        englishCategory: englishCategory || categoryToMap,
        error: null
      };
    }
  }
  
  // No match found
  return {
    category: null,
    asset_type: null,
    liability_code: null,
    equity_code: null,
    metadata: {},
    originalCategory: originalCategory,
    englishCategory: englishCategory || categoryToMap,
    error: `Unknown category: ${categoryToMap}. Please use one of: Cash, Trading Goods, Production Inventory, Receivable, Fixed Assets, Liability, Long-term Loan, Capital, Retained Earnings`
  };
}
