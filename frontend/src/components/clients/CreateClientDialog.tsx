import React, { useState } from 'react';
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
import { useCreateClient } from '../../hooks/useClients';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const createClient = useCreateClient();
  const [form, setForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.street.trim() || !form.city.trim()) return;

    const id = `${form.name.trim()}-${Date.now()}`;
    await createClient.mutateAsync({
      id,
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

    setForm({ name: '', street: '', city: '', state: '', zip: '', phone: '', email: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" value={form.name} onChange={handleChange('name')} placeholder="Nom du client" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="street">Rue *</Label>
            <Input id="street" value={form.street} onChange={handleChange('street')} placeholder="Adresse" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Ville *</Label>
              <Input id="city" value={form.city} onChange={handleChange('city')} placeholder="Ville" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zip">Code postal</Label>
              <Input id="zip" value={form.zip} onChange={handleChange('zip')} placeholder="Code postal" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state">Région</Label>
            <Input id="state" value={form.state} onChange={handleChange('state')} placeholder="Région / Département" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={form.phone} onChange={handleChange('phone')} placeholder="Numéro de téléphone" type="tel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={form.email} onChange={handleChange('email')} placeholder="Adresse email" type="email" />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createClient.isPending || !form.name.trim() || !form.street.trim() || !form.city.trim()}>
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
