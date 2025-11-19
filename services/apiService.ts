
import { Product, CartItem, CustomerDetails, User, Order, ProductReport, ElectronicInvoiceResponse } from '../types';
import { fetchProductsFromSource } from './geminiService';
import { auth, googleProvider, facebookProvider, twitterProvider } from '../firebaseConfig';
import { signInWithPopup, UserCredential, AuthError, signOut, onAuthStateChanged } from 'firebase/auth';
import { jsPDF } from "jspdf";

// --- STORAGE KEYS ---
const STORAGE_KEYS = {
    PRODUCTS: 'paisasoft_products',
    USERS: 'paisasoft_users',
    ORDERS: 'paisasoft_orders',
    REPORTS: 'paisasoft_reports'
};

// This will act as our in-memory database
let products: Product[] = [];

// SECURITY NOTE: In production, these must be in environment variables (process.env.REACT_APP_...)
const APIS_PERU_TOKEN = process.env.REACT_APP_APIS_PERU_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VybmFtZSI6IkZjcmFuejI4IiwiaWF0IjoxNzYzNTY1MjQ3LCJleHAiOjE3NjM2NTE2NDd9.QlH6xzPEvRK1Os7V5HJPpKlijV9PGl8b6bt9NQ1ommDr8hwWELyWBEwHN0wTjShSlbol0R5U86Dmpdoxbr63Stbq_M0swiElkFuBvHtA3ylnFXZMoYDT6NKno2wN4-ujPZCX6C86N5xi53H3bstdvohkY9YE_Uh-I43u3A45gY6B3NtadPrg6S2Fkp-I22fJ3TtkHCoArJVLhss6OpZo6d9_OG-eirepXqaBhHB-alVH1f2Si8dx2YeSth_JpEvmJTRFAIkltCgPBeCtzGQxvrmK9kKgNpe1gG215OF0gOTE4jAqSwfT2gqaV6oTiMpjEHSGT4jXp81s0ydU7qYEn5OgVpTrLJfagXqh3748DugCR3ZIWHFkNBYUzZ21Gk5-EA8EKfA9X1qf02g9YwdHo0nVWpIRse_MkEWHFXkjDMtKW3rhneFpOh9hMqGOAQPWkG853SSlvq6InaMAyYZQkP0m_9mJb2jlVsZ1hqYteZ9YKGHQs8cxbynZ6b4J_EFOavKDf64pIv3FVYtEhchfaz4r-c-ydOqHB52WPBFY5izY2C5fr0iICFKHAZHDr27LmVsZxxupsB94MDM6nwh7cHhjmd3mWAJJKkL6YcH1DxUreZ0mkFsAPN3ig299KEwcjOLonjW3_QkoJ-WYqfYa3NpZV4hNAfG8KUmkqLltQeA";
const APIS_PERU_URL_SEND = "https://facturacion.apisperu.com/api/v1/invoice/send";

// Security: Simple hash function to avoid storing plaintext passwords in memory/code
// In production, use bcrypt on the server side.
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

// Security: Validate URL schemes to prevent javascript: attacks
const isValidUrl = (string: string): boolean => {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
};

// Security: Regex for basic input sanitization
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Initialize users with a secure admin representation
let users: User[] = [
    {
        id: 'admin-user-id',
        firstName: 'Administrador',
        lastName: 'Principal',
        email: 'admin@paisasoft.com',
        status: 'active',
        role: 'admin', // Security: Explicit role assignment
        // Password is "admin123" - Hashed at runtime for this demo so you can login
        password: simpleHash("admin123"), 
        provider: 'email'
    }
];
let orders: Order[] = [];
let reports: ProductReport[] = []; // Store reports here
let nextUserId = 1;
let isInitialized = false;

// --- Helper Functions for Persistence ---
const saveProducts = () => localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
const saveUsers = () => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
const saveOrders = () => localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
const saveReports = () => localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

// --- Initialization ---

