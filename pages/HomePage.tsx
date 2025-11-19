
import React from 'react';
import { Product, CartItem, User } from '../types';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

interface HomePageProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
  onCartClick: () => void;
  cartItems: CartItem[];
  onUpdateCartQuantity: (productId: number, newQuantity: number) => void;
  cartCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onViewProduct: (product: Product) => void;
  // Sidebar and Category Props
  onMenuClick: () => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  // Auth props
  currentUser: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 aspect-[3/4] w-full mb-4"></div>
        <div className="h-4 bg-gray-200 w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200 w-1/3"></div>
      </div>
    ))}
  </div>
);

const HeroSection = () => (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
             <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop" 
                alt="Grocery Market" 
                className="w-full h-full object-cover opacity-90"
             />
             <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
            <p className="uppercase tracking-[0.3em] text-sm md:text-base mb-4 font-medium">Calidad Premium</p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
                Lo fresco,<br/>a tu puerta.
            </h1>
            <button 
                onClick={() => document.getElementById('product-grid-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-black px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-black hover:text-white transition-colors duration-300"
            >
                Ver Productos
            </button>
        </div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ 
  products, 
  isLoading, 
  onAddToCart, 
  onCartClick, 
  cartCount, 
  searchTerm, 
  onSearchChange,
  onViewProduct,
  cartItems,
  onUpdateCartQuantity,
  onMenuClick,
  selectedCategory,
  onSelectCategory,
  currentUser,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onNavigateToProfile,
}) => {
  
  return (
    <>
      <Header 
        onCartClick={onCartClick} 
        cartCount={cartCount} 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onMenuClick={onMenuClick}
        currentUser={currentUser}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onLogout={onLogout}
        onNavigateToProfile={onNavigateToProfile}
      />
      
      <main>
        {!selectedCategory && !searchTerm && <HeroSection />}

        <div id="product-grid-section" className="bg-[#E6E6E6] min-h-screen py-16">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-black">
                        {selectedCategory || (searchTerm ? `Resultados para "${searchTerm}"` : 'Nuestra Selección')}
                    </h2>
                    <p className="text-gray-500 mt-2 font-light">
                        {products.length} productos disponibles
                    </p>
                </div>
                {selectedCategory && (
                     <button onClick={() => onSelectCategory(null)} className="text-sm underline underline-offset-4 text-gray-500 hover:text-black">
                        Ver todo
                     </button>
                )}
              </div>

              {isLoading ? (
                <ProductGridSkeleton />
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">
                  {products.map((product) => {
                    const itemInCart = cartItems.find(item => item.id === product.id);
                    return (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={onAddToCart} 
                        onViewProduct={onViewProduct}
                        itemInCart={itemInCart}
                        onUpdateQuantity={onUpdateCartQuantity}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-32 border-t border-b border-gray-300">
                  <h3 className="text-2xl font-serif text-gray-500">Sin resultados</h3>
                  <p className="text-gray-500 mt-2 font-light">
                    Intenta ajustar tu búsqueda.
                  </p>
                  <button onClick={() => onSelectCategory(null)} className="mt-6 text-black border-b border-black pb-0.5 hover:opacity-50">Limpiar filtros</button>
                </div>
              )}
            </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
