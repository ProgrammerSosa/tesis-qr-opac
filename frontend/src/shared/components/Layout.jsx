import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
