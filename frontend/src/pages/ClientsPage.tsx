import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Plus, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients } from '../hooks/useClients';
import CreateClientDialog from '../components/clients/CreateClientDialog';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: clients, isLoading, isError, refetch } = useClients();

  const filtered = (clients ?? []).filter(c =>
    c.info.name.toLowerCase().includes(search.toLowerCase()) ||
    c.info.address.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement des clients</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <User className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Aucun client trouvé' : 'Aucun client enregistré'}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(client => (
            <button
              key={client.info.name}
              onClick={() => navigate({ to: '/clients/$clientId', params: { clientId: encodeURIComponent(client.info.name) } })}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{client.info.name}</span>
                    {client.isBlacklisted && (
                      <Badge variant="destructive" className="text-xs shrink-0">Liste noire</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {client.info.address.street}, {client.info.address.city}
                  </p>
                  {client.info.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{client.info.phone}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateClientDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