export const initializeData = async () => {
    if (isInitialized) return;
    try {
        // 1. Load Users
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            // Ensure admin exists if first load
            saveUsers(); 
        }

        // 2. Load Orders
        const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (storedOrders) {
            orders = JSON.parse(storedOrders);
        }

        // 3. Load Reports
        const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
        if (storedReports) {
            reports = JSON.parse(storedReports);
        }

        // 4. Load Products
        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (storedProducts) {
            products = JSON.parse(storedProducts);
            console.log("Loaded products from LocalStorage");
        } else {
            // If no local data, fetch from Gemini/Sheets
            console.log("Fetching products from Gemini/Sheets...");
            products = await fetchProductsFromSource();
            saveProducts(); // Save to local storage for next time
        }
    } catch (e) {
        console.warn("Could not fetch initial products, falling back to empty state.", e);
        products = [];
    }
    isInitialized = true;
};

// --- Product CRUD Operations ---

export const getProducts = async (category?: string | null, searchTerm?: string): Promise<Product[]> => {
    if (!isInitialized) await initializeData();
    
    let filteredProducts = [...products];

    if (category) {
        filteredProducts = filteredProducts.filter(p => p.categoria === category);
    }

    if (searchTerm) {
        // Security: sanitize search term to prevent regex DoS (ReDoS) if used in complex regex, 
        // though here we use simple includes which is safe.
        const safeSearchTerm = searchTerm.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(p => 
            p.nombre_producto.toLowerCase().includes(safeSearchTerm)
        );
    }
    
    return Promise.resolve(filteredProducts);
};

export const getProductById = async (id: number): Promise<Product | undefined> => {
    if (!isInitialized) await initializeData();
    return Promise.resolve(products.find(p => p.id === id));
};

export const createProduct = async (newProductData: Omit<Product, 'id'>): Promise<Product> => {
    if (!isInitialized) await initializeData();

    // Security: Validate Image URL
    if (!isValidUrl(newProductData.imageUrl)) {
        throw new Error("La URL de la imagen no es válida o segura.");
    }

    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const newProduct: Product = { ...newProductData, id: newId };
    products.push(newProduct);
    saveProducts(); // Persist
    
    return Promise.resolve(newProduct);
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
    if (!isInitialized) await initializeData();

    // Security: Validate Image URL
    if (!isValidUrl(updatedProduct.imageUrl)) {
        throw new Error("La URL de la imagen no es válida o segura.");
    }

    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index === -1) {
        throw new Error("Product not found");
    }
    products[index] = updatedProduct;
    saveProducts(); // Persist
    return Promise.resolve(updatedProduct);
};

export const deleteProduct = async (productId: number): Promise<void> => {
    if (!isInitialized) await initializeData();
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);
    if (products.length === initialLength) {
        throw new Error("Product not found for deletion");
    }
    saveProducts(); // Persist
    return Promise.resolve();
};

// --- User Management (Mixed: Local + Firebase) ---

export const registerUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    if (!isInitialized) await initializeData();

    // Security: Input Validation
    if (!emailRegex.test(userData.email)) {
        throw new Error("Formato de correo electrónico inválido.");
    }
    if (userData.firstName.length > 50 || userData.lastName.length > 50) {
        throw new Error("Los nombres son demasiado largos.");
    }

    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('El correo electrónico ya está registrado.');
    }
    const newUser: User = { 
        ...userData, 
        id: nextUserId++,
        status: 'active',
        role: 'customer', // Default role
        provider: 'email',
        password: userData.password ? simpleHash(userData.password) : undefined // Hash password on storage
    };
    users.push(newUser);
    saveUsers(); // Persist
    const { password, ...userToReturn } = newUser;
    return Promise.resolve(userToReturn);
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
    if (!isInitialized) await initializeData();

    // Local login logic simulating a backend check
    const hashedPassword = simpleHash(password);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPassword);
    
    if (!user) {
        return Promise.resolve(null);
    }
    if (user.status === 'banned') {
        throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.');
    }
    
    // Return user info without the password
    const { password: removedPassword, ...userToReturn } = user;
    return Promise.resolve(userToReturn);
};

