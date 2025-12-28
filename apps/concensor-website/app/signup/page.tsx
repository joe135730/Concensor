import BackgroundImage from '@/components/common/BackgroundImage';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SignUpForm from '@/components/auth/SignUpForm';
import './page.css';

export default function SignUpPage() {
  return (
    <BackgroundImage>
      <div className="signup-page">
        <Header />
        <div className="signup-page-content">
          <SignUpForm />
        </div>
        <Footer />
      </div>
    </BackgroundImage>
  );
}
