import { Outlet, ScrollRestoration } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { KioscoProvider } from '../kiosco/KioscoContext';

export default function Layout() {
  return (
    <KioscoProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <ScrollRestoration />
    </KioscoProvider>
  );
}
