import { Outlet } from 'react-router';
import { Calendar, Plus } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Edition } from '@/types';

interface AppLayoutProps {
  editions: Edition[];
  selectedEditionId: string;
  onEditionChange: (id: string) => void;
  onAddEdition: () => void;
  userEmail?: string | null;
}

export function AppLayout({
  editions,
  selectedEditionId,
  onEditionChange,
  onAddEdition,
  userEmail,
}: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedEditionId} onValueChange={onEditionChange}>
                <SelectTrigger className="w-[200px] border-0 bg-transparent font-semibold">
                  <SelectValue placeholder="Seleziona edizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Riepilogo Storico</SelectItem>
                  {editions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onAddEdition}>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Edizione
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