// Helper to process Firebase User Result
const processFirebaseUser = (firebaseUser: any, provider: 'google' | 'facebook' | 'twitter' | 'email'): User => {
    // Check if user exists in our local 'database'
    let user = users.find(u => u.email === firebaseUser.email);
    
    if (user) {
        if (user.status === 'banned') {
            throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.');
        }
        // Update info if needed (e.g., photo)
        user.photoUrl = firebaseUser.photoURL;
        saveUsers(); // Persist updates
        return user;
    }

    // Create new user from social data
    const splitName = firebaseUser.displayName ? firebaseUser.displayName.split(' ') : ['Usuario', 'Nuevo'];
    const firstName = splitName[0];
    const lastName = splitName.slice(1).join(' ') || '';

    const newUser: User = {
        id: firebaseUser.uid, // Use Firebase UID
        email: firebaseUser.email || `no-email-${firebaseUser.uid}@example.com`, // Twitter might not return email depending on API settings
        firstName: firstName,
        lastName: lastName,
        status: 'active',
        role: 'customer',
        photoUrl: firebaseUser.photoURL,
        provider: provider
    };
    
    users.push(newUser);
    saveUsers(); // Persist
    return newUser;
};

const handleAuthError = (error: any, providerName: string) => {
    console.error(`${providerName} Login Error details:`, error);
    
    if (error.code === 'auth/configuration-not-found') {
        throw new Error(`Configuración no encontrada: Debes habilitar el proveedor '${providerName}' en la consola de Firebase (Authentication > Sign-in method).`);
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("El usuario cerró la ventana de inicio de sesión.");
    }

    if (error.code === 'auth/popup-blocked') {
        throw new Error("El navegador bloqueó la ventana emergente. Por favor, habilita las ventanas emergentes para este sitio e intenta nuevamente.");
    }

    if (error.code === 'auth/cancelled-popup-request') {
        // Esto ocurre cuando se hacen clicks multiples, lo ignoramos o mostramos advertencia leve
        throw new Error("Operación cancelada por conflicto de solicitudes.");
    }

    if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        throw new Error(`Dominio no autorizado (${currentDomain}): Debes agregar "${currentDomain}" a la lista de dominios autorizados en Firebase Console > Authentication > Settings.`);
    }
    
    throw new Error(error.message || `Error al iniciar sesión con ${providerName}`);
};

export const loginWithGoogle = async (): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth no está configurado.");
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return processFirebaseUser(result.user, 'google');
    } catch (error: any) {
        handleAuthError(error, 'Google');
        throw error;
    }
};

export const loginWithFacebook = async (): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth no está configurado.");
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        return processFirebaseUser(result.user, 'facebook');
    } catch (error: any) {
        handleAuthError(error, 'Facebook');
        throw error;
    }
};

export const loginWithTwitter = async (): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth no está configurado.");
    try {
        const result = await signInWithPopup(auth, twitterProvider);
        return processFirebaseUser(result.user, 'twitter');
    } catch (error: any) {
        handleAuthError(error, 'Twitter');
        throw error;
    }
};

export const logoutFirebase = async (): Promise<void> => {
    if (!auth) return;
    await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            try {
                // Determine provider
                let providerType: 'google' | 'facebook' | 'twitter' | 'email' = 'email';
                if (firebaseUser.providerData.length > 0) {
                    const providerId = firebaseUser.providerData[0].providerId;
                    if (providerId.includes('google')) providerType = 'google';
                    else if (providerId.includes('facebook')) providerType = 'facebook';
                    else if (providerId.includes('twitter')) providerType = 'twitter';
                }

                // Ensure initialization before checking users
                if (!isInitialized) {
                    initializeData().then(() => {
                         const user = processFirebaseUser(firebaseUser, providerType); 
                         callback(user);
                    });
                } else {
                     const user = processFirebaseUser(firebaseUser, providerType); 
                     callback(user);
                }
            } catch (e) {
                console.error("Error restoring session:", e);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
};


// Admin: Get all users
export const getUsers = async (): Promise<User[]> => {
    if (!isInitialized) await initializeData();
    return Promise.resolve(users.map(({password, ...u}) => u));
};

// Admin: Ban/Unban user
export const updateUserStatus = async (userId: number | string, status: 'active' | 'banned'): Promise<void> => {
    if (!isInitialized) await initializeData();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = status;
        saveUsers(); // Persist
    }
    return Promise.resolve();
};

