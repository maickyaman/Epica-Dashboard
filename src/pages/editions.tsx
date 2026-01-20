import { useState } from 'react';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Edition } from '@/types';

interface EditionsPageProps {
  editions: Edition[];
  isDialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onAdd: (edition: Edition) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditionsPage({
  editions,
  isDialogOpen,
  onOpenDialog,
  onCloseDialog,
  onAdd,
  onDelete,
}: EditionsPageProps) {
  const [year, setYear] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !name) return;

    await onAdd({ id: year, year, name });
    setYear('');
    setName('');
    onCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare questa edizione?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventi Registrati</h1>
          <p className="text-muted-foreground">Gestisci le edizioni dell'evento.</p>
        </div>
        <Button onClick={onOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Edizione
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Edizione</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Anno</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="es: 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Edizione</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es: Epica Camonica 2026"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={onCloseDialog}>
                Annulla
              </Button>
              <Button type="submit" className="flex-1">
                Crea
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {editions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessuna edizione registrata</p>
            <Button onClick={onOpenDialog}>Crea Prima Edizione</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((e) => (
            <Card key={e.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                    {e.year}
                  </p>
                  <h3 className="text-xl font-bold">{e.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
