import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Lead = { id: string; name: string; status: string; source?: string };
export type Contact = { id: string; name: string; segment?: string; last?: string };
export type Deal = { id: string; title: string; value: number; stage: string };
export type Task = { id: string; title: string; due: string; status: string; type?: string };

type CRMContextType = {
  leads: Lead[];
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  isLoading: boolean;
  addLead: (l: Omit<Lead, 'id'>) => Promise<Lead>;
  addContact: (c: Omit<Contact, 'id'>) => Promise<Contact>;
  addDeal: (d: Omit<Deal, 'id'>) => Promise<Deal>;
  addTask: (t: Omit<Task, 'id'>) => Promise<Task>;
  updateLead: (l: Lead) => Promise<void>;
  updateContact: (c: Contact) => Promise<void>;
  updateDeal: (d: Deal) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  removeDeal: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }
};

const KEY = 'dealix_crm_data_v1';

type StoreShape = { leads: Lead[]; contacts: Contact[]; deals: Deal[]; tasks: Task[] };

const defaultData: StoreShape = {
  leads: [
    { id: 'L-1001', name: 'Alice Johnson', status: 'New', source: 'Web' },
    { id: 'L-1002', name: 'Bob Smith', status: 'Contacted', source: 'Referral' },
  ],
  contacts: [
    { id: 'C-2001', name: 'Daisy Ridley', segment: 'Hot', last: '2d ago' },
    { id: 'C-2002', name: 'Ethan Hunt', segment: 'Warm', last: '3h ago' },
  ],
  deals: [
    { id: 'D-3001', title: 'Villa Greens', value: 250000, stage: 'Proposal' },
    { id: 'D-3002', title: 'Lakeview Apartments', value: 120000, stage: 'Negotiation' },
  ],
  tasks: [
    { id: 'T-4001', title: 'Call back Alice', due: 'Today', status: 'Open', type: 'Call' },
    { id: 'T-4002', title: 'Schedule demo with Bob', due: 'Tomorrow', status: 'Open', type: 'Meeting' },
  ],
};

function uid(prefix: string) {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-4)}${r}`;
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreShape>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem(KEY);
      if (raw) {
        try { setStore(JSON.parse(raw)); } catch {}
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      storage.setItem(KEY, JSON.stringify(store));
    }
  }, [store, isLoading]);

  const value = useMemo<CRMContextType>(() => ({
    leads: store.leads,
    contacts: store.contacts,
    deals: store.deals,
    tasks: store.tasks,
    isLoading,
    async addLead(l) {
      const item: Lead = { id: uid('L'), ...l };
      setStore(s => ({ ...s, leads: [item, ...s.leads] }));
      return item;
    },
    async addContact(c) {
      const item: Contact = { id: uid('C'), ...c };
      setStore(s => ({ ...s, contacts: [item, ...s.contacts] }));
      return item;
    },
    async addDeal(d) {
      const item: Deal = { id: uid('D'), ...d };
      setStore(s => ({ ...s, deals: [item, ...s.deals] }));
      return item;
    },
    async addTask(t) {
      const item: Task = { id: uid('T'), ...t };
      setStore(s => ({ ...s, tasks: [item, ...s.tasks] }));
      return item;
    },
    async updateLead(l) { setStore(s => ({ ...s, leads: s.leads.map(x => x.id === l.id ? l : x) })); },
    async updateContact(c) { setStore(s => ({ ...s, contacts: s.contacts.map(x => x.id === c.id ? c : x) })); },
    async updateDeal(d) { setStore(s => ({ ...s, deals: s.deals.map(x => x.id === d.id ? d : x) })); },
    async updateTask(t) { setStore(s => ({ ...s, tasks: s.tasks.map(x => x.id === t.id ? t : x) })); },
    async removeLead(id) { setStore(s => ({ ...s, leads: s.leads.filter(x => x.id !== id) })); },
    async removeContact(id) { setStore(s => ({ ...s, contacts: s.contacts.filter(x => x.id !== id) })); },
    async removeDeal(id) { setStore(s => ({ ...s, deals: s.deals.filter(x => x.id !== id) })); },
    async removeTask(id) { setStore(s => ({ ...s, tasks: s.tasks.filter(x => x.id !== id) })); },
  }), [store, isLoading]);

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
