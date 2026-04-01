import { BrowserRouter, Routes, Route } from 'react-router-dom';

import NotFound from '@pages/not-found';
import SignIn from '@pages/sign-in';
import SignUp from '@pages/sign-up';

import { Container } from '@components/Container/Container';
import Home from '@pages/home';
import About from '@pages/about';
import Profile from '@pages/profile';
import { Sidebar } from '@components/Sidebar/Sidebar';
import { ROUTES } from '@utils/routes';
import { AuthProvider } from '@context/AuthContext';
import PendingUsers from '@pages/pending-users';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Sidebar />
          <main className="main-content">
            <Container>
              <Routes>
                <Route path={ROUTES.MAIN} element={<Home />} />
                <Route path={ROUTES.ABOUT} element={<About />} />
                <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
                <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.PENDING_USERS} element={<PendingUsers />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Container>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
