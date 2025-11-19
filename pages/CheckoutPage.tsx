
import React, { useState, useEffect } from 'react';
import { CartItem, CustomerDetails, User } from '../types';
import OrderSummary from '../components/OrderSummary';
import PaymentOptions, { PaymentMethod } from '../components/PaymentOptions';
import * as api from '../services/apiService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

declare var Swal: any;

// STRIPE PUBLIC KEY
// Security: In production, verify this key usage in env variables.
const stripePromise = loadStripe('pk_test_51SUvP0IjdBKJRdUgAVkhhVPgI8DJ5DSo8N6rM6iBUGFzMfAukS4MiDdSXqlKkId7J3hKd9qy797pCTuUvjnBURrd00N28VUoMN');

interface CheckoutPageProps {
  cartItems: CartItem[];
  onPlaceOrder: (customerDetails: CustomerDetails) => void;
  onCancelCheckout: () => void;
  currentUser: User | null;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cartItems, onPlaceOrder, onCancelCheckout, currentUser }) => {
  const [customer, setCustomer] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: '',
    documentType: 'DNI',
    documentNumber: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  
  // Calculate Total
  const subtotal = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
  const igv = subtotal * 0.18;
  const totalAmount = subtotal + igv;

  useEffect(() => {
    if (currentUser) {
        setCustomer(prev => ({
            ...prev,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
        }));
    }
  }, [currentUser]);

  // Initialize Stripe PaymentIntent when component mounts or total changes
  useEffect(() => {
    const initPaymentIntent = async () => {
        if (totalAmount > 0) {
            try {
                const { clientSecret } = await api.createStripePaymentIntent(totalAmount);
                setClientSecret(clientSecret);
            } catch (error) {
                console.error("Error fetching payment intent:", error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo inicializar la pasarela de pagos.' });
            }
        }
    };
    initPaymentIntent();
  }, [totalAmount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // This handles non-Stripe submissions (like Mercado Pago in the future) or acts as a wrapper
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For Stripe, the submission is handled inside PaymentOptions via the hook
    // For Mercado Pago, it would be handled here
    if (selectedPayment === 'mercado_pago') {
        if (!validateForm()) return;
        setIsProcessing(true);
        try {
             await api.createMercadoPagoPreference(cartItems, customer);
             // Simulation
             setTimeout(() => {
                setIsProcessing(false);
                onPlaceOrder(customer);
            }, 2500);
        } catch (e) {
            setIsProcessing(false);
        }
    }
  };

  const validateForm = () => {
      if (!customer.firstName || !customer.lastName || !customer.email || !customer.documentNumber) {
        Swal.fire({ icon: 'warning', title: 'Información Incompleta', text: 'Por favor, completa todos los campos del cliente.'});
        return false;
      }

      // Security: Input Validation to prevent injection
      const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
      if (!nameRegex.test(customer.firstName) || !nameRegex.test(customer.lastName)) {
        Swal.fire({ icon: 'error', title: 'Datos inválidos', text: 'Los nombres solo pueden contener letras.'});
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) {
        Swal.fire({ icon: 'error', title: 'Datos inválidos', text: 'El correo electrónico no es válido.'});
        return false;
      }

      const docRegex = /^[0-9a-zA-Z]+$/;
      if (!docRegex.test(customer.documentNumber)) {
        Swal.fire({ icon: 'error', title: 'Datos inválidos', text: 'El número de documento contiene caracteres inválidos.'});
        return false;
      }

      return true;
  }

  const handleStripeSuccess = () => {
      onPlaceOrder(customer);
  }

  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="#" onClick={(e) => { e.preventDefault(); onCancelCheckout();}} className="text-2xl font-bold text-red-600">PaisaSoft - Pago</a>
          <button onClick={onCancelCheckout} className="text-sm font-medium text-slate-600 hover:text-red-600">
            &larr; Volver a la Tienda
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Customer Info & Payment */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <form id="checkout-form" onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Información del Cliente</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Nombres</label>
                            <input type="text" id="firstName" name="firstName" value={customer.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border p-2 bg-white text-slate-900" required/>
                            </div>
                            <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Apellidos</label>
                            <input type="text" id="lastName" name="lastName" value={customer.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border p-2 bg-white text-slate-900" required/>
                            </div>
                            <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                            <input type="email" id="email" name="email" value={customer.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border p-2 bg-white text-slate-900" required/>
                            </div>
                            <div>
                            <label htmlFor="documentType" className="block text-sm font-medium text-slate-700">Tipo de Documento</label>
                            <select id="documentType" name="documentType" value={customer.documentType} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border p-2 bg-white text-slate-900" required>
                                <option>DNI</option>
                                <option>RUC</option>
                                <option>Pasaporte</option>
                                <option>Carnet de Extranjería</option>
                            </select>
                            </div>
                            <div>
                            <label htmlFor="documentNumber" className="block text-sm font-medium text-slate-700">Número de Documento</label>
                            <input type="text" id="documentNumber" name="documentNumber" value={customer.documentNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border p-2 bg-white text-slate-900" required placeholder="Ej: 12345678"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Método de Pago</h2>
                    
                    {/* Wrapper for Stripe Elements */}
                    {clientSecret ? (
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                            <PaymentOptions 
                                selectedPayment={selectedPayment}
                                onSelectPayment={setSelectedPayment}
                                isProcessing={isProcessing}
                                onStripeSubmit={async (stripe, elements) => {
                                    if (!validateForm()) return;
                                    setIsProcessing(true);
                                    
                                    // MOCK/SIMULATION CHECK:
                                    // If we are using the mock secret, bypass Stripe real confirmation
                                    // to avoid "No such payment_intent" error in the university project demo.
                                    if (clientSecret === 'pi_mock_secret_for_demo_purposes_only') {
                                        setTimeout(() => {
                                            handleStripeSuccess();
                                            setIsProcessing(false);
                                        }, 2000);
                                        return;
                                    }

                                    // Real Stripe Processing (Would work if backend was connected)
                                    const result = await stripe.confirmCardPayment(clientSecret, {
                                        payment_method: {
                                            card: elements.getElement('card')!,
                                            billing_details: {
                                                name: `${customer.firstName} ${customer.lastName}`,
                                                email: customer.email,
                                            },
                                        },
                                    });

                                    if (result.error) {
                                        Swal.fire({ icon: 'error', title: 'Error en el pago', text: result.error.message });
                                        setIsProcessing(false);
                                    } else {
                                        if (result.paymentIntent.status === 'succeeded') {
                                            handleStripeSuccess();
                                        }
                                    }
                                }}
                            />
                        </Elements>
                    ) : (
                        <div className="text-center py-4 text-slate-500">Cargando pasarela de pagos...</div>
                    )}
                    </div>
                </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                <OrderSummary cartItems={cartItems} />
            </div>

        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
