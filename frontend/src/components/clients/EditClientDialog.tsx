import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useUpdateClient } from '../../hooks/useClients';
import { Client } from '../../backend';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  clientId: string;
}

export default function EditClientDialog({ open, onOpenChange, client, clientId }: EditClientDialogProps) {
  const updateClient = useUpdateClient();
  const [form, setForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.info.name,
        street: client.info.address.street,
        city: client.info.address.city,
        state: client.info.address.state,
        zip: client.info.address.zip,
        phone: client.info.phone,
        email: client.info.email,
      });
    }
  }, [client]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.street.trim() || !form.city.trim()) return;

    await updateClient.mutateAsync({
      id: clientId,
      name: form.name.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
      },
      phone: form.phone.trim(),
      email: form.email.trim(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nom *</Label>
            <Input id="edit-name" value={form.name} onChange={handleChange('name')} placeholder="Nom du client" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-street">Rue *</Label>
            <Input id="edit-street" value={form.street} onChange={handleChange('street')} placeholder="Adresse" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-city">Ville *</Label>
              <Input id="edit-city" value={form.city} onChange={handleChange('city')} placeholder="Ville" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-zip">Code postal</Label>
              <Input id="edit-zip" value={form.zip} onChange={handleChange('zip')} placeholder="Code postal" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-state">Région</Label>
            <Input id="edit-state" value={form.state} onChange={handleChange('state')} placeholder="Région / Département" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">Téléphone</Label>
            <Input id="edit-phone" value={form.phone} onChange={handleChange('phone')} placeholder="Numéro de téléphone" type="tel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" value={form.email} onChange={handleChange('email')} placeholder="Adresse email" type="email" />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateClient.isPending || !form.name.trim() || !form.street.trim() || !form.city.trim()}>
              {updateClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
