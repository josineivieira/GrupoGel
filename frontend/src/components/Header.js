import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { useCity } from '../contexts/CityContext';
import { FaSignOutAlt, FaUser, FaBars, FaHome, FaTimes } from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  // Fecha menu ao trocar de rota
  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fecha com ESC
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 text-white shadow-lg bg-gradient-to-r from-purple-700 via-purple-600 to-emerald-600/90 backdrop-blur">
      {/* Top bar (mais compacto no mobile) */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Logo + Nome */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 hover:opacity-90 transition"
          aria-label="Ir para início"
        >
          <img
            src="/images/geotransporteslogo.svg"
            alt="GeoTransportes Logo"
            className="h-8 sm:h-10 w-auto shrink-0"
            onError={(e) => { e.target.onerror = null; e.target.src = '/images/GeoTransportesLogo.svg'; }}
          />

          <div className="leading-tight text-left">
            <div className="text-base sm:text-lg font-extrabold tracking-tight">
              GeoTransportes
            </div>
            <div className="text-[11px] sm:text-sm text-white/80">
              Logística Rodoviária
            </div>
          </div>
        </button>

        {/* Ações */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chip do usuário só no desktop */}
          <div className="hidden sm:flex items-center gap-2 text-sm bg-white/10 border border-white/15 px-4 py-2 rounded-full">
            <FaUser className="text-white/80" />
            <span className="font-medium">{user?.name}</span>
          </div>

          {/* City chip removed: selection happens at login. */}

          {/* Botão menu (clean, sem ficar grandão) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="h-10 w-10 grid place-items-center rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 active:scale-95 transition"
            aria-label="Abrir menu"
          >
            <FaBars className="text-lg" />
          </button>
        </div>
      </div>

      {/* Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* overlay */}
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
          />

          {/* painel */}
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-white text-gray-900 shadow-2xl border-l border-gray-200">
            <div className="px-4 py-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <FaUser className="text-gray-600" />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{user?.name || 'Usuário'}</div>
                  <div className="text-xs text-gray-500">Menu</div>
                </div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <button
  onClick={() => navigate('/home')}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
             bg-gray-50 hover:bg-gray-100
             border border-gray-200
             transition text-left font-semibold"
>
  <FaHome className="text-emerald-600" />
  Início
</button>

              <button
                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                           bg-gray-50 hover:bg-gray-100
                           border border-gray-200
                           transition text-left font-semibold"
              >
                <FaUser className="text-purple-600" />
                Ajustes
              </button>

            </div>

            <div className="px-4 py-4 text-xs text-gray-500 border-t">
              Dica: aperte <span className="font-semibold">Esc</span> para fechar.
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// CityChip removed: selection now happens on login. Kept function removed to avoid rendering.

export default Header;
