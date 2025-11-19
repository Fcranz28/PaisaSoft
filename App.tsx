
import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import Login from './components/Login';
import RegisterModal from './components/RegisterModal';
import CartModal from './components/CartModal';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';
import { Product, CartItem, CustomerDetails, User, Order } from './types';
import * as api from './services/apiService';

declare var Swal: any;

// WhatsApp Floating Button Component - Minimalist Redesign
const WhatsAppButton = () => {
  const getWhatsAppUrl = () => {
    const phoneNumber = "51941451076";
    const message = "Hola, estoy interesado en sus productos.";
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <a 
      href={getWhatsAppUrl()}
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-xl hover:bg-green-600 transition-all duration-300 z-50 flex items-center justify-center border border-green-600"
      aria-label="Contactar por WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
      </svg>
    </a>
  );
};

// Security: Improved Function to escape HTML characters to prevent XSS
const escapeHtml = (unsafe: string) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/`/g, "&#96;") // Security: Prevent template literal injection
         .replace(/\//g, "&#x2F;") // Security: Prevent closing tag injection
         .replace(/=/g, "&#x3D;"); // Security: Prevent attribute injection
};

const generateInvoiceHTML = (customerDetails: CustomerDetails, cartItems: CartItem[], sunatData?: any): string => {
    const isFactura = customerDetails.documentType === 'RUC';
    const title = isFactura ? 'Factura Electrónica' : 'Boleta de Venta Electrónica';
    const orderId = `ORD-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    const subtotal = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const itemsHTML = cartItems.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; text-align: left; font-size: 0.9rem;">${escapeHtml(item.nombre_producto)}<br><span style="color: #888; font-size: 0.8rem;">Cant: ${item.quantity}</span></td>
            <td style="padding: 12px 0; text-align: right; font-size: 0.9rem;">S/. ${(item.precio_venta * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    // Additional SUNAT Info if available
    let sunatInfoHTML = '';
    if (sunatData?.sunatResponse?.cdrResponse) {
        sunatInfoHTML = `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; margin-top: 15px; border-radius: 4px; font-size: 0.85rem; color: #166534;">
                <strong>Estado SUNAT:</strong> ${escapeHtml(sunatData.sunatResponse.cdrResponse.description)}<br/>
                <strong>Código CDR:</strong> ${escapeHtml(sunatData.sunatResponse.cdrResponse.id)}
            </div>
        `;
    }

    return `
      <div style="text-align: left; font-family: 'Inter', sans-serif; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.5rem; margin: 0;">PAISASOFT</h3>
          <p style="font-size: 0.8rem; color: #666; margin-top: 4px;">${title}</p>
        </div>
        <div style="font-size: 0.875rem; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #666;">Pedido:</span> <span>${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
             <span style="color: #666;">Fecha:</span> <span>${orderDate}</span>
          </div>
          <hr style="margin: 1rem 0; border-top: 1px solid #eee;" />
          <p style="margin-bottom: 4px;"><strong>Cliente:</strong> ${escapeHtml(customerDetails.firstName)} ${escapeHtml(customerDetails.lastName)}</p>
          <p style="margin-bottom: 4px;"><strong>${escapeHtml(customerDetails.documentType)}:</strong> ${escapeHtml(customerDetails.documentNumber)}</p>
          <p><strong>Email:</strong> ${escapeHtml(customerDetails.email)}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #1a1a1a;">
              <th style="padding: 8px 0; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Descripción</th>
              <th style="padding: 8px 0; text-align: right; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #1a1a1a; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Subtotal</span> <span>S/. ${subtotal.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span>IGV (18%)</span> <span>S/. ${igv.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.25rem; font-family: 'Playfair Display', serif;"><span>Total</span> <span>S/. ${total.toFixed(2)}</span></div>
        </div>
        ${sunatInfoHTML}
      </div>
    `;
};


function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'checkout' | 'profile'>('home');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);


  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.initializeData();
      const allProducts = await api.getProducts();
      const allCategories = [...new Set(allProducts.map(p => p.categoria))].sort();
      setDisplayedProducts(allProducts);
      setCategories(allCategories);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: error.message || '¡Algo salió mal al cargar los datos!' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Initial Auth Check (Persistence) ---
  useEffect(() => {
      const unsubscribe = api.subscribeToAuthChanges((user) => {
          setCurrentUser(user);
          setIsAuthChecking(false);
      });
      return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    const fetchFiltered = async () => {
      const filtered = await api.getProducts(selectedCategory, searchTerm);
      setDisplayedProducts(filtered);
    };
    fetchFiltered();
  }, [searchTerm, selectedCategory]);

  const handleNavigateHome = useCallback(() => {
    setCurrentView('home');
    setViewingProduct(null);
    setSelectedCategory(null);
    setSearchTerm('');
  }, []);
  
  const handleSelectCategory = useCallback((category: string | null) => {
      setSelectedCategory(category);
      setIsSidebarOpen(false);
      setCurrentView('home');
      setViewingProduct(null);
  }, []);

  useEffect(() => {
    window.addEventListener('navigateHome', handleNavigateHome);
    return () => window.removeEventListener('navigateHome', handleNavigateHome);
  }, [handleNavigateHome]);

  // --- Auth Handlers ---
  const handleAdminLoginSuccess = useCallback(() => {
    setIsAdminAuthenticated(true);
    setShowLogin(false);
  }, []);
  
  const handleUserLoginSuccess = useCallback((user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await api.logoutFirebase();
    setIsAdminAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('home');
  }, []);

  const handleRegisterSuccess = useCallback(() => {
      setShowRegister(false);
      Swal.fire({
          icon: 'success',
          title: '¡Registro Exitoso!',
          text: 'Ahora puedes iniciar sesión con tu nueva cuenta.',
          confirmButtonColor: '#000000',
          confirmButtonText: 'Iniciar Sesión'
      }).then(() => {
          setShowLogin(true);
      });
  }, []);

  // --- Cart Handlers ---
  const handleAddToCart = useCallback((productToAdd: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productToAdd.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === productToAdd.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...productToAdd, quantity }];
    });
    Swal.fire({
      icon: 'success',
      title: 'Agregado al Carrito',
      text: `${quantity > 1 ? `${quantity} x ` : ''}${productToAdd.nombre_producto}`,
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: false,
      background: '#1a1a1a',
      color: '#ffffff',
      iconColor: '#ffffff'
    });
  }, []);

  const handleUpdateCartQuantity = useCallback((productId: number, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);
  
  // --- Navigation & View Handlers ---
  const handleProceedToCheckout = useCallback(() => {
    setShowCart(false);
    setCurrentView('checkout');
  }, []);

  const handleCancelCheckout = useCallback(() => {
    setCurrentView('home');
  }, []);
  
  const handleViewProduct = useCallback((product: Product) => {
    setViewingProduct(product);
    setCurrentView('product');
  }, []);

  const handleNavigateToProfile = useCallback(async () => {
    if (currentUser) {
        setIsLoading(true);
        const orders = await api.getOrdersForUser(currentUser.id);
        setUserOrders(orders);
        setCurrentView('profile');
        setIsLoading(false);
    }
  }, [currentUser]);

  // --- Order Placement & Electronic Invoicing ---
  const handleOrderSuccess = useCallback(async (customerDetails: CustomerDetails) => {
    try {
        // 1. Save Order Locally
        await api.saveOrder(cart, customerDetails, currentUser?.id);
        
        // 2. Show Processing Message
        Swal.fire({
            title: 'Emitiendo Comprobante...',
            text: 'Conectando con SUNAT a través de APIs Perú',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 3. Send Electronic Invoice
        try {
            const invoiceResponse = await api.sendElectronicInvoice(cart, customerDetails);
            
            const isSuccess = invoiceResponse.sunatResponse?.success;
            const successMessage = isSuccess 
                ? 'Comprobante aceptado por SUNAT' 
                : 'Comprobante enviado (Estado por verificar)';
            
            const cdrDescription = invoiceResponse.sunatResponse?.cdrResponse?.description || 'Sin descripción CDR';

            const invoiceHTML = generateInvoiceHTML(customerDetails, cart, invoiceResponse);

            Swal.fire({
                icon: isSuccess ? 'success' : 'warning',
                title: isSuccess ? '¡Pedido Exitoso!' : 'Atención',
                html: `
                    <div class="text-left space-y-2 mb-4">
                        <p class="font-bold ${isSuccess ? 'text-green-600' : 'text-orange-500'}">✔ ${successMessage}</p>
                        <p class="text-sm text-gray-600">${escapeHtml(cdrDescription)}</p>
                    </div>
                    <hr class="my-2"/>
                    ${invoiceHTML}
                `,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#000000',
                width: '550px',
                padding: '2em'
            }).then(() => {
                setCart([]);
                setCurrentView('home');
            });

        } catch (invoiceError: any) {
            console.error("Error Facturacion:", invoiceError);
            // Fallback if Invoice API fails, but Order was saved
            const invoiceHTML = generateInvoiceHTML(customerDetails, cart);
            Swal.fire({
                icon: 'warning',
                title: 'Pedido Guardado (Sin Factura)',
                html: `
                    <p class="text-red-500 mb-4">No se pudo emitir el comprobante electrónico: ${invoiceError.message}</p>
                    ${invoiceHTML}
                `,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#000000'
            }).then(() => {
                setCart([]);
                setCurrentView('home');
            });
        }

    } catch(error) {
        console.error("Failed to save order:", error);
        Swal.fire({ icon: 'error', title: 'Pedido Fallido', text: 'Hubo un problema al realizar tu pedido.', confirmButtonColor: '#000000' });
    }
  }, [cart, currentUser]);


  const renderContent = () => {
    if (isAdminAuthenticated) {
      return <AdminPage onDataChange={loadAppData} onLogout={handleLogout} />;
    }
    
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    switch (currentView) {
      case 'checkout':
        return <CheckoutPage cartItems={cart} onPlaceOrder={handleOrderSuccess} onCancelCheckout={handleCancelCheckout} currentUser={currentUser} />;
      case 'product':
        return (
            <ProductDetailPage 
                product={viewingProduct!} 
                onBack={() => setCurrentView('home')} 
                onAddToCart={handleAddToCart} 
                onCartClick={() => setShowCart(true)} 
                cartCount={cartCount}
                currentUser={currentUser}
                onLoginClick={() => setShowLogin(true)}
                onRegisterClick={() => setShowRegister(true)}
                onLogout={handleLogout}
                onNavigateToProfile={handleNavigateToProfile}
                onMenuClick={() => setIsSidebarOpen(true)}
            />
        );
      case 'profile':
        return <ProfilePage user={currentUser!} orders={userOrders} onLogout={handleLogout} onNavigateHome={handleNavigateHome} onCartClick={() => setShowCart(true)} cartCount={cartCount}/>;
      case 'home':
      default:
        return (
          <HomePage 
            products={displayedProducts} 
            isLoading={isLoading}
            onAddToCart={handleAddToCart}
            onCartClick={() => setShowCart(true)}
            cartItems={cart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            cartCount={cartCount}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onViewProduct={handleViewProduct}
            onMenuClick={() => setIsSidebarOpen(prev => !prev)}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            // Auth props for header
            currentUser={currentUser}
            onLoginClick={() => setShowLogin(true)}
            onRegisterClick={() => setShowRegister(true)}
            onLogout={handleLogout}
            onNavigateToProfile={handleNavigateToProfile}
          />
        );
    }
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 antialiased selection:bg-black selection:text-white">
      {renderContent()}
      
      {!isAdminAuthenticated && (
        <>
            <Sidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />
            <WhatsAppButton />
        </>
      )}

      {showLogin && (
        <Login 
            onAdminLoginSuccess={handleAdminLoginSuccess} 
            onUserLoginSuccess={handleUserLoginSuccess}
            onClose={() => setShowLogin(false)}
            onRegisterClick={() => { setShowLogin(false); setShowRegister(true); }}
        />
      )}
      
      {showRegister && (
        <RegisterModal 
            onClose={() => setShowRegister(false)}
            onRegisterSuccess={handleRegisterSuccess}
            onLoginClick={() => { setShowRegister(false); setShowLogin(true); }}
        />
      )}

      {showCart && (
        <CartModal 
          cartItems={cart} 
          onClose={() => setShowCart(false)} 
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}
    </div>
  );
}

export default App;
