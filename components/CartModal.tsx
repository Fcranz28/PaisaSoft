
import React from 'react';
import { CartItem } from '../types';

interface CartModalProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onProceedToCheckout: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ cartItems, onClose, onUpdateQuantity, onRemoveFromCart, onProceedToCheckout }) => {
  const totalPrice = cartItems.reduce((total, item) => total + item.precio_venta * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-serif font-medium text-black">Tu Bolsa ({cartItems.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="mb-4">Tu bolsa está vacía.</p>
                <button onClick={onClose} className="text-black underline underline-offset-4 hover:opacity-60">Seguir comprando</button>
            </div>
          ) : (
            <ul className="space-y-8">
              {cartItems.map(item => (
                <li key={item.id} className="flex">
                  <div className="w-20 h-24 bg-gray-50 flex-shrink-0 overflow-hidden">
                    <img src={item.imageUrl} alt={item.nombre_producto} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-sm font-medium text-black leading-snug pr-4">{item.nombre_producto}</h3>
                            <p className="text-sm font-medium text-black">S/. {(item.precio_venta * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.categoria}</p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <div className="flex items-center border border-gray-200">
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-black">-</button>
                            <span className="px-2 text-xs font-medium">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:text-black">+</button>
                        </div>
                        <button 
                            onClick={() => onRemoveFromCart(item.id)} 
                            className="p-1 text-gray-300 hover:text-red-600 transition-colors"
                            aria-label="Eliminar del carrito"
                            title="Eliminar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-medium">S/. {totalPrice.toFixed(2)}</span>
            </div>
             <div className="flex justify-between items-center mb-6">
              <span className="text-base font-bold font-serif">Total</span>
              <span className="text-xl font-bold font-serif">S/. {totalPrice.toFixed(2)}</span>
            </div>
            <button 
              onClick={onProceedToCheckout}
              className="w-full bg-black text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
