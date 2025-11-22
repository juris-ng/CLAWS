// utils/petitionCategoriesService.js

/**
 * Category Images - Each category has multiple relevant images from Unsplash
 */
export const CATEGORY_IMAGES = {
  education: [
    'https://images.unsplash.com/photo-1427504494785-cdbe12e1e2e9?w=800&q=80',
    'https://images.unsplash.com/photo-1554225311-beee415c15db?w=800&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&q=80',
    'https://images.unsplash.com/photo-1463207687429-7500494ce38c?w=800&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80',
    'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1579154204601-01d82ca0a66d?w=800&q=80',
    'https://images.unsplash.com/photo-1631217314831-c6227db76b6e?w=800&q=80',
  ],
  environment: [
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
  ],
  justice: [
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&q=80',
    'https://images.unsplash.com/photo-1554225311-beee415c15db?w=800&q=80',
    'https://images.unsplash.com/photo-1556076798-4825dfaaf498?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  ],
  infrastructure: [
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    'https://images.unsplash.com/photo-1570129477492-45ac003756d4?w=800&q=80',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
  ],
  governance: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=800&q=80',
  ],
  economy: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  ],
};

/**
 * Category Information - Metadata for each category
 */
export const CATEGORY_INFO = {
  education: {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    color: '#4CAF50',
    images: CATEGORY_IMAGES.education,
  },
  health: {
    id: 'health',
    name: 'Healthcare',
    icon: '🏥',
    color: '#E91E63',
    images: CATEGORY_IMAGES.health,
  },
  environment: {
    id: 'environment',
    name: 'Environment',
    icon: '🌱',
    color: '#2196F3',
    images: CATEGORY_IMAGES.environment,
  },
  justice: {
    id: 'justice',
    name: 'Human Rights',
    icon: '⚖️',
    color: '#FF9800',
    images: CATEGORY_IMAGES.justice,
  },
  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: '🏗️',
    color: '#9C27B0',
    images: CATEGORY_IMAGES.infrastructure,
  },
  governance: {
    id: 'governance',
    name: 'Governance',
    icon: '🏛️',
    color: '#00BCD4',
    images: CATEGORY_IMAGES.governance,
  },
  economy: {
    id: 'economy',
    name: 'Social Issues',
    icon: '👥',
    color: '#F44336',
    images: CATEGORY_IMAGES.economy,
  },
  other: {
    id: 'other',
    name: 'Other',
    icon: '📋',
    color: '#607D8B',
    images: CATEGORY_IMAGES.other,
  },
};

/**
 * Get random image URL for a category
 * @param {string} categoryId - The category ID
 * @returns {string} A random image URL for the category
 */
export const getRandomCategoryImage = (categoryId) => {
  const categoryKey = categoryId?.toLowerCase() || 'other';
  const images = CATEGORY_IMAGES[categoryKey] || CATEGORY_IMAGES.other;
  
  if (!images || images.length === 0) {
    return CATEGORY_IMAGES.other[0];
  }
  
  return images[Math.floor(Math.random() * images.length)];
};

/**
 * Get category info with icon, color, and name
 * @param {string} categoryId - The category ID
 * @returns {object} Category information object
 */
export const getCategoryInfo = (categoryId) => {
  const categoryKey = categoryId?.toLowerCase() || 'other';
  return CATEGORY_INFO[categoryKey] || CATEGORY_INFO.other;
};

/**
 * Get all categories list
 * @returns {array} Array of all category info objects
 */
export const getAllCategories = () => {
  return Object.values(CATEGORY_INFO);
};

/**
 * Check if category exists
 * @param {string} categoryId - The category ID
 * @returns {boolean} True if category exists
 */
export const categoryExists = (categoryId) => {
  return CATEGORY_INFO.hasOwnProperty(categoryId?.toLowerCase());
};
