export const PETITION_CATEGORIES = [
  { value: 'general', label: '📋 General', icon: '📋' },
  { value: 'housing', label: '🏠 Housing', icon: '🏠' },
  { value: 'education', label: '📚 Education', icon: '📚' },
  { value: 'health', label: '🏥 Health', icon: '🏥' },
  { value: 'infrastructure', label: '🚧 Infrastructure', icon: '🚧' },
  { value: 'security', label: '🔒 Security', icon: '🔒' },
  { value: 'environment', label: '🌱 Environment', icon: '🌱' },
  { value: 'governance', label: '⚖️ Governance', icon: '⚖️' },
  { value: 'finance', label: '💰 Finance', icon: '💰' },
  { value: 'other', label: '📌 Other', icon: '📌' },
];

export const getCategoryLabel = (value) => {
  const category = PETITION_CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : '📋 General';
};

export const getCategoryIcon = (value) => {
  const category = PETITION_CATEGORIES.find(cat => cat.value === value);
  return category ? category.icon : '📋';
};
