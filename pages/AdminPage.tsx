
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
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
                                <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0"/>
                                <div>{product.nombre_producto}<br/><span className="text-xs text-gray-400">{product.codigo_interno}</span></div>
                            </th>
                            <td className="px-6 py-4">S/.{product.precio_venta.toFixed(2)}</td>
                            <td className="px-6 py-4">{product.stock_actual}</td>
                            <td className="px-6 py-4">{product.fecha_vencimiento || '-'}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => actions.handleOpenModalForEdit(product)} 
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => actions.handleDeleteClick(product.id)} 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
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
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
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
                                    className="bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-black text-xs flex items-center gap-2 ml-auto transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
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
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => actions.handleToggleUserStatus(user)} 
                                        className={`p-2 rounded-full transition-colors ${user.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                        title={user.status === 'active' ? 'Suspender Usuario' : 'Activar Usuario'}
                                    >
                                        {user.status === 'active' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => actions.handleDeleteUser(user.id)} 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Eliminar Usuario"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                  </div>
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
                                      <span className="font-bold text-slate-700 whitespace-nowrap">{order.id}</span>
                                      <button onClick={() => actions.handleCopyTrackingId(order.id)} className="text-gray-400 hover:text-blue-600" title="Copiar ID">
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
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
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'preparing')} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ml-auto transition-colors border border-blue-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                            </svg>
                                            Armar
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'ready')} className="text-amber-600 hover:bg-amber-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ml-auto transition-colors border border-amber-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            Listo
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button onClick={() => actions.handleUpdateOrderStatus(order.id, 'completed')} className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ml-auto transition-colors border border-green-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25M18 1.5v2.25m0 0h4.5m-4.5 0L21 3M3 3l2.25 2.25m0 0L7.5 3m-2.25 2.25h12" />
                                            </svg>
                                            Entregar
                                        </button>
                                    )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <button 
                                    onClick={() => actions.handlePrintInvoice(order)} 
                                    disabled={state.downloadingPdfId === order.id} 
                                    className="text-slate-500 hover:text-black p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                                    title="Imprimir Comprobante"
                                  >
                                      {state.downloadingPdfId === order.id ? (
                                          <svg className="animate-spin w-5 h-5 flex-shrink-0 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                      ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                                          </svg>
                                      )}
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
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        onClick={() => actions.handleViewChange('products')}
                        className={`whitespace-nowrap text-sm font-medium px-3 pb-2 border-b-2 transition-colors ${state.view === 'products' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Productos
                    </button>
                    
                    <button 
                        onClick={() => actions.handleViewChange('orders')}
                        className={`whitespace-nowrap text-sm font-medium px-3 pb-2 border-b-2 transition-colors flex items-center gap-2 ${state.view === 'orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Pedidos
                        {state.pendingOrdersCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {state.pendingOrdersCount}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => actions.handleViewChange('reports')}
                        className={`whitespace-nowrap text-sm font-medium px-3 pb-2 border-b-2 transition-colors flex items-center gap-2 ${state.view === 'reports' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Ver Reportes
                        {state.pendingReportsCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {state.pendingReportsCount}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => actions.handleViewChange('users')}
                        className={`whitespace-nowrap text-sm font-medium px-3 pb-2 border-b-2 transition-colors ${state.view === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestionar Usuarios
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto items-start lg:items-center">
                <div className="relative w-full lg:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 flex-shrink-0">
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
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
