import React from 'react';
import Header from './Header';

const AppLayout = ({ children }) => {
  return (
    <div className="h-[100svh] w-full overflow-hidden bg-[#f7f7fb]">
      <Header />

      {/* Só aqui rola (sem bounce do body) */}
      <main className="h-[calc(100svh-56px)] overflow-y-auto overscroll-none">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
