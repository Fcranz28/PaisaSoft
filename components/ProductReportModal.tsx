
import React, { useState } from 'react';
import { Product } from '../types';
import * as api from '../services/apiService';

declare var Swal: any;

interface ProductReportModalProps {
  product: Product;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Producto Vencido",
  "Precio Incorrecto",
  "Mala Calidad / Dañado",
  "Imagen no coincide",
  "Falta de Stock (Real)",
  "Otro"
];

const ProductReportModal: React.FC<ProductReportModalProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "PaisaSoft"); 

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/dgj2ol5r1/image/upload", {
            method: "POST",
            body: data
        });
        
        const fileData = await response.json();

        if (!response.ok) {
            throw new Error(fileData.error?.message || "Error al subir imagen");
        }

        setFormData(prev => ({ ...prev, evidenceUrl: fileData.secure_url }));
    } catch (error: any) {
        console.error("Error uploading image:", error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo subir la evidencia.' });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason) {
        Swal.fire('Error', 'Por favor selecciona un motivo.', 'warning');
        return;
    }
    
    setIsSubmitting(true);
    try {
        await api.createReport({
            productId: product.id,
            reason: formData.reason,
            description: formData.description,
            evidenceUrl: formData.evidenceUrl
        });

        Swal.fire({
            icon: 'success',
            title: 'Reporte Enviado',
            text: 'Gracias por ayudarnos a mejorar.',
            timer: 2000,
            showConfirmButton: false
        });
        onClose();
    } catch (error) {
        Swal.fire('Error', 'Hubo un problema al enviar el reporte.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-bold text-slate-800">Reportar Problema</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
            <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Producto: <span className="font-semibold text-slate-700">{product.nombre_producto}</span></p>
            </div>

            <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Motivo del Reporte</label>
                <select name="reason" id="reason" value={formData.reason} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border bg-white text-slate-900" required>
                    <option value="">Selecciona un motivo...</option>
                    {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descripción Detallada</label>
                <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border bg-white text-slate-900" placeholder="Describe el problema encontrado..."></textarea>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Evidencia (Foto)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"/>
                {isUploading && <p className="text-xs text-blue-500 mt-1">Subiendo imagen...</p>}
                {formData.evidenceUrl && (
                    <div className="mt-2">
                        <img src={formData.evidenceUrl} alt="Evidencia" className="h-24 w-auto rounded border"/>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" disabled={isUploading || isSubmitting} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded disabled:bg-red-300">
                    {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProductReportModal;
