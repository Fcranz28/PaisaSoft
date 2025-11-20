
import React from 'react';
import Header from '../components/Header';
import ProductFormModal from '../components/ProductFormModal';
import { useAdminController } from '../controllers/useAdminController'; // Import Controller

interface AdminPageProps {
  onDataChange: () => void; 
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onDataChange, onLogout }) => {
  // Use Controller
  const { state, actions } = useAdminController(onDataChange);

  const getSearchPlaceholder = () => {
      switch(state.view) {
          case 'products': return 'Buscar producto...';
          case 'orders': return 'Buscar pedido...';
          case 'users': return 'Buscar usuario...';
          case 'reports': return 'Buscar reporte...';
          default: return 'Buscar...';
      }
  }
  
  // --- Render Functions (View Logic Only) ---

  const renderReportModal = () => {
      if (!state.selectedReport) return null;

      const stepIndex = state.selectedReport.status === 'Pending' ? 0 
          : state.selectedReport.status === 'Reviewing' ? 1 
          : 2; // Approved or Rejected

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold text-slate-800">Gestionar Reporte</h2>
                <button onClick={() => actions.setIsReportModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                {/* Details */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <p className="text-sm text-slate-600"><span className="font-bold">Fecha:</span> {new Date(state.selectedReport.date).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-600"><span className="font-bold">Motivo:</span> {state.selectedReport.reason}</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-2"><span className="font-bold">Descripción:</span> {state.selectedReport.description}</p>
                    {state.selectedReport.evidenceUrl && (
                         <div className="mt-2">
                            <p className="text-xs font-bold text-slate-500 mb-1">EVIDENCIA:</p>
                            <a href={state.selectedReport.evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">Ver imagen completa</a>
                            <img src={state.selectedReport.evidenceUrl} alt="Evidencia" className="h-32 object-contain border rounded mt-1 bg-white"/>
                         </div>
                    )}
                </div>

                {/* Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
                        
                        {['Pendiente', 'En Revisión', 'Resolución'].map((step, idx) => {
                            const isActive = idx === stepIndex;
                            const isCompleted = idx < stepIndex;
                            return (
                                <div key={step} className="flex flex-col items-center bg-white px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                                        ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                                          isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                                          'border-gray-300 bg-white text-gray-400'}
                                    `}>
                                        {isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{step}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Actions based on Step */}
                <div className="space-y-4">
                    {stepIndex === 0 && (
                         <div className="text-center">
                             <p className="text-sm text-gray-600 mb-3">El reporte ha sido recibido. Comienza la revisión para proceder.</p>
                             <button 
                                onClick={() => actions.handleResolveReport('Reviewing')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-bold"
                             >
                                 Empezar Revisión
                             </button>
                         </div>
                    )}

                    {(stepIndex === 1 || stepIndex === 2) && (
                        <div className="bg-white border rounded-lg p-4 animate-fade-in">
                            <h3 className="font-bold text-slate-800 mb-2">Resolución del Admin</h3>
                            <label className="block text-sm text-slate-600 mb-2">
                                Justificación (Obligatorio para aprobar/denegar):
                            </label>
                            <textarea 
                                className="w-full border border-slate-300 rounded p-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                rows={3}
                                placeholder="Escribe aquí la razón de la decisión..."
                                value={state.justification}
                                onChange={(e) => actions.setJustification(e.target.value)}
                                disabled={stepIndex === 2} 
                            ></textarea>
                            
                            {stepIndex === 1 && (
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => actions.handleResolveReport('Rejected')}
                                        className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors text-sm font-bold"
                                    >
                                        Denegar Reporte
                                    </button>
                                    <button 
                                        onClick={() => actions.handleResolveReport('Approved')}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-bold"
                                    >
                                        Aprobar Reporte
                                    </button>
                                </div>
                            )}
                            
                            {stepIndex === 2 && (
                                <div className={`text-center p-2 rounded text-sm font-bold ${state.selectedReport.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    Reporte {state.selectedReport.status === 'Approved' ? 'Aprobado' : 'Denegado'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
          </div>
        </div>
      );
  };

  const renderProductsTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-red-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Producto</th>
                        <th scope="col" className="px-6 py-3">Precio</th>
                        <th scope="col" className="px-6 py-3">Stock</th>
                        <th scope="col" className="px-6 py-3">Vencimiento</th>
                        <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {state.filteredProducts.map(product => (
                        <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover"/>
                                <div>{product.nombre_producto}<br/><span className="text-xs text-gray-400">{product.codigo_interno}</span></div>
                            </th>
                            <td className="px-6 py-4">S/.{product.precio_venta.toFixed(2)}</td>
                            <td className="px-6 py-4">{product.stock_actual}</td>
                            <td className="px-6 py-4">{product.fecha_vencimiento || '-'}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => actions.handleOpenModalForEdit(product)} className="text-blue-600 hover:underline">Editar</button>
                                <button onClick={() => actions.handleDeleteClick(product.id)} className="text-red-600 hover:underline">Eliminar</button>
                            </td>
                        </tr>
                    ))}
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
                        <th scope="col" className="px-6 py-3">Motivo</th>
                        <th scope="col" className="px-6 py-3">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right">Gestión</th>
                    </tr>
                </thead>
                <tbody>
                    {state.filteredReports.map(report => (
                        <tr key={report.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4">{new Date(report.date).toLocaleDateString()}</td>
                            <th scope="row" className="px-6 py-4 font-medium text-slate-900">{report.reason}</th>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                    ${report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      report.status === 'Reviewing' ? 'bg-blue-100 text-blue-800' :
                                      report.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {report.status === 'Pending' && 'Pendiente'}
                                    {report.status === 'Reviewing' && 'En Revisión'}
                                    {report.status === 'Approved' && 'Aprobado'}
                                    {report.status === 'Rejected' && 'Denegado'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => actions.handleManageReport(report)}
                                    className="bg-slate-800 text-white px-3 py-1 rounded hover:bg-black text-xs"
                                >
                                    Gestionar
                                </button>
                            </td>
                        </tr>
                    ))}
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
                          <th scope="col" className="px-6 py-3">Usuario</th>
                          <th scope="col" className="px-6 py-3">Email</th>
                          <th scope="col" className="px-6 py-3">Estado</th>
                          <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {state.filteredUsers.map(user => (
                          <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                              <td className="px-6 py-4 font-medium text-slate-900">{user.firstName} {user.lastName}</td>
                              <td className="px-6 py-4">{user.email}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {user.status === 'active' ? 'Activo' : 'Suspendido'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                  <button onClick={() => actions.handleToggleUserStatus(user)} className="text-amber-600 hover:underline text-xs">{user.status === 'active' ? 'Banear' : 'Activar'}</button>
                                  <button onClick={() => actions.handleDeleteUser(user.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderOrdersTable = () => (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full min-w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-purple-50">
                      <tr>
                          <th scope="col" className="px-6 py-3">ID Seguimiento</th>
                          <th scope="col" className="px-6 py-3">Cliente</th>
                          <th scope="col" className="px-6 py-3">Total</th>
                          <th scope="col" className="px-6 py-3">Estado</th>
                          <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                          <th scope="col" className="px-6 py-3 text-center">PDF</th>
                      </tr>
                  </thead>
                  <tbody>
                      {state.filteredOrders.map(order => (
                          <tr key={order.id} className="bg-white border-b hover:bg-slate-50">
                              <td className="px-6 py-4 font-mono text-xs">
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700">{order.id}</span>
                                      <button onClick={() => actions.handleCopyTrackingId(order.id)} className="text-gray-400 hover:text-blue-600" title="Copiar ID">
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                                          </svg>
                                      </button>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <p className="font-medium text-slate-900">{order.customerDetails.firstName}</p>
                                  <p className="text-xs">{order.customerDetails.documentNumber}</p>
                              </td>
                              <td className="px-6 py-4 font-bold">S/.{order.total.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap
                                      ${order.status === 'pending' ? 'bg-gray-100 text-gray-600' : 
                                        order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                                        order.status === 'ready' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                      {order.status === 'pending' ? 'Pendiente' : 
                                       order.status === 'preparing' ? 'En Prep' : 
                                       order.status === 'ready' ? 'Listo' : 'Entregado'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                    {order.status === 'pending' && (
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'preparing')} className="text-blue-600 hover:underline text-xs font-bold">Armar</button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'ready')} className="text-amber-600 hover:underline text-xs font-bold">Listo</button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'completed')} className="text-green-600 hover:underline text-xs font-bold">Entregar</button>
                                    )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <button onClick={() => actions.handlePrintInvoice(order)} disabled={state.downloadingPdfId === order.id} className="text-slate-500 hover:text-black">
                                      {state.downloadingPdfId === order.id ? '...' : '🖨'}
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
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
            <div className="w-full xl:w-auto">
                <h2 className="text-3xl font-bold text-slate-900">Panel de Administración</h2>
                <div className="flex space-x-2 sm:space-x-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        onClick={() => actions.handleViewChange('products')}
                        className={`whitespace-nowrap text-sm font-medium px-2 pb-2 border-b-2 transition-colors ${state.view === 'products' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Productos
                    </button>
                    <div className="relative flex items-center">
                        <button 
                            onClick={() => actions.handleViewChange('orders')}
                            className={`whitespace-nowrap text-sm font-medium px-2 pb-2 border-b-2 transition-colors ${state.view === 'orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Gestionar Pedidos
                        </button>
                        {state.pendingOrdersCount > 0 && (
                            <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                {state.pendingOrdersCount}
                            </span>
                        )}
                    </div>
                    <div className="relative flex items-center ml-2">
                        <button 
                            onClick={() => actions.handleViewChange('reports')}
                            className={`whitespace-nowrap text-sm font-medium px-2 pb-2 border-b-2 transition-colors ${state.view === 'reports' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Ver Reportes
                        </button>
                        {state.pendingReportsCount > 0 && (
                            <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                {state.pendingReportsCount}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => actions.handleViewChange('users')}
                        className={`whitespace-nowrap text-sm font-medium px-2 pb-2 border-b-2 transition-colors ${state.view === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Usuarios
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto items-start lg:items-center">
                <div className="relative w-full lg:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={getSearchPlaceholder()}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full lg:w-64"
                        value={state.searchTerm}
                        onChange={(e) => actions.setSearchTerm(e.target.value)}
                    />
                </div>

                {state.view === 'products' && (
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button 
                            onClick={actions.handleOpenModalForCreate}
                            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex justify-center items-center whitespace-nowrap flex-grow lg:flex-grow-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nuevo
                        </button>
                    </div>
                )}
            </div>
        </div>

        {state.view === 'products' && renderProductsTable()}
        {state.view === 'reports' && renderReportsTable()}
        {state.view === 'users' && renderUsersTable()}
        {state.view === 'orders' && renderOrdersTable()}

      </main>
      {state.isModalOpen && (
        <ProductFormModal 
            onClose={actions.handleCloseModal}
            onSave={actions.handleSaveProduct}
            productToEdit={state.productToEdit}
        />
      )}
      {state.isReportModalOpen && renderReportModal()}
    </>
  );
};

export default AdminPage;
