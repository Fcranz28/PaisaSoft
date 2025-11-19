
import React from 'react';
import { CartItem } from '../types';

interface OrderSummaryProps {
  cartItems: CartItem[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cartItems }) => {
  const subtotal = cartItems.reduce((total, item) => total + item.precio_venta * item.quantity, 0);
  const taxes = subtotal * 0.18; // Example tax rate
  const total = subtotal + taxes;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Resumen del Pedido</h2>
      <ul className="divide-y divide-slate-200">
        {cartItems.map(item => (
          <li key={item.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center">
              <img src={item.imageUrl} alt={item.nombre_producto} className="w-12 h-12 rounded-md object-cover mr-3" />
              <div>
                <p className="font-semibold text-sm text-slate-800">{item.nombre_producto}</p>
                <p className="text-xs text-slate-500">Cant: {item.quantity}</p>
              </div>
            </div>
            <p className="font-medium text-sm">S/.{(item.precio_venta * item.quantity).toFixed(2)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium">S/.{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">IGV (18%)</span>
          <span className="font-medium">S/.{taxes.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>S/.{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
