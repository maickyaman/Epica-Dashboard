import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useEditions, useTransactions, useParticipants, useStats } from '@/hooks/use-data';
import { AppLayout } from '@/components/app-layout';
import {
  DashboardPage,
  TransactionsPage,
  ParticipantsPage,
  EditionsPage,
  AuthPage,
} from '@/pages';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
        Epica Camonica Cloud
      </p>
    </div>
  );
}

interface AuthenticatedAppProps {
  userEmail?: string | null;
}

function AuthenticatedApp({ userEmail }: AuthenticatedAppProps) {
  const [selectedEditionId, setSelectedEditionId] = useState<string>('all');
  const [isAddEditionOpen, setIsAddEditionOpen] = useState(false);

  const { editions, addEdition, deleteEdition } = useEditions();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { participants, addParticipant, updateParticipant, deleteParticipant } = useParticipants();

  const filteredTransactions = useMemo(() => {
    return selectedEditionId === 'all'
      ? transactions
      : transactions.filter((t) => t.editionId === selectedEditionId);
  }, [transactions, selectedEditionId]);

  const filteredParticipants = useMemo(() => {
    return selectedEditionId === 'all'
      ? participants
      : participants.filter((p) => p.editionId === selectedEditionId);
  }, [participants, selectedEditionId]);

  const stats = useStats(transactions, participants, selectedEditionId);

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            editions={editions}
            selectedEditionId={selectedEditionId}
            onEditionChange={setSelectedEditionId}
            onAddEdition={() => setIsAddEditionOpen(true)}
            userEmail={userEmail}
          />
        }
      >
        <Route
          index
          element={
            <DashboardPage stats={stats} transactions={filteredTransactions} />
          }
        />
        <Route
          path="bilancio"
          element={
            <TransactionsPage
              transactions={filteredTransactions}
              editions={editions}
              currentEditionId={selectedEditionId}
              onAdd={addTransaction}
              onDelete={deleteTransaction}
            />
          }
        />
        <Route
          path="iscritti"
          element={
            <ParticipantsPage
              participants={filteredParticipants}
              editions={editions}
              currentEditionId={selectedEditionId}
              onAdd={addParticipant}
              onUpdate={updateParticipant}
              onDelete={deleteParticipant}
            />
          }
        />
        <Route
          path="edizioni"
          element={
            <EditionsPage
              editions={editions}
              isDialogOpen={isAddEditionOpen}
              onOpenDialog={() => setIsAddEditionOpen(true)}
              onCloseDialog={() => setIsAddEditionOpen(false)}
              onAdd={addEdition}
              onDelete={deleteEdition}
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      {user ? <AuthenticatedApp userEmail={user.email} /> : <AuthPage />}
    </BrowserRouter>
  );
}
