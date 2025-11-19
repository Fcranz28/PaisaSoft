
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, categories, selectedCategory, onSelectCategory }) => {
  const sidebarClasses = `fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-gray-100`;
  const overlayClasses = `fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

  return (
    <>
      <div className={overlayClasses} onClick={onClose} aria-hidden="true"></div>
      <aside className={sidebarClasses}>
        <div className="p-8 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-black">Categorías</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        <nav className="px-8 overflow-y-auto h-[calc(100%-100px)]">
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => onSelectCategory(null)}
                className={`text-lg transition-colors ${!selectedCategory ? 'text-black font-medium underline underline-offset-4' : 'text-gray-500 hover:text-black'}`}
              >
                Todas
              </button>
            </li>
            {categories.map(category => (
              <li key={category}>
                <button
                  onClick={() => onSelectCategory(category)}
                  className={`text-lg text-left transition-colors ${selectedCategory === category ? 'text-black font-medium underline underline-offset-4' : 'text-gray-500 hover:text-black'}`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
