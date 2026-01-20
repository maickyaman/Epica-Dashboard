import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard, Receipt, Users, Layers, LogOut, TrendingUp, User
} from 'lucide-react';
import { auth, signOut } from '@/lib/firebase';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bilancio', icon: Receipt, label: 'Bilancio' },
  { to: '/iscritti', icon: Users, label: 'Iscritti' },
  { to: '/edizioni', icon: Layers, label: 'Edizioni' },
];

interface AppSidebarProps {
  userEmail?: string | null;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <TrendingUp className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Epica Cloud</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                  >
                    <NavLink to={item.to}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userEmail && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{userEmail}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Esci</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
