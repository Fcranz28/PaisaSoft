
import React, { useEffect, useState } from 'react';
import { Product, User } from '../types';
import Header from '../components/Header';
import ProductReportModal from '../components/ProductReportModal';

declare var Swal: any;

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onCartClick: () => void;
  cartCount: number;
  currentUser: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onMenuClick: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ 
    product, 
    onBack, 
    onAddToCart, 
    onCartClick, 
    cartCount,
    currentUser,
    onLoginClick,
    onRegisterClick,
    onLogout,
    onNavigateToProfile,
    onMenuClick
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    document.title = `${product.nombre_producto} | PaisaSoft`;
    return () => {
      document.title = 'PaisaSoft E-Commerce';
    };
  }, [product]);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => {
        const newQuantity = prev + amount;
        if (newQuantity < 1) return 1;
        if (newQuantity > product.stock_actual) {
             Swal.fire({
                toast: true,
                position: 'top',
                icon: 'info',
                title: `Stock máximo: ${product.stock_actual}`,
                showConfirmButton: false,
                timer: 2000,
                background: '#000',
                color: '#fff'
            });
            return product.stock_actual;
        }
        return newQuantity;
    });
  };
  
  const handleAddToCart = () => {
    onAddToCart(product, quantity);
  }

  const isStockAvailable = product.stock_actual > 0;

  return (
    <>
      <Header 
        onCartClick={onCartClick} 
        cartCount={cartCount}
        currentUser={currentUser}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onLogout={onLogout}
        onNavigateToProfile={onNavigateToProfile}
        onMenuClick={onMenuClick}
      />
      
      <main className="container mx-auto px-6 lg:px-12 py-12">
        {/* Back Button Moved Outside Image Container */}
        <div className="mb-6">
             <button onClick={onBack} className="text-sm uppercase tracking-wider font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Volver
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Left: Image */}
            <div className="relative bg-[#f9f9f9] aspect-[4/5] lg:aspect-square flex items-center justify-center p-8">
                <img 
                    src={product.imageUrl} 
                    alt={product.nombre_producto} 
                    className="w-full h-full object-contain mix-blend-multiply"
                />
            </div>

            {/* Right: Details (Sticky on Desktop) */}
            <div className="flex flex-col justify-center h-full">
                <div className="lg:sticky lg:top-32">
                    <div className="flex justify-between items-start">
                         <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">{product.categoria}</p>
                         <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Reportar un problema"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                            </svg>
                        </button>
                    </div>
                   
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-black leading-tight mb-6">{product.nombre_producto}</h1>
                    
                    <p className="text-3xl font-light text-black mb-8">S/. {product.precio_venta.toFixed(2)}</p>

                    <div className="prose prose-slate text-gray-600 mb-10 leading-relaxed font-light">
                        {product.descripcion}
                    </div>

                    <div className="border-t border-b border-gray-100 py-8 mb-8">
                        {isStockAvailable ? (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center border border-gray-300 w-full sm:w-32 h-12">
                                    <button onClick={() => handleQuantityChange(-1)} className="w-10 h-full text-gray-500 hover:text-black transition-colors">-</button>
                                    <span className="flex-1 text-center font-medium">{quantity}</span>
                                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock_actual} className="w-10 h-full text-gray-500 hover:text-black transition-colors disabled:opacity-30">+</button>
                                </div>
                                <button 
                                    onClick={handleAddToCart}
                                    className="flex-1 h-12 bg-black text-white uppercase tracking-widest text-sm font-bold hover:bg-gray-800 transition-colors duration-300"
                                >
                                    Agregar al Carrito
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-12 bg-gray-100 text-gray-400 flex items-center justify-center uppercase tracking-widest text-sm font-bold cursor-not-allowed">
                                Agotado
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-gray-400 font-light uppercase tracking-wider">
                        <p>Código: <span className="text-gray-600">{product.codigo_interno}</span></p>
                        <p>Disponibilidad: <span className={product.stock_actual > 5 ? "text-green-600" : "text-amber-600"}>{product.stock_actual} en stock</span></p>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {isReportModalOpen && (
        <ProductReportModal 
            product={product}
            onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProductDetailPage;
