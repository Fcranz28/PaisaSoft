
import React, { useState } from 'react';
import * as api from '../services/apiService';

interface RegisterModalProps {
  onClose: () => void;
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onRegisterSuccess, onLoginClick }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    setIsLoading(true);
    try {
        const { confirmPassword, ...userData } = formData;
        await api.registerUser(userData);
        onRegisterSuccess();
    } catch (err: any) {
        setError(err.message || 'Ocurrió un error durante el registro.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Crear una Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="firstName">Nombres</label>
              <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="lastName">Apellidos</label>
              <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" required />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="email-register">Correo Electrónico</label>
            <input id="email-register" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="password-register">Contraseña</label>
            <input id="password-register" name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" required />
          </div>
           <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" required />
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex justify-center">
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
         <p className="text-center text-sm text-slate-600 mt-4">
            ¿Ya tienes una cuenta?{' '}
            <button onClick={onLoginClick} className="font-medium text-blue-600 hover:underline">
              Inicia sesión aquí
            </button>
          </p>
      </div>
    </div>
  );
};

export default RegisterModal;
