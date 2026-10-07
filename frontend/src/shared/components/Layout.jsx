import { Outlet, ScrollRestoration } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { KioscoProvider } from '../kiosco/KioscoContext';
import { PortadaProvider } from '../portada/PortadaContext';

export default function Layout() {
  return (
    <KioscoProvider>
      <PortadaProvider>
        <div className="flex min-h-screen flex-col bg-white">
          <SiteHeader />
          <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <ScrollRestoration />
      </PortadaProvider>
    </KioscoProvider>
  );
}
