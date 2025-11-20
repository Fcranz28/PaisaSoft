
export interface Product {
  id: number;
  codigo_interno: string;
  nombre_producto: string;
  descripcion: string;
  precio_venta: number;
  stock_actual: number;
  categoria: string;
  imageUrl: string;
  fecha_vencimiento?: string; // Format: YYYY-MM-DD
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  documentType: string;
  documentNumber: string;
}

export interface User {
  id: number | string; // Updated to support Firebase string UIDs
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password should not be passed around, but needed for creation
  role?: 'admin' | 'customer'; // Security: Added role for RBAC
  status?: 'active' | 'banned';
  photoUrl?: string; // Added for social auth profile pictures
  provider?: 'email' | 'google' | 'facebook' | 'twitter';
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export interface Order {
  id: string;
  userId: number | string; // Updated to support Firebase string UIDs
  customerDetails: CustomerDetails;
  items: CartItem[];
  total: number;
  date: string;
  status: OrderStatus;
}

export type ReportStatus = 'Pending' | 'Reviewing' | 'Approved' | 'Rejected';

export interface ProductReport {
  id: string;
  productId: number;
  reason: string; // e.g., 'Vencido', 'Precio Incorrecto', 'Mala Calidad'
  description: string;
  evidenceUrl?: string; // Cloudinary URL
  date: string;
  status: ReportStatus;
  adminResponse?: string; // Justification from admin
}

export interface ElectronicInvoiceResponse {
  xml?: string;
  hash?: string;
  sunatResponse?: {
    success: boolean;
    cdrResponse?: {
      id: string;
      code: string;
      description: string;
      notes?: string[];
    };
    error?: {
      code: string;
      message: string;
    }
  };
}