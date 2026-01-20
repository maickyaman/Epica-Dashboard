import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard, Receipt, Users, Layers, LogOut, Cloud, CloudOff, TrendingUp
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
  isSyncing?: boolean;
}

export function AppSidebar({ isSyncing = false }: AppSidebarProps) {
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
        <div className="flex items-center gap-2 px-2 mb-4">
          {isSyncing ? (
            <Cloud className="h-4 w-4 text-blue-500 animate-pulse" />
          ) : (
            <CloudOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {isSyncing ? 'Sincronizzazione...' : 'Dati Salvati'}
          </span>
        </div>
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
