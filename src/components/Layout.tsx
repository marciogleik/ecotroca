import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  History, 
  BarChart3, 
  TrendingUp,
  FileText,
  UserPlus,
  School,
  Store,
  Link2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const roleConfigs = {
  escola: {
    title: 'Escola',
    color: 'bg-escola',
    hoverColor: 'hover:bg-escola-dark',
    lightColor: 'bg-escola-light',
    textColor: 'text-escola',
    nav: [
      { label: 'Início', href: '/escola', icon: LayoutDashboard },
      { label: 'Alunos', href: '/escola/alunos', icon: Users },
      { label: 'Novo Aluno', href: '/escola/novo-aluno', icon: UserPlus },
      { label: 'Registrar Entrega', href: '/escola/entrega', icon: PlusCircle },
      { label: 'Relatórios', href: '/escola/relatorios', icon: FileText },
    ]
  },
  sicredi: {
    title: 'Sicredi',
    color: 'bg-sicredi',
    hoverColor: 'hover:bg-sicredi-dark',
    lightColor: 'bg-sicredi-light',
    textColor: 'text-sicredi',
    nav: [
      { label: 'Início', href: '/sicredi', icon: LayoutDashboard },
      { label: 'Comerciantes', href: '/sicredi/comerciantes', icon: Users },
      { label: 'Resgate de Tokens', href: '/sicredi/resgate', icon: PlusCircle },
      { label: 'Histórico', href: '/sicredi/historico', icon: History },
    ]
  },
  prefeitura: {
    title: 'Prefeitura',
    color: 'bg-prefeitura',
    hoverColor: 'hover:bg-prefeitura-dark',
    lightColor: 'bg-prefeitura-light',
    textColor: 'text-prefeitura',
    nav: [
      { label: 'Painel Geral', href: '/prefeitura', icon: BarChart3 },
      { label: 'Gestão de Escolas', href: '/prefeitura/escolas', icon: School },
      { label: 'Alunos', href: '/prefeitura/alunos', icon: Users },
      { label: 'Comerciantes', href: '/prefeitura/comerciantes', icon: Store },
      { label: 'Impacto Ambiental', href: '/prefeitura/impacto', icon: TrendingUp },
      { label: 'Relatórios', href: '/prefeitura/relatorios', icon: FileText },
      { label: 'Convites de Acesso', href: '/prefeitura/convites', icon: Link2 },
    ]
  }
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!role) return null;

  const config = roleConfigs[role];
  const navItems = config.nav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition duration-300 ease-in-out lg:relative lg:translate-x-0 bg-white border-r border-gray-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn("flex items-center justify-between px-6 py-5", config.color)}>
            <div className="flex items-center">
              <img 
                src="/logo-prefeitura.png" 
                alt="Logo da Prefeitura de Água Boa" 
                className="w-full max-w-[180px] h-auto object-contain rounded-md" 
              />
            </div>
            <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                    isActive 
                      ? cn(config.lightColor, config.textColor)
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isActive ? config.textColor : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer / User Profile */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            {/* Hub Logo */}
            <div className="mb-4 pb-4 border-b border-gray-200 flex flex-col items-center justify-center">
              <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Desenvolvido por</p>
              <img 
                src="/logo-hub.png" 
                alt="Logo do Hub de Inovação Água Boa - MT" 
                className="w-[70px] object-contain rounded"
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center px-2 mb-4">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm", config.color)}>
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
              </div>
            </div>

            {/* Sign Out */}
            <button 
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <img 
            src="/logo-prefeitura.png" 
            alt="Brasão da Prefeitura de Água Boa" 
            className="h-[32px] w-auto max-w-[200px] object-contain shrink-0"
            onError={(e) => {
              // Fallback se a imagem do brasão isolado não existir
              (e.target as HTMLImageElement).src = "/logo-prefeitura.png";
            }}
          />
          <div className="w-6"></div> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
