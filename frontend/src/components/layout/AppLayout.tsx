import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './NavBar';
import Footer from './Footer';

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header />
      <Navbar />

      <main className="w-full flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default AppLayout;

