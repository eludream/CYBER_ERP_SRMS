import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import AppFooter from "@/components/AppFooter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {mobileMenuOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-black/45 md:hidden" onClick={() => setMobileMenuOpen(false)}/>} 
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed left-3 top-2 z-50 md:hidden">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-sm" aria-label="Open navigation menu" onClick={() => setMobileMenuOpen(true)}><Menu className="h-4 w-4"/></Button>
        </div>
        <AppHeader />
        <div className="px-6 pt-4 pb-0 hidden md:block">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
