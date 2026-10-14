import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './NavBar';
import Footer from './Footer';

function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo</a>
      <Header />
      <Navbar />

      <main id="conteudo-principal" className="w-full flex-grow" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default AppLayout;

