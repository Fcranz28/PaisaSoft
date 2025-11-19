
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Product, ProductReport, User } from '../types';
import ProductFormModal from '../components/ProductFormModal';
import * as api from '../services/apiService';

declare var Swal: any;

interface AdminPageProps {
  onDataChange: () => void; // Callback to refresh data in App.tsx
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onDataChange, onLogout }) => {
  const [view, setView] = useState<'products' | 'reports' | 'users'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [view]); // Reload when view changes to ensure fresh data

  const loadData = async () => {
      setIsLoading(true);
      const fetchedProducts = await api.getProducts();
      const fetchedReports = await api.getReports();
      const fetchedUsers = await api.getUsers();
      
      setProducts(fetchedProducts);
      setReports(fetchedReports);
      setUsers(fetchedUsers);
      setIsLoading(false);
  }

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
    if ('id' in productData) {
      await api.updateProduct(productData);
    } else {
      await api.createProduct(productData);
    }
    onDataChange(); // Notify App.tsx that data has changed
    await loadData();
    handleCloseModal();
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
        setProducts(products.filter(p => p.id !== productId)); // Optimistic UI update
        Swal.fire(
          '¡Eliminado!',
          'El producto ha sido eliminado.',
          'success'
        )
      }
    })
  }

  const handleDownloadReport = async () => {
    const todaysOrders = await api.getTodaysOrders();
    
    if (todaysOrders.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Sin ventas',
            text: 'No hay ventas registradas el día de hoy para generar un reporte.'
        });
        return;
    }

    // Calculate total Revenue
    const totalRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);

    // CSV Header
    const csvRows = [];
    csvRows.push(['ID Pedido', 'Hora', 'Cliente', 'Tipo Doc', 'Num Doc', 'Productos', 'Total (S/.)'].join(','));

    // CSV Data Rows
    todaysOrders.forEach(order => {
        const itemSummary = order.items.map(i => `(${i.quantity}) ${i.nombre_producto}`).join(' | ');
        // Escape quotes for CSV format
        const safeItemSummary = `"${itemSummary.replace(/"/g, '""')}"`; 
        const time = new Date(order.date).toLocaleTimeString();
        
        csvRows.push([
            order.id,
            time,
            `"${order.customerDetails.firstName} ${order.customerDetails.lastName}"`,
            order.customerDetails.documentType,
            order.customerDetails.documentNumber,
            safeItemSummary,
            order.total.toFixed(2)
        ].join(','));
    });

    // Add Total Row at bottom
    csvRows.push(['', '', '', '', 'TOTAL DEL DIA', '', totalRevenue.toFixed(2)].join(','));

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        text: 'El reporte de ventas se ha descargado correctamente.',
        timer: 2000,
        showConfirmButton: false
    });
  };
  
  const handleExportInventory = () => {
    if (products.length === 0) {
         Swal.fire({
            icon: 'info',
            title: 'Sin productos',
            text: 'No hay productos para exportar.'
        });
        return;
    }

    // CSV Headers matching the structure needed for the Google Sheet
    const csvRows = [];
    csvRows.push(['id', 'codigo_interno', 'nombre_producto', 'descripcion', 'precio_venta', 'stock_actual', 'categoria', 'imageUrl', 'fecha_vencimiento'].join(','));

    // Data
    products.forEach(p => {
        const row = [
            p.id,
            `"${p.codigo_interno}"`,
            `"${p.nombre_producto.replace(/"/g, '""')}"`,
            `"${p.descripcion.replace(/"/g, '""')}"`,
            p.precio_venta,
            p.stock_actual,
            `"${p.categoria}"`,
            `"${p.imageUrl}"`,
            p.fecha_vencimiento || ''
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_paisasoft_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- User Actions ---
  const handleToggleUserStatus = async (user: User) => {
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      const actionText = newStatus === 'banned' ? 'banear' : 'reactivar';
      
      Swal.fire({
          title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} usuario?`,
          text: `Estás a punto de ${actionText} a ${user.firstName} ${user.lastName}.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: newStatus === 'banned' ? '#d97706' : '#16a34a',
          confirmButtonText: `Sí, ${actionText}`
      }).then(async (result: any) => {
          if (result.isConfirmed) {
              await api.updateUserStatus(user.id, newStatus);
              loadData();
              Swal.fire('Actualizado', `El usuario ha sido ${newStatus === 'banned' ? 'suspendido' : 'reactivado'}.`, 'success');
          }
      });
  };

  const handleDeleteUser = async (userId: number | string) => {
      Swal.fire({
          title: '¿Eliminar cuenta?',
          text: "Esta acción es irreversible. El usuario perderá acceso y su historial.",
          icon: 'error',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Sí, eliminar cuenta'
      }).then(async (result: any) => {
          if (result.isConfirmed) {
              await api.deleteUser(userId);
              loadData();
              Swal.fire('Eliminado', 'La cuenta de usuario ha sido eliminada.', 'success');
          }
      });
  };


  const getExpirationStatus = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const expDate = new Date(dateString);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-600 font-bold', text: 'Vencido' };
    if (diffDays <= 7) return { color: 'text-orange-500 font-semibold', text: 'Por vencer' };
    return { color: 'text-slate-500', text: 'Vigente' };
  };

  const filteredProducts = products.filter(product => 
    product.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProductsTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-red-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nombre del Producto</th>
                        <th scope="col" className="px-6 py-3">Categoría</th>
                        <th scope="col" className="px-6 py-3">Precio</th>
                        <th scope="col" className="px-6 py-3">Stock</th>
                        <th scope="col" className="px-6 py-3">Vencimiento</th>
                        <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={6} className="text-center p-8">Cargando productos...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                        <tr><td colSpan={6} className="text-center p-8">No se encontraron productos.</td></tr>
                    ) : filteredProducts.map(product => {
                        const expStatus = getExpirationStatus(product.fecha_vencimiento);
                        return (
                            <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center space-x-3">
                                    <img src={product.imageUrl} alt={product.nombre_producto} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p>{product.nombre_producto}</p>
                                        <p className="text-xs text-slate-400 font-normal">{product.codigo_interno}</p>
                                    </div>
                                </th>
                                <td className="px-6 py-4">{product.categoria}</td>
                                <td className="px-6 py-4">S/.{product.precio_venta.toFixed(2)}</td>
                                <td className="px-6 py-4">{product.stock_actual}</td>
                                <td className="px-6 py-4">
                                    {product.fecha_vencimiento ? (
                                        <div>
                                            <span>{new Date(product.fecha_vencimiento).toLocaleDateString()}</span>
                                            {expStatus && expStatus.text !== 'Vigente' && (
                                                <span className={`block text-xs ${expStatus.color}`}>{expStatus.text}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button 
                                        onClick={() => handleOpenModalForEdit(product)} 
                                        className="font-medium text-slate-600 hover:text-black transition-colors inline-block p-1"
                                        aria-label={`Editar ${product.nombre_producto}`}
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(product.id)} 
                                        className="font-medium text-slate-400 hover:text-red-600 transition-colors inline-block p-1"
                                        aria-label={`Eliminar ${product.nombre_producto}`}
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderReportsTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-orange-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Fecha</th>
                        <th scope="col" className="px-6 py-3">Producto Afectado</th>
                        <th scope="col" className="px-6 py-3">Motivo</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                        <th scope="col" className="px-6 py-3">Evidencia</th>
                        <th scope="col" className="px-6 py-3">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.length === 0 ? (
                         <tr><td colSpan={6} className="text-center p-8">No hay reportes registrados.</td></tr>
                    ) : reports.map(report => {
                        const affectedProduct = products.find(p => p.id === report.productId);
                        return (
                             <tr key={report.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">{new Date(report.date).toLocaleDateString()}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900">
                                    {affectedProduct ? (
                                        <div className="flex items-center space-x-2">
                                            <img src={affectedProduct.imageUrl} className="w-8 h-8 rounded-full" alt="" />
                                            <span>{affectedProduct.nombre_producto}</span>
                                        </div>
                                    ) : `Producto ID: ${report.productId}`}
                                </th>
                                <td className="px-6 py-4 font-medium text-amber-600">{report.reason}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={report.description}>{report.description}</td>
                                <td className="px-6 py-4">
                                    {report.evidenceUrl ? (
                                        <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                                            Ver Foto
                                        </a>
                                    ) : <span className="text-slate-400">Sin foto</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                        {report.status}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderUsersTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-blue-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Nombre Completo</th>
                        <th scope="col" className="px-6 py-3">Correo Electrónico</th>
                        <th scope="col" className="px-6 py-3">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 ? (
                         <tr><td colSpan={5} className="text-center p-8">No hay usuarios registrados.</td></tr>
                    ) : users.map(user => (
                         <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">{user.id}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                    {user.firstName} {user.lastName}
                                </th>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.status === 'banned' ? 'Suspendido' : 'Activo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button 
                                        onClick={() => handleToggleUserStatus(user)}
                                        className={`font-medium px-3 py-1 rounded border transition-colors text-xs ${
                                            user.status === 'banned' 
                                            ? 'border-green-500 text-green-600 hover:bg-green-50' 
                                            : 'border-amber-500 text-amber-600 hover:bg-amber-50'
                                        }`}
                                    >
                                        {user.status === 'banned' ? 'Reactivar' : 'Banear'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="font-medium px-3 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50 text-xs transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <>
      <Header isAdminView={true} onLogout={onLogout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
                <h2 className="text-3xl font-bold text-slate-900">Panel de Administración</h2>
                <div className="flex space-x-4 mt-4 overflow-x-auto">
                    <button 
                        onClick={() => setView('products')}
                        className={`whitespace-nowrap text-sm font-medium pb-1 border-b-2 transition-colors ${view === 'products' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Productos
                    </button>
                    <button 
                        onClick={() => setView('reports')}
                        className={`whitespace-nowrap text-sm font-medium pb-1 border-b-2 transition-colors ${view === 'reports' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Ver Reportes ({reports.length})
                    </button>
                    <button 
                        onClick={() => setView('users')}
                        className={`whitespace-nowrap text-sm font-medium pb-1 border-b-2 transition-colors ${view === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Usuarios ({users.length})
                    </button>
                </div>
            </div>
            
            {view === 'products' && (
                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar producto o código..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            onClick={handleExportInventory}
                            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex justify-center items-center whitespace-nowrap"
                            title="Exportar inventario a CSV para respaldo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            Exportar
                        </button>
                        
                        <button 
                            onClick={handleDownloadReport}
                            className="bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 flex justify-center items-center whitespace-nowrap"
                            title="Descargar reporte de ventas del día"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Reporte Día
                        </button>

                        <button 
                            onClick={handleOpenModalForCreate}
                            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex justify-center items-center whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nuevo
                        </button>
                    </div>
                </div>
            )}
        </div>

        {view === 'products' && renderProductsTable()}
        {view === 'reports' && renderReportsTable()}
        {view === 'users' && renderUsersTable()}

      </main>
      {isModalOpen && (
        <ProductFormModal 
            onClose={handleCloseModal}
            onSave={handleSaveProduct}
            productToEdit={productToEdit}
        />
      )}
    </>
  );
};

export default AdminPage;