// Admin: Delete user
export const deleteUser = async (userId: number | string): Promise<void> => {
    if (!isInitialized) await initializeData();
    users = users.filter(u => u.id !== userId);
    saveUsers(); // Persist
    return Promise.resolve();
};


// --- Order Saving & Payment Simulation ---

export const saveOrder = async (cartItems: CartItem[], customer: CustomerDetails, userId?: number | string): Promise<void> => {
    if (!isInitialized) await initializeData();
    
    const orderId = `ORD-${Date.now()}`;
    const orderDate = new Date().toISOString();
    const subtotal = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
    const total = subtotal * 1.18;

    const newOrder: Order = {
        id: orderId,
        userId: userId || 0,
        customerDetails: customer,
        items: cartItems,
        total: total,
        date: orderDate,
    };

    orders.push(newOrder);
    saveOrders(); // Persist

    // Reduce Stock logic (Simple implementation)
    cartItems.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock_actual = Math.max(0, product.stock_actual - item.quantity);
        }
    });
    saveProducts(); // Persist stock changes

    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
};

export const getOrdersForUser = async (userId: number | string): Promise<Order[]> => {
    if (!isInitialized) await initializeData();
    const userOrders = orders.filter(o => o.userId === userId);
    return Promise.resolve(userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
};

export const getTodaysOrders = async (): Promise<Order[]> => {
    if (!isInitialized) await initializeData();
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    return Promise.resolve(todaysOrders);
};

// --- Report Management ---

export const createReport = async (reportData: Omit<ProductReport, 'id' | 'date' | 'status'>): Promise<void> => {
    if (!isInitialized) await initializeData();

    // Security: Validate URL
    if (reportData.evidenceUrl && !isValidUrl(reportData.evidenceUrl)) {
        throw new Error("Evidence URL is invalid.");
    }

    const newReport: ProductReport = {
        ...reportData,
        id: `REP-${Date.now()}`,
        date: new Date().toISOString(),
        status: 'Pending'
    };
    reports.push(newReport);
    saveReports(); // Persist
    await new Promise(resolve => setTimeout(resolve, 800));
    return Promise.resolve();
};

export const getReports = async (): Promise<ProductReport[]> => {
    if (!isInitialized) await initializeData();
    return Promise.resolve([...reports]);
};


export const createMercadoPagoPreference = async (cartItems: CartItem[], customer: CustomerDetails): Promise<{ redirectUrl: string }> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return Promise.resolve({ redirectUrl: 'https://mercadopago.com/checkout/...' });
};

// IMPORTANT: This function simulates a backend call. 
// In a real application, you MUST create the PaymentIntent on your server (Node.js, Python, etc.)
// using the Secret Key, and then return the clientSecret to the frontend.
export const createStripePaymentIntent = async (totalAmount: number): Promise<{ clientSecret: string }> => {
    console.warn("SECURITY WARNING: Using Mock Payment Intent. In production, fetch this from your secure backend.");
    
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // This is a fake client secret pattern. Real Stripe processing will fail with this, 
    // but it prevents the app from crashing in this demo environment and secures the secret key.
    // To make Stripe actually work, you need a backend server.
    return { clientSecret: 'pi_mock_secret_for_demo_purposes_only' };
};

// --- Electronic Invoicing (Facturación Electrónica) ---

// Simple Number to Words Converter for "SON: X SOLES"
const numberToWords = (amount: number): string => {
    // Security: Prevent Recursion limit exceeded or hang with extremely large numbers
    if (amount > 999999999) return "VALOR EXCEDE LIMITE";

    const units = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
    const tens = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
    const teens = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    let words = "";
    
    if (integerPart === 0) words = "CERO";
    else if (integerPart < 10) words = units[integerPart];
    else if (integerPart < 20) words = teens[integerPart - 10];
    else if (integerPart < 100) {
         const t = Math.floor(integerPart / 10);
         const u = integerPart % 10;
         words = tens[t] + (u > 0 ? " Y " + units[u] : "");
    } else {
        words = "CIENTO " + (integerPart % 100); // Placeholder logic for simplicity
    }
    
    return `SON ${words} CON ${decimalPart.toString().padStart(2, '0')}/100 SOLES`;
};

