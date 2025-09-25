import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  showFooter?: boolean;
}

export const Layout = ({ showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full pt-20">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      <Toaster
        position="top-right"
        containerStyle={{ top: '88px' }}
        gutter={8}
      />
    </div>
  );
};