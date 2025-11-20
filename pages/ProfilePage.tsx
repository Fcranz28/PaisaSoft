
import React, { useState } from 'react';
import { User, Order, CartItem, OrderStatus } from '../types';
import Header from '../components/Header';
import * as api from '../services/apiService';

declare var Swal: any;

interface ProfilePageProps {
  user: User;
  orders: Order[];
  onLogout: () => void;
  onNavigateHome: () => void;
  onCartClick: () => void;
  cartCount: number;
}

const OrderStepper = ({ status }: { status: OrderStatus }) => {
    const steps = [
        { key: 'pending', label: 'Pedido Realizado' },
        { key: 'preparing', label: 'Armando Pedido' },
        { key: 'ready', label: '¡Ya puedes pasar por tu pedido!' },
        { key: 'completed', label: 'Entregado' }
    ];

    // Mapping status to step index: 0, 1, 2, 3.
    let activeIndex = 0;
    if (status === 'preparing') activeIndex = 1;
    else if (status === 'ready') activeIndex = 2;
    else if (status === 'completed') activeIndex = 3;

    // Calculate progress bar width based on 3 intervals (4 steps) -> 33.33% per step
    const progressPercentage = Math.min(activeIndex * 33.33, 100);

    return (
        <div className="mt-6 relative">
            <div className="flex items-center justify-between w-full">
                {steps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    
                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 w-1/4">
                            <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                    ${isCompleted || isActive
                                        ? 'bg-green-600 border-green-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-300'
                                    }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    <span className="text-xs font-bold">{index + 1}</span>
                                )}
                            </div>
                            <p className={`text-[10px] sm:text-xs mt-2 font-medium text-center leading-tight px-1 ${isActive || isCompleted ? 'text-black' : 'text-gray-400'}`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
            {/* Connecting Line Background */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
            {/* Connecting Line Progress */}
            <div 
                className="absolute top-4 left-0 h-0.5 bg-green-600 -z-0 transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
        </div>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, orders, onLogout, onNavigateHome, onCartClick, cartCount }) => {
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const getMostOrderedProducts = () => {
    if (orders.length === 0) return [];
    
    const productCount = new Map<number, { product: CartItem, count: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productCount.get(item.id);
        if (existing) {
          existing.count += item.quantity;
        } else {
          productCount.set(item.id, { product: item, count: item.quantity });
        }
      });
    });

    return Array.from(productCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const handleDownloadPdf = async (order: Order) => {
    setDownloadingOrderId(order.id);
    try {
      await api.downloadInvoicePdf(order);
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: 'Descarga iniciada',
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo descargar el comprobante.'
      });
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleCopyTrackingId = (id: string) => {
      navigator.clipboard.writeText(id).then(() => {
          Swal.fire({
              toast: true,
              position: 'top',
              icon: 'success',
              title: 'Código Copiado',
              showConfirmButton: false,
              timer: 1000,
              background: '#1a1a1a',
              color: '#fff',
              iconColor: '#fff'
          });
      });
  };

  const mostOrdered = getMostOrderedProducts();

  return (
    <>
      <Header
        currentUser={user}
        onLogout={onLogout}
        onNavigateToProfile={() => {}} // Already here
        onCartClick={onCartClick}
        cartCount={cartCount}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Mi Cuenta</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Orders */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Historial de Pedidos</h2>
            <div className="space-y-6">
              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-slate-800">Pedido #{order.id.split('-')[1]}</p>
                            {/* Discrete Tracking ID */}
                            <button 
                                onClick={() => handleCopyTrackingId(order.id)}
                                className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors gap-1"
                                title="Copiar código de seguimiento"
                            >
                                <span>(ID: {order.id})</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(order.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right mt-2 sm:mt-0">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="font-bold text-xl text-blue-600">S/.{order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    <div className="mb-8 px-2">
                        <OrderStepper status={order.status} />
                    </div>

                    <ul className="divide-y divide-slate-200 border-t pt-2 mb-4">
                      {order.items.map(item => (
                        <li key={item.id} className="py-2 flex items-center justify-between">
                          <div className="flex items-center">
                            <img src={item.imageUrl} alt={item.nombre_producto} className="w-10 h-10 rounded-md object-cover mr-3" />
                            <div>
                                <p className="font-semibold text-sm text-slate-700">{item.nombre_producto}</p>
                                <p className="text-xs text-slate-500">Cant: {item.quantity}</p>
                            </div>
                          </div>
                           <p className="font-medium text-sm text-slate-600">S/.{(item.precio_venta * item.quantity).toFixed(2)}</p>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex justify-end border-t pt-4">
                        <button 
                          onClick={() => handleDownloadPdf(order)}
                          disabled={downloadingOrderId === order.id}
                          className="flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-600 hover:bg-red-50 px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                          {downloadingOrderId === order.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Generando PDF...</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              <span>Descargar Comprobante</span>
                            </>
                          )}
                        </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-slate-600">Aún no has realizado ningún pedido.</p>
                  <button onClick={onNavigateHome} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Comenzar a Comprar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Profile & Frequent Products */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-slate-800 mb-3">Información de Perfil</h3>
              <p className="text-sm text-slate-600"><strong className="font-medium text-slate-700">Nombre:</strong> {user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-600"><strong className="font-medium text-slate-700">Correo:</strong> {user.email}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Tus Productos Frecuentes</h3>
               {mostOrdered.length > 0 ? (
                <ul className="space-y-3">
                  {mostOrdered.map(({ product, count }) => (
                    <li key={product.id} className="flex items-center">
                      <img src={product.imageUrl} alt={product.nombre_producto} className="w-12 h-12 rounded-md object-cover mr-3" />
                      <div>
                        <p className="font-semibold text-sm text-slate-700">{product.nombre_producto}</p>
                        <p className="text-xs text-slate-500">Comprado {count} veces</p>
                      </div>
                    </li>
                  ))}
                </ul>
               ) : (
                <p className="text-sm text-slate-500">Aún no tienes productos frecuentes. ¡Realiza tu primera compra!</p>
               )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default ProfilePage;