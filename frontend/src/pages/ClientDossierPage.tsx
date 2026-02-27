import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetClients } from '../hooks/useClients';
import { Client } from '../backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import BlacklistPanel from '../components/blacklist/BlacklistPanel';
import InterventionList from '../components/interventions/InterventionList';
import EditClientDialog from '../components/clients/EditClientDialog';
import { Separator } from '@/components/ui/separator';

export default function ClientDossierPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const clientParam = (params as Record<string, string>).clientId || '';

  const { data: clients, isLoading, error, refetch } = useGetClients();

  // Decode client from param - find by index encoded in the param
  const decodedParam = decodeURIComponent(clientParam);
  const lastDash = decodedParam.lastIndexOf('-');
  const indexStr = lastDash >= 0 ? decodedParam.substring(lastDash + 1) : '';
  const index = parseInt(indexStr, 10);

  const client: Client | undefined =
    clients && !isNaN(index) && index < clients.length
      ? clients[index]
      : clients?.find((c) => c.info.name === decodedParam);

  const clientId = client
    ? `${client.info.name.toLowerCase().replace(/\s+/g, '-')}-${index}`
    : clientParam;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Erreur de chargement</h2>
          <p className="text-muted-foreground text-sm mt-1">{(error as Error).message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Client introuvable</h2>
          <p className="text-muted-foreground text-sm mt-1">Ce client n'existe pas ou a été supprimé.</p>
        </div>
        <Button onClick={() => navigate({ to: '/clients' })} variant="outline">
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/clients' })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{client.info.name}</h1>
        </div>
        <EditClientDialog client={client} clientId={clientId} />
      </div>

      <div className="px-4 py-4 flex flex-col gap-6">
        {/* Blacklist badge */}
        {client.isBlacklisted && (
          <Badge variant="destructive" className="self-start">
            ⚠ Liste noire
          </Badge>
        )}

        {/* Contact info */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-foreground">Informations de contact</h2>
          <div className="flex flex-col gap-2">
            {client.info.address.street && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">
                  {client.info.address.street}, {client.info.address.city}
                  {client.info.address.zip && ` ${client.info.address.zip}`}
                  {client.info.address.state && `, ${client.info.address.state}`}
                </span>
              </div>
            )}
            {client.info.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={`tel:${client.info.phone}`} className="text-primary">
                  {client.info.phone}
                </a>
              </div>
            )}
            {client.info.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${client.info.email}`} className="text-primary">
                  {client.info.email}
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Blacklist panel */}
        <BlacklistPanel client={client} clientId={clientId} />

        <Separator />

        {/* Interventions */}
        <InterventionList clientId={clientId} />
      </div>
    </div>
  );
}
