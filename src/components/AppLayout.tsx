import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const AppLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;