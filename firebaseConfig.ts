
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider } from "firebase/auth";

// Configuración de Firebase para PaisaSoft
const firebaseConfig = {
  apiKey: "AIzaSyCoF6gKne84FKspnNIRvA1vv-a8w3IYIWs",
  authDomain: "paisasoft-3d1dd.firebaseapp.com",
  projectId: "paisasoft-3d1dd",
  storageBucket: "paisasoft-3d1dd.firebasestorage.app",
  messagingSenderId: "662341703488",
  appId: "1:662341703488:web:53f91b936f48704b634ca5",
  measurementId: "G-CKFL3W9269"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Proveedores de autenticación
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export { auth, googleProvider, facebookProvider, twitterProvider };
