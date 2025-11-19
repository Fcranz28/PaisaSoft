
import React from 'react';
import { Product, CartItem } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  itemInCart?: CartItem;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewProduct, itemInCart, onUpdateQuantity }) => {
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  }

  const handleQuantityChange = (e: React.MouseEvent, newQuantity: number) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, newQuantity);
  }

  return (
    <div 
      className="group cursor-pointer flex flex-col h-full"
      onClick={() => onViewProduct(product)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-[#f4f4f5] overflow-hidden mb-4 transition-all duration-500">
        <img 
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
            src={product.imageUrl} 
            alt={product.nombre_producto} 
        />
        
        {/* Quick Add Overlay */}
        {!itemInCart && product.stock_actual > 0 && (
             <button 
             onClick={handleAddToCartClick}
             className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-black p-3 shadow-sm hover:bg-black hover:text-white transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-2 sm:group-hover:translate-y-0"
             aria-label="Agregar al carrito"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
             </svg>
           </button>
        )}

        {product.stock_actual === 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <span className="bg-black text-white text-xs uppercase tracking-widest px-3 py-1">Agotado</span>
            </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-grow space-y-1">
        <div className="flex justify-between items-start">
            <div className="flex-1 pr-2">
                <h3 className="font-serif text-lg leading-tight text-black group-hover:underline decoration-1 underline-offset-4 transition-all">
                    {product.nombre_producto}
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{product.categoria}</p>
            </div>
            <span className="font-medium text-black whitespace-nowrap">
                S/. {product.precio_venta.toFixed(2)}
            </span>
        </div>

        {/* Cart Control - Minimalist Icon + Quantity */}
        {itemInCart && (
             <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center text-green-700" title="En tu carrito">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div className="flex items-center border border-gray-200 bg-white">
                    <button onClick={(e) => handleQuantityChange(e, itemInCart.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                    <span className="px-2 text-sm font-medium w-8 text-center">{itemInCart.quantity}</span>
                    <button onClick={(e) => handleQuantityChange(e, itemInCart.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
