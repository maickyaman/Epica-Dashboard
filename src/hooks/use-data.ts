import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, setDoc
} from '@/lib/firebase';
import type { Edition, Transaction, Participant, Stats } from '@/types';
import { TransactionType, SourceType } from '@/types';

export function useEditions() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'editions'), (snapshot) => {
      setEditions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Edition)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addEdition = useCallback(async (edition: Edition) => {
    await setDoc(doc(db, 'editions', edition.id), edition);
  }, []);

  const deleteEdition = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'editions', id));
  }, []);

  return { editions, isLoading, addEdition, deleteEdition };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'transactions'), orderBy('date', 'desc')),
      (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)));
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    await addDoc(collection(db, 'transactions'), transaction);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  }, []);

  return { transactions, isLoading, addTransaction, deleteTransaction };
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'participants'), (snapshot) => {
      setParticipants(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Participant)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addParticipant = useCallback(async (participant: Omit<Participant, 'id'>) => {
    await addDoc(collection(db, 'participants'), participant);
  }, []);

  const updateParticipant = useCallback(async (id: string, data: Partial<Participant>) => {
    await updateDoc(doc(db, 'participants', id), data);
  }, []);

  const deleteParticipant = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'participants', id));
  }, []);

  return { participants, isLoading, addParticipant, updateParticipant, deleteParticipant };
}

export function useStats(
  transactions: Transaction[],
  participants: Participant[],
  selectedEditionId: string
): Stats {
  return useMemo(() => {
    const fT = selectedEditionId === 'all'
      ? transactions
      : transactions.filter(t => t.editionId === selectedEditionId);
    const fP = selectedEditionId === 'all'
      ? participants
      : participants.filter(p => p.editionId === selectedEditionId);

    const income = fT
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = fT
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const endu = fT
      .filter(t => t.source === SourceType.ENDU && t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const cash = fT
      .filter(t => t.source === SourceType.CASH && t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const ebikes = fP.filter(p => p.ebike).length;

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      enduIncome: endu,
      cashIncome: cash,
      totalEbikes: ebikes,
      participantsCount: fP.length
    };
  }, [transactions, participants, selectedEditionId]);
}
