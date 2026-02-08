import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetClients, useSearchClients } from '../hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, AlertCircle } from 'lucide-react';
import AppBadge from '../components/common/AppBadge';
import { Skeleton } from '@/components/ui/skeleton';
import CreateClientDialog from '../components/clients/CreateClientDialog';
import AuthenticatedOnly from '../components/guards/AuthenticatedOnly';

function ClientsPageContent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: allClients, isLoading: loadingAll } = useGetClients();
  const { data: searchResults, isLoading: loadingSearch } = useSearchClients(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clients = debouncedSearch ? searchResults : allClients;
  const isLoading = debouncedSearch ? loadingSearch : loadingAll;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for a client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => {
            const clientId = client.info.name.toLowerCase().replace(/\s+/g, '-');
            return (
              <Card
                key={clientId}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate({ to: '/clients/$clientId', params: { clientId } })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{client.info.name}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">{client.info.address.city}</p>
                    </div>
                    {client.isBlacklisted && (
                      <AppBadge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Blacklisted
                      </AppBadge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {debouncedSearch ? 'No clients found' : 'No clients registered'}
            </p>
            {!debouncedSearch && (
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateClientDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AuthenticatedOnly>
      <ClientsPageContent />
    </AuthenticatedOnly>
  );
}
