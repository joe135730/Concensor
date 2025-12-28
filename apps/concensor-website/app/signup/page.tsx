import BackgroundImage from '@/components/common/BackgroundImage';
import MainLayout from '@/layouts/MainLayout';
import SignUpForm from '@/components/auth/SignUpForm';
import './page.css';

export default function SignUpPage() {
  return (
    <BackgroundImage>
      <MainLayout>
        <div className="signup-page">
          <div className="signup-page-content">
            <SignUpForm />
          </div>
        </div>
      </MainLayout>
    </BackgroundImage>
  );
}
