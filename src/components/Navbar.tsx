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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Navbar = ({ onNavigate, currentPage, collapsed = false, onToggleCollapse }: NavbarProps) => {
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'My Agents', id: 'agents' },
    { name: 'Analytics', id: 'analytics' },
    { name: 'Integrations', id: 'integrations' },
  ];

  return (
    <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
      collapsed ? 'h-12' : 'h-16'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          collapsed ? 'h-12' : 'h-16'
        }`}>
          {/* Logo and Collapse Toggle */}
          <div className="flex items-center gap-2">
            {onToggleCollapse && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
              >
                {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              {!collapsed && <span className="text-xl font-bold">ChatBase</span>}
            </div>
          </div>

          {/* Navigation */}
          {!collapsed && (
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
          )}

          {/* User menu */}
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

      {/* Mobile navigation */}
      {!collapsed && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            {navigation.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                onClick={() => onNavigate(item.id)}
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