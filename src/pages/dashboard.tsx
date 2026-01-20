import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Users, Zap, FileSpreadsheet
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ai } from '@/lib/firebase';
import type { Stats, Transaction } from '@/types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  currency?: boolean;
}

function StatCard({ title, value, icon, currency = true }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-muted p-2">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency
            ? `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
            : value}
        </div>
      </CardContent>
    </Card>
  );
}

interface AIAssistantProps {
  stats: Stats;
}

function AIAssistant({ stats }: AIAssistantProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = async () => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analizza questi dati per l'evento "Epica Camonica":
        Entrate: €${stats.totalIncome}
        Uscite: €${stats.totalExpense}
        Saldo: €${stats.netBalance}
        Partecipanti: ${stats.participantsCount}
        E-bike: ${stats.totalEbikes}
        Fornisci un breve commento strategico in italiano sull'andamento dell'evento.`
      });
      setAnalysis(response.text || "Nessuna analisi disponibile.");
    } catch {
      setAnalysis("Errore durante l'analisi AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-emerald-600 text-white border-0">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
            <Zap className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl text-white">Assistente Epica AI</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis ? (
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm text-sm leading-relaxed">
            {analysis}
          </div>
        ) : (
          <CardDescription className="text-white/70">
            Ottieni una panoramica strategica dei tuoi dati finanziari grazie all'intelligenza artificiale di Gemini.
          </CardDescription>
        )}
        <Button
          onClick={analyze}
          disabled={isLoading}
          variant="secondary"
          className="bg-white text-indigo-600 hover:bg-indigo-50"
        >
          {isLoading ? 'Analisi in corso...' : analysis ? 'Aggiorna Analisi' : 'Analizza con Gemini'}
        </Button>
      </CardContent>
    </Card>
  );
}

const chartConfig = {
  val: {
    label: "Importo",
  },
  income: {
    label: "Entrate",
    color: "oklch(0.527 0.154 150.069)",
  },
  expense: {
    label: "Uscite",
    color: "oklch(0.577 0.245 27.325)",
  },
} satisfies ChartConfig;

interface DashboardPageProps {
  stats: Stats;
  transactions: Transaction[];
}

export function DashboardPage({ stats, transactions }: DashboardPageProps) {
  const chartData = [
    { name: 'Entrate', val: stats.totalIncome, fill: "var(--color-income)" },
    { name: 'Uscite', val: stats.totalExpense, fill: "var(--color-expense)" }
  ];

  const downloadCSV = () => {
    if (transactions.length === 0) return;
    const headers = Object.keys(transactions[0]).join(',');
    const rows = transactions.map(obj =>
      Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Report_Epica.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panoramica</h1>
          <p className="text-muted-foreground">Resoconto finanziario e logistico.</p>
        </div>
        <Button variant="secondary" onClick={downloadCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Esporta
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tot. Entrate"
          value={stats.totalIncome}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Tot. Uscite"
          value={stats.totalExpense}
          icon={<TrendingDown className="h-5 w-5 text-destructive" />}
        />
        <StatCard
          title="Saldo Netto"
          value={stats.netBalance}
          icon={<Wallet className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Partecipanti"
          value={stats.participantsCount}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          currency={false}
        />
        <StatCard
          title="E-Bike"
          value={stats.totalEbikes}
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          currency={false}
        />
      </div>

      <AIAssistant stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Flusso Finanziario</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="val" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
