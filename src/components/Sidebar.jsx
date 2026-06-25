'use client';



import { useState } from 'react';
import { useNavigate, useLocation } from '@/lib/nav';
import {
  FiHome, FiInfo, FiPhone, FiBriefcase, FiFileText,
  FiChevronDown, FiChevronRight, FiLayout, FiMenu, FiX,
  FiLink, FiCompass, FiSearch, FiUsers, FiCreditCard,
  FiShield, FiTrendingUp, FiSettings,
} from 'react-icons/fi';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: FiLayout,
    showInSidebar: true,
  },
  {
    id: 'pages-content',
    label: 'Pages & Content',
    icon: FiFileText,
    showInSidebar: true,
    children: [
      { id: 'home',         label: 'Home',         path: '/home',         icon: FiHome    },
      { id: 'about',        label: 'About',        path: '/about',        icon: FiInfo    },
      { id: 'blogpage',     label: 'Blog Page',    path: '/blogpage',     icon: FiFileText },
      { id: 'package-page', label: 'Package Page', path: '/package-page', icon: FiCompass },
    ],
  },
  { id: 'packages',   label: 'Packages',   path: '/packages',   icon: FiCompass,    showInSidebar: true },
  { id: 'offers',     label: 'Offers',     path: '/offers',     icon: FiTrendingUp, showInSidebar: true },
  { id: 'blog',       label: 'Blog',       path: '/blog',       icon: FiFileText,   showInSidebar: true },
  { id: 'authors',    label: 'Authors',    path: '/authors',    icon: FiUsers,      showInSidebar: true },
  { id: 'comments',   label: 'Comments',   path: '/comments',   icon: FiUsers,      showInSidebar: true },
  { id: 'newsletter', label: 'Newsletter', path: '/newsletter', icon: FiLink,       showInSidebar: true },
  {
    id: 'seo-handling',
    label: 'SEO Handling',
    path: '/seo-handling',
    icon: FiSearch,
    showInSidebar: true,
  },
];

/* ─── helpers ─── */
const isPathActive = (itemPath, currentPath) => {
  if (!itemPath) return false;
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
};

const hasActiveChild = (children = [], currentPath) =>
  children.some(child => {
    if (isPathActive(child.path, currentPath)) return true;
    if (child.children) return hasActiveChild(child.children, currentPath);
    return false;
  });

const getInitialOpen = (items, path) => {
  const open = {};
  const walk = (list) => {
    list.forEach(item => {
      if (item.children) {
        if (hasActiveChild(item.children, path)) open[item.id] = true;
        walk(item.children);
      }
    });
  };
  walk(items);
  return open;
};

/* ══════════════════════════════
   SIDEBAR COMPONENT
══════════════════════════════ */
export default function Sidebar({ config = {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(() =>
    getInitialOpen(menuItems, location.pathname)
  );

  const toggleMenu = (id) => setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  const closeMobile = () => setIsMobileOpen(false);

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children?.length > 0;
    const isOpen = openMenus[item.id] || hasActiveChild(item.children || [], location.pathname);
    const active = isPathActive(item.path, location.pathname) ||
                  hasActiveChild(item.children || [], location.pathname);
    const Icon = item.icon;
    
    // Fix indentation - use consistent approach with first sidebar
    const indent = level === 1 ? 'pl-4' : level === 2 ? 'pl-8' : 'pl-0';

    return (
      <div key={item.id} className="w-full">
        <div
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else if (item.path) {
              navigate(item.path);
              if (window.innerWidth < 1024) closeMobile();
            }
          }}
          className={`
            group flex items-center justify-between gap-3
            px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            ${indent}
            ${active
              ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <Icon
                size={20}
                className={`flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}
              />
            )}
            <span className="truncate text-[15px]">
              {item.label}
            </span>
          </div>

          {hasChildren && (
            isOpen
              ? <FiChevronDown size={14} className="text-slate-400 flex-shrink-0" />
              : <FiChevronRight size={14} className="text-slate-400 flex-shrink-0" />
          )}
        </div>

        {hasChildren && isOpen && (
          <div className="mt-0.5 mb-1 space-y-0.5">
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const NavContent = () => (
    <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1 no-scrollbar">
      {menuItems
        .filter(item => item.showInSidebar !== false)
        .map(item => renderItem(item))}
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:border-r lg:border-slate-200 bg-white fixed top-0 left-0 z-30">
        <div className="p-5 border-b border-slate-100 flex-shrink-0">
          <span className="text-[22px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            TravelBudgetly
          </span>
        </div>
        <NavContent />
      </aside>

      {/* ── Mobile Hamburger ── */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md text-slate-700 hover:bg-slate-100 transition"
        aria-label="Open menu"
      >
        <FiMenu size={24} />
      </button>

      {/* ── Mobile Drawer ── */}
      <div
        className={`fixed lg:hidden inset-0 z-40 transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop with blur effect */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={closeMobile} 
        />
        
        {/* Sidebar drawer */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <span className="text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              TravelBudgetly
            </span>
            <button 
              onClick={closeMobile} 
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <FiX size={22} />
            </button>
          </div>
          <NavContent />
        </aside>
      </div>
    </>
  );
}