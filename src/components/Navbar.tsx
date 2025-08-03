import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, User, LogOut, Settings, Menu, X } from "lucide-react";

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar = ({ onNavigate, currentPage }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'My Agents', id: 'agents' },
    { name: 'Analytics', id: 'analytics' },
    { name: 'Integrations', id: 'integrations' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section: Hamburger + Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ChatBase</span>
            </div>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className="text-sm"
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Right section: User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation (now toggleable) */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            {navigation.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
