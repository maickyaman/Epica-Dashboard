import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Transaction, Edition } from '@/types';
import { TransactionType, SourceType } from '@/types';
import { STAFF_MEMBERS } from '@/lib/constants';

interface TransactionsPageProps {
  transactions: Transaction[];
  editions: Edition[];
  currentEditionId: string;
  onAdd: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionsPage({
  transactions,
  editions,
  currentEditionId,
  onAdd,
  onDelete,
}: TransactionsPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: TransactionType.INCOME,
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    const editionId = currentEditionId === 'all'
      ? (editions[0]?.id || '')
      : currentEditionId;

    await onAdd({
      ...form,
      amount: parseFloat(form.amount),
      source: SourceType.CASH,
      person: STAFF_MEMBERS[0],
      editionId,
    });

    setForm({ ...form, description: '', amount: '' });
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare questo movimento?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro Movimenti</h1>
          <p className="text-muted-foreground">Gestisci entrate e uscite dell'evento.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Movimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuovo Movimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrizione del movimento"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Importo</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>Entrata</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Uscita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Salva Movimento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimenti</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessun movimento registrato
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        t.type === TransactionType.INCOME
                          ? 'text-primary'
                          : 'text-destructive'
                      }`}
                    >
                      {t.type === TransactionType.INCOME ? '+' : '-'} €{' '}
                      {t.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
