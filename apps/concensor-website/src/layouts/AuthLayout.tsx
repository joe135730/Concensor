import { ReactNode } from 'react';
import Header from '../components/common/Header';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout - For authenticated pages (after login)
 * 
 * Includes Header (with username and profile icon) but NO Footer
 * Use this for: /home, /profile, and other authenticated pages
 */
const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div>
      <Header />
      {children}
      {/* No Footer - authenticated pages don't have footer */}
    </div>
  );
};

export default AuthLayout;

