import BackgroundImage from '@/components/common/BackgroundImage';
import MainLayout from '@/layouts/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import './page.css';

export default function LoginPage() {
  return (
    <BackgroundImage>
      <MainLayout>
        <div className="login-page">
          <div className="login-page-content">
            <LoginForm />
          </div>
        </div>
      </MainLayout>
    </BackgroundImage>
  );
}

