import { BrowserRouter, Routes, Route } from 'react-router-dom';

import NotFound from '@pages/not-found';
import SignIn from '@pages/sign-in';
import SignUp from '@pages/sign-up';
import { Navbar } from '@components/Navbar/Navbar';
import { Container } from '@components/Container/Container';
import Home from '@pages/home';
import About from '@pages/about';

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