// Helper function to construct the JSON payload
const constructInvoicePayload = (cartItems: CartItem[], customer: CustomerDetails, orderId?: string) => {
    const isRUC = customer.documentType === 'RUC';
    const invoiceType = isRUC ? '01' : '03'; // 01: Factura, 03: Boleta
    const series = isRUC ? 'F001' : 'B001';
    
    // Use part of order ID for correlativo or generate random one for demo
    const correlativo = orderId ? orderId.split('-')[1].slice(0, 8) : Math.floor(Date.now() / 1000).toString().slice(-4);

    const mtoOperGravadas = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
    const mtoIGV = mtoOperGravadas * 0.18;
    const totalImpuestos = mtoIGV;
    const mtoImpVenta = mtoOperGravadas + mtoIGV;

    // Construct Item Details
    const details = cartItems.map(item => {
        const valorUnitario = item.precio_venta; // Base price
        const valorVenta = valorUnitario * item.quantity;
        const igv = valorVenta * 0.18;
        const precioUnitario = valorUnitario * 1.18; // Price Inc IGV

        return {
            codProducto: item.codigo_interno || `PROD-${item.id}`,
            unidad: 'NIU',
            descripcion: item.nombre_producto,
            cantidad: item.quantity,
            mtoValorUnitario: parseFloat(valorUnitario.toFixed(2)),
            mtoValorVenta: parseFloat(valorVenta.toFixed(2)),
            mtoBaseIgv: parseFloat(valorVenta.toFixed(2)),
            porcentajeIgv: 18,
            igv: parseFloat(igv.toFixed(2)),
            tipAfeIgv: '10', // Gravado - Operación Onerosa
            totalImpuestos: parseFloat(igv.toFixed(2)),
            mtoPrecioUnitario: parseFloat(precioUnitario.toFixed(2))
        };
    });

    return {
        ublVersion: "2.1",
        tipoOperacion: "0101",
        tipoDoc: invoiceType,
        serie: series,
        correlativo: correlativo,
        fechaEmision: new Date().toISOString().split('T')[0] + "T12:00:00-05:00",
        formaPago: {
            moneda: "PEN",
            tipo: "Contado"
        },
        tipoMoneda: "PEN",
        client: {
            tipoDoc: isRUC ? "6" : "1", // 6: RUC, 1: DNI
            numDoc: customer.documentNumber,
            rznSocial: `${customer.firstName} ${customer.lastName}`,
            address: {
                direccion: "Av. Siempre Viva 123",
                provincia: "LIMA",
                departamento: "LIMA",
                distrito: "LIMA",
                ubigueo: "150101"
            }
        },
        company: {
            ruc: 20000000001,
            razonSocial: "Mi empresa",
            nombreComercial: "Mi empresa",
            address: {
                direccion: "Direccion empresa",
                provincia: "LIMA",
                departamento: "LIMA",
                distrito: "LIMA",
                ubigueo: "150101"
            }
        },
        mtoOperGravadas: parseFloat(mtoOperGravadas.toFixed(2)),
        mtoIGV: parseFloat(mtoIGV.toFixed(2)),
        valorVenta: parseFloat(mtoOperGravadas.toFixed(2)),
        totalImpuestos: parseFloat(totalImpuestos.toFixed(2)),
        subTotal: parseFloat(mtoImpVenta.toFixed(2)),
        mtoImpVenta: parseFloat(mtoImpVenta.toFixed(2)),
        details: details,
        legends: [
            {
                code: "1000",
                value: numberToWords(mtoImpVenta)
            }
        ]
    };
};

