import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div>
      {/* Auth layout for login/signup pages */}
      {children}
    </div>
  );
};

export default AuthLayout;

