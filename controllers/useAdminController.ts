
import { useState, useEffect } from 'react';
import { Product, ProductReport, User, Order, OrderStatus, ReportStatus } from '../types';
import * as api from '../services/apiService';

declare var Swal: any;

export const useAdminController = (onDataChange: () => void) => {
  // --- STATE ---
  const [view, setView] = useState<'products' | 'reports' | 'users' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ProductReport | null>(null);
  const [justification, setJustification] = useState('');
  
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // --- DATA FETCHING (Model Interaction) ---
  const loadData = async () => {
      setIsLoading(true);
      try {
          const [fetchedProducts, fetchedOrders, fetchedReports, fetchedUsers] = await Promise.all([
              api.getProducts(),
              api.getAllOrders(),
              api.getReports(),
              api.getUsers()
          ]);

          setProducts(fetchedProducts);
          setOrders(fetchedOrders);
          setReports(fetchedReports);
          setUsers(fetchedUsers);
          
      } catch (error: any) {
          console.error("Failed to load data:", error);
          Swal.fire('Error', 'Error cargando datos del administrador', 'error');
      } finally {
          setIsLoading(false);
      }
  }

  useEffect(() => {
    loadData();
  }, [view]);

  useEffect(() => {
      if (selectedReport) {
          setJustification(selectedReport.adminResponse || '');
      }
  }, [selectedReport]);

  // --- VIEW ACTIONS ---
  const handleViewChange = (newView: 'products' | 'reports' | 'users' | 'orders') => {
    setView(newView);
    setSearchTerm('');
  };

  // --- PRODUCT ACTIONS ---
  const handleOpenModalForCreate = () => {
    setProductToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(undefined);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    try {
        if ('id' in productData) {
        await api.updateProduct(productData);
        } else {
        await api.createProduct(productData);
        }
        onDataChange();
        await loadData();
        handleCloseModal();
    } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
    }
  };
  
  const handleDeleteClick = (productId: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: '¡Sí, bórralo!'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await api.deleteProduct(productId);
        onDataChange();
        setProducts(products.filter(p => p.id !== productId)); 
        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
      }
    })
  }

  // --- INVOICE ACTIONS ---
  const handlePrintInvoice = async (order: Order) => {
      setDownloadingPdfId(order.id);
      try {
          await api.downloadInvoicePdf(order);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Comprobante Descargado', showConfirmButton: false, timer: 1500 });
      } catch (error: any) {
          Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo generar el PDF.' });
      } finally {
          setDownloadingPdfId(null);
      }
  };

  const handleCopyTrackingId = (id: string) => {
      navigator.clipboard.writeText(id).then(() => {
          Swal.fire({ toast: true, position: 'top', icon: 'success', title: 'ID Copiado', showConfirmButton: false, timer: 1000, background: '#1a1a1a', color: '#fff', iconColor: '#fff' });
      });
  };

  // --- USER ACTIONS ---
  const handleToggleUserStatus = async (user: User) => {
       try {
          const newStatus = user.status === 'active' ? 'banned' : 'active';
          await api.updateUserStatus(user.id, newStatus);
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Usuario ${newStatus === 'active' ? 'Activado' : 'Suspendido'}`, showConfirmButton: false, timer: 1500 });
       } catch (e) {
           Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
       }
  };

  const handleDeleteUser = async (userId: number | string) => {
       Swal.fire({
          title: '¿Eliminar usuario?',
          text: "Esta acción no se puede deshacer.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Sí, eliminar'
        }).then(async (result: any) => {
          if (result.isConfirmed) {
             try {
                await api.deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
                Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
             } catch (e) {
                 Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
             }
          }
        })
  };

  // --- ORDER ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
      try {
          await api.updateOrderStatus(orderId, newStatus);
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado actualizado', showConfirmButton: false, timer: 1500 });
      } catch (error) {
          Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      }
  };

  // --- REPORT ACTIONS ---
  const handleManageReport = (report: ProductReport) => {
      setSelectedReport(report);
      setIsReportModalOpen(true);
  };

  const handleResolveReport = async (newStatus: ReportStatus) => {
      if (!selectedReport) return;
      
      if ((newStatus === 'Approved' || newStatus === 'Rejected') && !justification.trim()) {
          Swal.fire('Atención', 'Debes escribir una justificación para aprobar o denegar el reporte.', 'warning');
          return;
      }

      try {
          await api.resolveReport(selectedReport.id, newStatus, justification);
          
          setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: newStatus, adminResponse: justification } : r));
          setSelectedReport(prev => prev ? { ...prev, status: newStatus, adminResponse: justification } : null);
          
          if (newStatus === 'Approved' || newStatus === 'Rejected') {
              Swal.fire({
                  icon: 'success',
                  title: 'Reporte Resuelto',
                  text: `El reporte ha sido ${newStatus === 'Approved' ? 'Aprobado' : 'Denegado'}`,
                  timer: 1500,
                  showConfirmButton: false
              });
          }
      } catch (error: any) {
          console.error("Report update error:", error);
          Swal.fire('Error', `No se pudo actualizar el reporte: ${error.message}`, 'error');
      }
  };

  // --- FILTERING ---
  const term = searchTerm.toLowerCase();
  const filteredProducts = products.filter(p => p.nombre_producto.toLowerCase().includes(term) || p.codigo_interno.toLowerCase().includes(term));
  const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(term) || o.customerDetails.firstName.toLowerCase().includes(term) || o.customerDetails.documentNumber.includes(term));
  const filteredUsers = users.filter(u => u.firstName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  const filteredReports = reports.filter(r => r.reason.toLowerCase().includes(term) || r.id.toLowerCase().includes(term));

  return {
      state: {
          view,
          products,
          reports,
          users,
          orders,
          isLoading,
          isModalOpen,
          productToEdit,
          searchTerm,
          isReportModalOpen,
          selectedReport,
          justification,
          downloadingPdfId,
          filteredProducts,
          filteredOrders,
          filteredUsers,
          filteredReports,
          pendingOrdersCount: orders.filter(o => o.status === 'pending').length,
          pendingReportsCount: reports.filter(r => r.status === 'Pending' || r.status === 'Reviewing').length
      },
      actions: {
          handleViewChange,
          setSearchTerm,
          handleOpenModalForCreate,
          handleOpenModalForEdit,
          handleCloseModal,
          handleSaveProduct,
          handleDeleteClick,
          handlePrintInvoice,
          handleCopyTrackingId,
          handleToggleUserStatus,
          handleDeleteUser,
          handleUpdateOrderStatus,
          handleManageReport,
          handleResolveReport,
          setJustification,
          setIsReportModalOpen
      }
  };
};
