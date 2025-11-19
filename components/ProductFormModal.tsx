
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

declare var Swal: any;

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  productToEdit?: Product;
}

const GROCERY_CATEGORIES = [
  "Abarrotes",
  "Bebidas",
  "Lácteos y Huevos",
  "Carnes y Embutidos",
  "Frutas y Verduras",
  "Panadería y Pastelería",
  "Limpieza del Hogar",
  "Cuidado Personal",
  "Snacks y Golosinas",
  "Mascotas",
  "Bebés",
  "Otros"
];

const ProductFormModal: React.FC<ProductFormModalProps> = ({ onClose, onSave, productToEdit }) => {
  const [formData, setFormData] = useState({
    codigo_interno: '',
    nombre_producto: '',
    descripcion: '',
    precio_venta: 0,
    stock_actual: 0,
    categoria: '',
    imageUrl: 'https://picsum.photos/400',
    fecha_vencimiento: '',
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        codigo_interno: productToEdit.codigo_interno,
        nombre_producto: productToEdit.nombre_producto,
        descripcion: productToEdit.descripcion,
        precio_venta: productToEdit.precio_venta,
        stock_actual: productToEdit.stock_actual,
        categoria: productToEdit.categoria,
        imageUrl: productToEdit.imageUrl,
        fecha_vencimiento: productToEdit.fecha_vencimiento || '',
      });
    }
  }, [productToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Validation: File Type
    if (!file.type.startsWith('image/')) {
         Swal.fire({
            icon: 'error',
            title: 'Archivo no válido',
            text: 'Por favor, sube solo archivos de imagen (JPG, PNG, WEBP).',
        });
        return;
    }

    // Security Validation: File Size (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
         Swal.fire({
            icon: 'error',
            title: 'Archivo muy grande',
            text: 'La imagen no debe superar los 2MB.',
        });
        return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    // Configuración actualizada con el preset del usuario: PaisaSoft
    data.append("upload_preset", "PaisaSoft"); 

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/dgj2ol5r1/image/upload", {
            method: "POST",
            body: data
        });
        
        const fileData = await response.json();

        if (!response.ok) {
            throw new Error(fileData.error?.message || "Error al subir imagen a Cloudinary");
        }

        setFormData(prev => ({ ...prev, imageUrl: fileData.secure_url }));
    } catch (error: any) {
        console.error("Error uploading image:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de subida',
            text: `Cloudinary: ${error.message}`,
            footer: 'Verifica que el preset "PaisaSoft" esté configurado como Unsigned.'
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove empty date string to keep it undefined if not set
    const submissionData = { ...formData };
    if (submissionData.fecha_vencimiento === '') {
        delete (submissionData as any).fecha_vencimiento;
    }

    if (productToEdit) {
      onSave({ ...productToEdit, ...submissionData });
    } else {
      onSave(submissionData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">{productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre_producto" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
              <input type="text" name="nombre_producto" id="nombre_producto" value={formData.nombre_producto} onChange={handleChange} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" required />
            </div>
             <div>
              <label htmlFor="codigo_interno" className="block text-sm font-medium text-slate-700 mb-1">Código Interno</label>
              <input type="text" name="codigo_interno" id="codigo_interno" value={formData.codigo_interno} onChange={handleChange} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" required />
            </div>
             <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select 
                name="categoria" 
                id="categoria" 
                value={formData.categoria} 
                onChange={handleChange} 
                className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" 
                required
              >
                <option value="" disabled>Seleccionar Categoría</option>
                {GROCERY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 bg-slate-50 p-3 rounded-md border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">Imagen del Producto</label>
              <div className="flex items-center space-x-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-300 bg-white flex items-center justify-center">
                    {isUploading ? (
                        <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="h-full w-full object-cover" 
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Sin+Imagen')} 
                        />
                    )}
                </div>
                <div className="flex-1">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-red-100 file:text-red-700
                            hover:file:bg-red-200
                            cursor-pointer
                        "
                    />
                    <p className="text-xs text-slate-500 mt-1 ml-1">Sube una imagen (Máx 2MB).</p>
                    {/* Hidden or ReadOnly input to maintain form compatibility and debug */}
                    <input type="text" name="imageUrl" value={formData.imageUrl} readOnly className="hidden" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 bg-white text-slate-900"></textarea>
            </div>
            <div>
              <label htmlFor="precio_venta" className="block text-sm font-medium text-slate-700 mb-1">Precio (S/.)</label>
              <input type="number" name="precio_venta" id="precio_venta" value={formData.precio_venta} onChange={handleChange} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" step="0.01" min="0" required />
            </div>
             <div>
              <label htmlFor="stock_actual" className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input type="number" name="stock_actual" id="stock_actual" value={formData.stock_actual} onChange={handleChange} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" min="0" required/>
            </div>
            <div>
              <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
              <input type="date" name="fecha_vencimiento" id="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange} className="block w-full rounded-md border-slate-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-3 bg-white text-slate-900" />
            </div>
          </div>

          <div className="flex justify-end items-center p-4 border-t flex-shrink-0 space-x-2 bg-red-50 rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300 font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={isUploading} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium disabled:bg-red-400">
              {isUploading ? 'Subiendo...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
