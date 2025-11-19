
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

// IMPORTANT: For this to work, the Google Sheet must be public ("Anyone with the link can view").
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1rozeHODV_hj8ndzJAs_qb5prCSsuK_0rGayItEuKAYE/export?format=csv&gid=0"; // gid=0 corresponds to the "Products" tab

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const productSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER },
        codigo_interno: { type: Type.STRING },
        nombre_producto: { type: Type.STRING },
        descripcion: { type: Type.STRING },
        precio_venta: { type: Type.NUMBER },
        stock_actual: { type: Type.NUMBER },
        categoria: { type: Type.STRING },
        imageUrl: { type: Type.STRING },
        fecha_vencimiento: { type: Type.STRING, nullable: true },
      },
      required: ["id", "codigo_interno", "nombre_producto", "descripcion", "precio_venta", "stock_actual", "categoria", "imageUrl"]
    }
};

export const fetchProductsFromSource = async (): Promise<Product[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Read the data from this public Google Sheet CSV URL: ${GOOGLE_SHEET_URL}. This sheet contains grocery products for a store in Peru. Convert the CSV data into a valid JSON array that strictly follows the provided schema. The CSV headers are id, codigo_interno, nombre_producto, descripcion, precio_venta, stock_actual, categoria, imageUrl. Ensure that 'id', 'precio_venta', and 'stock_actual' are parsed as numbers. IMPORTANT: The imageUrl column in the CSV contains placeholder URLs. You MUST replace each placeholder URL with a realistic, publicly accessible image URL that visually represents the product described in 'nombre_producto'. Use high-quality product images.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: productSchema
      }
    });
    const products = JSON.parse(response.text);
    return products as Product[];
  } catch (error) {
    console.error("Error fetching products from Google Sheet via Gemini:", error);
    throw new Error("Failed to load products from the Google Sheet. Please ensure it's public and the URL is correct.");
  }
};
