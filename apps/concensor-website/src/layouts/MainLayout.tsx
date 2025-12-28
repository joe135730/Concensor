import { ReactNode } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout - For unauthenticated pages (before login)
 * 
 * Includes Header + Footer (full navigation)
 * Use this for: / (landing), /login, /signup
 */
const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default MainLayout;

