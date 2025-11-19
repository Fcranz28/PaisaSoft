import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export type PaymentMethod = 'card' | 'mercado_pago';

interface PaymentOptionsProps {
    selectedPayment: PaymentMethod;
    onSelectPayment: (method: PaymentMethod) => void;
    isProcessing: boolean;
    onStripeSubmit?: (stripe: any, elements: any) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ selectedPayment, onSelectPayment, isProcessing, onStripeSubmit }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleStripePayClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onStripeSubmit && stripe && elements) {
            onStripeSubmit(stripe, elements);
        }
    };

    const renderPaymentDetails = () => {
        switch (selectedPayment) {
            case 'card':
                return (
                    <div className="text-center p-4 border rounded-md bg-slate-50">
                        <div className="flex items-center justify-center mb-4 space-x-2">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6"/>
                             <span className="text-slate-400 text-lg">|</span>
                             <span className="font-semibold text-slate-700">Tarjeta de Crédito/Débito</span>
                        </div>
                        
                        <div className="mb-6 text-left bg-white p-4 rounded border border-slate-300 shadow-sm">
                            <CardElement 
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                        invalid: {
                                            color: '#9e2146',
                                        },
                                    },
                                }}
                            />
                        </div>

                        <button 
                            type="button" 
                            onClick={handleStripePayClick}
                            disabled={!stripe || isProcessing} 
                            className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 font-semibold disabled:bg-red-400 disabled:cursor-wait transition-colors shadow-sm"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Procesando Pago...
                                </span>
                            ) : 'Pagar ahora'}
                        </button>
                        <p className="text-xs text-slate-500 mt-3 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-green-600">
                              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                            </svg>
                            Pagos seguros encriptados por Stripe
                        </p>
                    </div>
                );
            case 'mercado_pago':
                return (
                    <div className="text-center p-4 border rounded-md">
                        <p className="font-semibold mb-2">Pagar con Mercado Pago</p>
                        <p className="text-sm text-slate-600 mb-4">Serás redirigido a Mercado Pago para completar tu compra de forma segura.</p>
                        <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-2048.png" alt="Mercado Pago" className="h-12 mx-auto my-4" />
                        <button type="submit" disabled={isProcessing} className="w-full bg-sky-500 text-white py-3 rounded-md hover:bg-sky-600 font-semibold disabled:bg-sky-300 disabled:cursor-wait">
                           {isProcessing ? 'Procesando...' : 'Proceder a Mercado Pago'}
                        </button>
                    </div>
                );
        }
    };

    const getButtonClass = (method: PaymentMethod) => {
        return `flex-1 p-3 text-sm font-medium text-center border rounded-md cursor-pointer transition-colors ${selectedPayment === method ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`;
    };

    return (
        <div>
            <div className="flex space-x-2 mb-6">
                <button type="button" onClick={() => onSelectPayment('card')} className={getButtonClass('card')} disabled={isProcessing}>
                    Tarjeta Crédito/Débito
                </button>
                <button type="button" onClick={() => onSelectPayment('mercado_pago')} className={getButtonClass('mercado_pago')} disabled={isProcessing}>
                    Mercado Pago
                </button>
            </div>
            {renderPaymentDetails()}
        </div>
    );
};

export default PaymentOptions;