export const sendElectronicInvoice = async (cartItems: CartItem[], customer: CustomerDetails): Promise<ElectronicInvoiceResponse> => {
    const invoiceData = constructInvoicePayload(cartItems, customer);

    try {
        const response = await fetch(APIS_PERU_URL_SEND, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APIS_PERU_TOKEN}`
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();

        if (!response.ok) {
             return {
                sunatResponse: {
                    success: false,
                    error: {
                         code: "API_ERROR",
                         message: data.message || "Error desconocido en API Perú"
                    }
                }
            };
        }

        return data as ElectronicInvoiceResponse;

    } catch (error: any) {
        console.error("Facturación Electrónica Error:", error);
        throw error;
    }
};

export const downloadInvoicePdf = async (order: Order): Promise<void> => {
    // For the simulation/university project, we generate the PDF locally using jsPDF
    // instead of relying on the external API which may fail with invalid test data/tokens.
    try {
        const doc = new jsPDF();
        const isFactura = order.customerDetails.documentType === 'RUC';
        const title = isFactura ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA";
        const docSerie = isFactura ? "F001" : "B001";
        const correlativo = order.id.split('-')[1].slice(0, 8);

        // Company Info (Header)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("PAISASOFT S.A.C.", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Av. Universitaria 123, Lima, Perú", 105, 26, { align: "center" });
        doc.text("RUC: 20123456789", 105, 31, { align: "center" });

        // Invoice Box
        doc.setDrawColor(0);
        doc.rect(140, 10, 60, 25);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("R.U.C. 20123456789", 170, 18, { align: "center" });
        doc.setFillColor(240, 240, 240);
        doc.rect(140, 21, 60, 8, 'F'); // Fill background for title
        doc.setFontSize(10);
        doc.text(title, 170, 26, { align: "center" });
        doc.setFontSize(12);
        doc.text(`${docSerie}-${correlativo}`, 170, 32, { align: "center" });

        // Customer Info
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Fecha de Emisión:", 14, 45);
        doc.text("Cliente:", 14, 50);
        doc.text(`${order.customerDetails.documentType}:`, 14, 55);
        doc.text("Moneda:", 14, 60);

        doc.setFont("helvetica", "normal");
        doc.text(new Date(order.date).toLocaleDateString('es-PE'), 45, 45);
        doc.text(`${order.customerDetails.firstName} ${order.customerDetails.lastName}`, 45, 50);
        doc.text(order.customerDetails.documentNumber, 45, 55);
        doc.text("SOLES", 45, 60);

        // Table
        let y = 70;
        // Headers
        doc.setFillColor(240, 240, 240);
        doc.rect(14, y, 182, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Cant.", 16, y + 5);
        doc.text("Descripción", 35, y + 5);
        doc.text("P. Unit", 145, y + 5, { align: "right" });
        doc.text("Total", 190, y + 5, { align: "right" });
        
        y += 8;
        doc.setFont("helvetica", "normal");
        
        order.items.forEach(item => {
            const totalItem = item.precio_venta * item.quantity;
            
            // Basic wrapping for long names
            const nameLines = doc.splitTextToSize(item.nombre_producto, 100);
            
            doc.text(item.quantity.toString(), 16, y + 5);
            doc.text(nameLines, 35, y + 5);
            doc.text(item.precio_venta.toFixed(2), 145, y + 5, { align: "right" });
            doc.text(totalItem.toFixed(2), 190, y + 5, { align: "right" });
            
            y += (nameLines.length * 5) + 2;
        });

        // Totals
        y += 5;
        doc.line(14, y, 196, y);
        y += 5;

        const subtotal = order.total / 1.18;
        const igv = order.total - subtotal;

        doc.text("OP. GRAVADAS:", 145, y + 5, { align: "right" });
        doc.text(subtotal.toFixed(2), 190, y + 5, { align: "right" });
        
        doc.text("IGV (18%):", 145, y + 10, { align: "right" });
        doc.text(igv.toFixed(2), 190, y + 10, { align: "right" });
        
        doc.setFont("helvetica", "bold");
        doc.text("IMPORTE TOTAL:", 145, y + 16, { align: "right" });
        doc.text(`S/. ${order.total.toFixed(2)}`, 190, y + 16, { align: "right" });

        // Amount in words
        y += 25;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(numberToWords(order.total), 14, y);

        // Footer
        const footerY = 280;
        doc.text("Representación impresa de la Factura Electrónica, generado en entorno de demostración.", 105, footerY, { align: "center" });

        doc.save(`${title}_${order.id}.pdf`);
        return Promise.resolve();

    } catch (error: any) {
        console.error("Error generating PDF:", error);
        throw new Error("Error al generar el PDF localmente.");
    }
};
