// ============================================
// API Utilities - ملف مساعد للطلبات
// ============================================

// ✅ Base URL من .env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://one1-backend-4.onrender.com';

// ✅ دالة مساعدة للطلبات مع Token تلقائي
export const apiRequest = async (endpoint, options = {}) => {
  // الحصول على Token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Headers افتراضية
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  // دمج الإعدادات
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // معالجة 401 (غير مصرح)
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    throw error;
  }
};

// ============================================
// ✅ دوال جاهزة للاستخدام
// ============================================

export const api = {
  // ==================== Auth ====================
  login: (data) => apiRequest('/routes/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ==================== Home ====================
  getAllReceipts: (params = {}) => {
    const query = new URLSearchParams({
      search: params.search || '',
      limit: params.limit || 10,
      page: params.page || 1
    }).toString();
    return apiRequest(`/routes/home/all-receipts?${query}`);
  },

  // ==================== Storage ====================
  getAllItems: () => apiRequest('/routes/storge'),
  
  searchItems: (query) => apiRequest(
    `/routes/storge/search?query=${encodeURIComponent(query)}`
  ),

  addItem: (data) => apiRequest('/routes/newItem', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ==================== Receipts (استلام) ====================
  addReceipt: (data) => apiRequest('/routes/receipts/add', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getAllReceiptsAdmin: () => apiRequest('/routes/receipts/all'),

  getReceiptById: (id) => apiRequest(`/routes/receipts/${id}`),

  // ==================== Delivery (تسليم) ====================
  addDelivery: (data) => apiRequest('/routes/delivery/add', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getAllDelivery: () => apiRequest('/routes/delivery/all'),

  searchDelivery: (name) => apiRequest(
    `/routes/delivery/search?name=${encodeURIComponent(name)}`
  ),

  getPersonItems: (params) => {
    const query = new URLSearchParams({
      name: params.name,
      rank: params.rank,
      number: params.number
    }).toString();
    return apiRequest(`/routes/delivery/person-items?${query}`);
  },

  // ==================== Users ====================
  getAllUsers: () => apiRequest('/routes/dshbord'),

  addUser: (data) => apiRequest('/routes/newUser', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateUser: (id, data) => apiRequest(`/routes/updateUser/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// ============================================
// ✅ دالة للحصول على رابط الملفات
// ============================================
export const getFileUrl = (path) => {
  // إذا كان الـ path يبدأ بـ / استخدمه مباشرة
  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }
  // وإلا أضف / قبله
  return `${API_URL}/${path}`;
};

// ============================================
// ✅ تصدير الـ Base URL
// ============================================
export { API_URL };

// ============================================
// ✅ دالة للتحقق من تسجيل الدخول
// ============================================
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

// ============================================
// ✅ دالة للحصول على بيانات المستخدم
// ============================================
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ============================================
// ✅ دالة تسجيل الخروج
// ============================================
export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
