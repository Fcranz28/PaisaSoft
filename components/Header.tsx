
import React, { useState } from 'react';
import { User } from '../types';

declare var Swal: any;

interface HeaderProps {
  isAdminView?: boolean;
  onLogout?: () => void;
  currentUser?: User | null;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onNavigateToProfile?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onMenuClick?: () => void;
}

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ isAdminView = false, onLogout, currentUser, onLoginClick, onRegisterClick, onNavigateToProfile, onCartClick, cartCount = 0, searchTerm, onSearchChange, onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('navigateHome'));
  };

  const UserMenu = () => (
    <div className="relative group">
      <button 
        onClick={() => setIsDropdownOpen(prev => !prev)} 
        className="flex items-center space-x-1 py-2 text-sm font-medium text-black hover:opacity-70 transition-opacity"
      >
        <span className="hidden sm:inline tracking-wide">{currentUser?.firstName}</span>
         <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl z-50 animate-fade-in">
          <button onClick={() => { onNavigateToProfile?.(); setIsDropdownOpen(false); }} className="w-full text-left block px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">Mi Cuenta</button>
          <button onClick={() => { onLogout?.(); setIsDropdownOpen(false); }} className="w-full text-left block px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">Cerrar Sesión</button>
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-6">
            {!isAdminView && (
               <button 
                onClick={onMenuClick}
                className="p-1 text-black hover:opacity-60 transition-opacity focus:outline-none"
                aria-label="Menu"
               >
                 <MenuIcon />
               </button>
            )}
            <div className="flex-shrink-0">
              <a href="#" onClick={handleLogoClick} aria-label="PaisaSoft Inicio" className="text-2xl font-serif font-bold tracking-tighter text-black">
                PAISASOFT.
              </a>
            </div>
          </div>

          {/* Center: Search Bar (Desktop) */}
          {!isAdminView && (
            <div className="hidden md:flex flex-1 justify-center px-8">
               <div className="w-full max-w-lg relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <SearchIcon />
                 </div>
                 <input
                   id="search"
                   name="search"
                   className="block w-full pl-10 pr-3 py-2 border-b border-gray-200 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors sm:text-sm font-light"
                   placeholder="Buscar productos..."
                   type="search"
                   value={searchTerm}
                   onChange={(e) => onSearchChange?.(e.target.value)}
                 />
               </div>
             </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-6">
            {isAdminView ? (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-black border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <LogoutIcon />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <>
                 {/* Search Icon Mobile */}
                 <button className="md:hidden text-black p-1">
                    <SearchIcon />
                 </button>

                {currentUser ? (
                    <UserMenu />
                ) : (
                  <div className="flex items-center space-x-4 text-sm font-medium">
                      <button onClick={onLoginClick} className="text-black hover:opacity-60 transition-opacity">
                          Ingresar
                      </button>
                      <button onClick={onRegisterClick} className="hidden sm:block bg-black text-white px-5 py-2 hover:bg-gray-800 transition-colors">
                          Registrarse
                      </button>
                  </div>
                )}

                <button
                  onClick={onCartClick}
                  className="relative p-1 text-black hover:opacity-60 transition-opacity"
                  aria-label="Carrito"
                >
                  <CartIcon />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
