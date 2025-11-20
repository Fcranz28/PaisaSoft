
import { useState, useEffect, useCallback } from 'react';
import { User, Product, CartItem, CustomerDetails, Order } from '../types';
import * as api from '../services/apiService';

declare var Swal: any;

// Helper to escape HTML
const escapeHtml = (unsafe: string) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

export const useAppController = () => {
  // --- STATE ---
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

  // --- INITIALIZATION & DATA LOADING (Model Interaction) ---
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

  // --- NAVIGATION CONTROLLERS ---
  const navigateToHome = useCallback(() => {
    setCurrentView('home');
    setViewingProduct(null);
    setSelectedCategory(null);
    setSearchTerm('');
  }, []);
  
  const selectCategory = useCallback((category: string | null) => {
      setSelectedCategory(category);
      setIsSidebarOpen(false);
      setCurrentView('home');
      setViewingProduct(null);
  }, []);

  const toggleSidebar = useCallback(() => {
      setIsSidebarOpen(prev => !prev);
  }, []);

  const viewProduct = useCallback((product: Product) => {
    setViewingProduct(product);
    setCurrentView('product');
  }, []);

  const proceedToCheckout = useCallback(() => {
    setShowCart(false);
    setCurrentView('checkout');
  }, []);

  const cancelCheckout = useCallback(() => {
    setCurrentView('home');
  }, []);

  const navigateToProfile = useCallback(async () => {
    if (currentUser) {
        setIsLoading(true);
        const orders = await api.getOrdersForUser(currentUser.id);
        setUserOrders(orders);
        setCurrentView('profile');
        setIsLoading(false);
    }
  }, [currentUser]);

  // --- AUTH CONTROLLERS ---
  const loginSuccessAdmin = useCallback(() => {
    setIsAdminAuthenticated(true);
    setShowLogin(false);
  }, []);
  
  const loginSuccessUser = useCallback((user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
  }, []);

  const logout = useCallback(async () => {
    await api.logoutFirebase();
    setIsAdminAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('home');
  }, []);

  const registerSuccess = useCallback(() => {
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

  // --- CART CONTROLLERS ---
  const addToCart = useCallback((productToAdd: Product, quantity: number = 1) => {
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

  const updateCartQuantity = useCallback((productId: number, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  // --- ORDER CONTROLLER ---
  const placeOrder = useCallback(async (customerDetails: CustomerDetails) => {
    try {
        // 1. Save Order Locally
        const orderId = await api.saveOrder(cart, customerDetails, currentUser?.id);
        
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
            const invoiceResponse = await api.sendElectronicInvoice(cart, customerDetails, orderId);
            
            const isSuccess = invoiceResponse.sunatResponse?.success;
            const successMessage = isSuccess 
                ? 'Comprobante aceptado por SUNAT' 
                : 'Comprobante enviado (Estado por verificar)';
            
            const cdrDescription = invoiceResponse.sunatResponse?.cdrResponse?.description || 'Sin descripción CDR';

            // Note: Logic to generate HTML is View concern, but formatting data is Controller. 
            // We will return success status and let View handle display, or handle Swal here as it's a UI effect.
            
            // Simplified for brevity in controller, kept Swal here as it's deeply integrated
            Swal.fire({
                icon: isSuccess ? 'success' : 'warning',
                title: isSuccess ? '¡Pedido Exitoso!' : 'Atención',
                text: `${successMessage}. Código de pedido: ${orderId}`,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#000000',
            }).then(() => {
                setCart([]);
                setCurrentView('home');
            });

        } catch (invoiceError: any) {
            console.error("Error Facturacion:", invoiceError);
            Swal.fire({
                icon: 'warning',
                title: 'Pedido Guardado (Sin Factura)',
                text: `No se pudo emitir el comprobante electrónico: ${invoiceError.message}`,
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

  // Return Interface (ViewModel)
  return {
    state: {
      isAdminAuthenticated,
      currentUser,
      isAuthChecking,
      showLogin,
      showRegister,
      showCart,
      currentView,
      viewingProduct,
      displayedProducts,
      categories,
      cart,
      userOrders,
      isLoading,
      searchTerm,
      selectedCategory,
      isSidebarOpen,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    },
    actions: {
      setShowLogin,
      setShowRegister,
      setShowCart,
      setSearchTerm,
      loadAppData,
      navigateToHome,
      selectCategory,
      toggleSidebar,
      viewProduct,
      loginSuccessAdmin,
      loginSuccessUser,
      logout,
      registerSuccess,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      proceedToCheckout,
      cancelCheckout,
      navigateToProfile,
      placeOrder
    }
  };
};
