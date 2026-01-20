import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Zap, Bus, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Participant, Edition } from '@/types';

const BUS_ROUTES = [
  { value: 'pisogne - ponte di legno', label: 'Pisogne - Ponte di Legno' },
  { value: 'esine - ponte di legno', label: 'Esine - Ponte di Legno' },
  { value: 'rogno - ponte di legno', label: 'Rogno - Ponte di Legno' },
  { value: 'pisogne - ponte di legno SABATO SERA', label: 'Pisogne - Ponte di Legno (Sabato Sera)' },
  { value: 'pisogne - ponte di legno DOMENICA SERA', label: 'Pisogne - Ponte di Legno (Domenica Sera)' },
  { value: 'nessuna', label: 'Nessuna tratta bus' },
] as const;

interface ParticipantFormData {
  nome: string;
  cognome: string;
  citta: string;
  cellulare: string;
  taglia: string;
  tappaPullman: string;
  pranzo: boolean;
  notteHotel: boolean;
  ebike: boolean;
  pagato: number;
  note: string;
}

const defaultFormData: ParticipantFormData = {
  nome: '',
  cognome: '',
  citta: '',
  cellulare: '',
  taglia: 'M',
  tappaPullman: 'nessuna',
  pranzo: false,
  notteHotel: false,
  ebike: false,
  pagato: 0,
  note: '',
};

// Parse CSV and map to Participant data
function parseCSV(csvText: string): Omit<Participant, 'id' | 'editionId'>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    // Handle CSV with potential commas in quoted fields
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());

    // Map columns: Gruppo, Quota, Nome, Cognome, Città, Cellulare, extra1 (taglia), extra2 (pickup)
    const [gruppo = '', quota = '', nome = '', cognome = '', citta = '', cellulare = '', taglia = 'M', pickup = ''] = columns;

    // Determine bus route based on gruppo and pickup
    let tappaPullman = 'nessuna';
    const gruppoLower = gruppo.toLowerCase();
    const pickupLower = pickup.toLowerCase();

    if (gruppoLower.includes('domenica sera') || gruppoLower.includes('domenica ritorno')) {
      tappaPullman = 'pisogne - ponte di legno DOMENICA SERA';
    } else if (gruppoLower.includes('sabato sera') || gruppoLower.includes('sabato ritorno')) {
      tappaPullman = 'pisogne - ponte di legno SABATO SERA';
    } else if (gruppoLower.includes('bus') || gruppoLower.includes('pullman')) {
      if (pickupLower.includes('esine')) {
        tappaPullman = 'esine - ponte di legno';
      } else if (pickupLower.includes('rogno') || quota.toLowerCase().includes('rogno')) {
        tappaPullman = 'rogno - ponte di legno';
      } else {
        tappaPullman = 'pisogne - ponte di legno';
      }
    }

    // Check if pranzo is included
    const pranzo = quota.toLowerCase().includes('pranzo');

    return {
      nome: nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase(),
      cognome: cognome.charAt(0).toUpperCase() + cognome.slice(1).toLowerCase(),
      citta,
      cellulare,
      quota,
      taglia: taglia.toUpperCase() || 'M',
      pickup,
      tappaPullman,
      pranzo,
      notteHotel: false,
      ebike: false,
      note: '',
      pagato: 0,
    };
  }).filter(p => p.nome && p.cognome);
}

interface ParticipantsPageProps {
  participants: Participant[];
  editions: Edition[];
  currentEditionId: string;
  onAdd: (participant: Omit<Participant, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Participant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ParticipantsPage({
  participants,
  editions,
  currentEditionId,
  onAdd,
  onUpdate,
  onDelete,
}: ParticipantsPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantFormData>(defaultFormData);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        alert('Nessun dato valido trovato nel file CSV');
        return;
      }

      const editionId = currentEditionId === 'all'
        ? (editions[0]?.id || '')
        : currentEditionId;

      // Import all participants
      for (const participant of parsedData) {
        await onAdd({
          ...participant,
          editionId,
        });
      }

      alert(`Importati ${parsedData.length} iscritti con successo!`);
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      alert('Errore durante l\'importazione del file CSV');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(defaultFormData);
    setIsOpen(true);
  };

  const openEdit = (p: Participant) => {
    setEditingId(p.id);
    setForm({
      nome: p.nome,
      cognome: p.cognome,
      citta: p.citta,
      cellulare: p.cellulare,
      taglia: p.taglia,
      tappaPullman: p.tappaPullman,
      pranzo: p.pranzo,
      notteHotel: p.notteHotel,
      ebike: p.ebike,
      pagato: p.pagato,
      note: p.note,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cognome) return;

    const editionId = currentEditionId === 'all'
      ? (editions[0]?.id || '')
      : currentEditionId;

    if (editingId) {
      await onUpdate(editingId, form);
    } else {
      await onAdd({
        ...form,
        editionId,
        quota: '',
        pickup: '',
      });
    }

    setIsOpen(false);
    setForm(defaultFormData);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare questo iscritto?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anagrafica Iscritti</h1>
          <p className="text-muted-foreground">Gestisci i partecipanti dell'evento.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCSVImport}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importando...' : 'Importa CSV'}
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Iscritto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifica Iscritto' : 'Nuovo Iscritto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognome">Cognome</Label>
                  <Input
                    id="cognome"
                    value={form.cognome}
                    onChange={(e) => setForm({ ...form, cognome: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ebike"
                    checked={form.ebike}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, ebike: checked === true })
                    }
                  />
                  <Label htmlFor="ebike" className="text-sm font-bold cursor-pointer">
                    E-BIKE
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pranzo"
                    checked={form.pranzo}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, pranzo: checked === true })
                    }
                  />
                  <Label htmlFor="pranzo" className="text-sm font-bold cursor-pointer">
                    PRANZO
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notteHotel"
                    checked={form.notteHotel}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, notteHotel: checked === true })
                    }
                  />
                  <Label htmlFor="notteHotel" className="text-sm font-bold cursor-pointer">
                    HOTEL
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tappaPullman">Tratta Bus</Label>
                <Select
                  value={form.tappaPullman}
                  onValueChange={(value) => setForm({ ...form, tappaPullman: value })}
                >
                  <SelectTrigger id="tappaPullman">
                    <SelectValue placeholder="Seleziona tratta bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUS_ROUTES.map((route) => (
                      <SelectItem key={route.value} value={route.value}>
                        {route.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pagato">Importo Pagato (€)</Label>
                <Input
                  id="pagato"
                  type="number"
                  step="0.01"
                  value={form.pagato}
                  onChange={(e) => setForm({ ...form, pagato: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Button type="submit" className="w-full">
                Salva nel Cloud
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessun iscritto registrato</p>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Iscritto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((p) => (
            <Card key={p.id} className="group relative hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                      {p.nome[0]}{p.cognome[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEdit(p)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-bold text-lg">
                  {p.nome} {p.cognome}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {p.citta || 'Città non specificata'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {p.ebike && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                      <Zap className="mr-1 h-3 w-3" />
                      E-BIKE
                    </Badge>
                  )}
                  {p.pranzo && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                      PRANZO
                    </Badge>
                  )}
                  {p.notteHotel && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      HOTEL
                    </Badge>
                  )}
                  {p.tappaPullman && p.tappaPullman !== 'nessuna' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      <Bus className="mr-1 h-3 w-3" />
                      {BUS_ROUTES.find(r => r.value === p.tappaPullman)?.label || p.tappaPullman}
                    </Badge>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-bold text-primary">
                    PAGATO: € {p.pagato.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
