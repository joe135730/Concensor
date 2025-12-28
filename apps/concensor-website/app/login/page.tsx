import BackgroundImage from '@/components/common/BackgroundImage';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LoginForm from '@/components/auth/LoginForm';
import './page.css';

export default function LoginPage() {
  return (
    <BackgroundImage>
      <div className="login-page">
        <Header />
        <div className="login-page-content">
          <LoginForm />
        </div>
        <Footer />
      </div>
    </BackgroundImage>
  );
}

