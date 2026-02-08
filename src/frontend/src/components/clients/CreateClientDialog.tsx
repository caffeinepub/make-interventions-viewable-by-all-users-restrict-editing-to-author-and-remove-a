import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateOrUpdateClient } from '../../hooks/useClients';
import { Loader2 } from 'lucide-react';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const createClient = useCreateOrUpdateClient();

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim()) return;

    const clientId = name.toLowerCase().replace(/\s+/g, '-');
    await createClient.mutateAsync({
      id: clientId,
      name: name.trim(),
      address: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
      },
      phone: phone.trim(),
      email: email.trim(),
    });

    onOpenChange(false);
    setName('');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setPhone('');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Rue</Label>
            <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="zip">Code postal</Label>
              <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Région</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !city.trim() || createClient.isPending}
              className="flex-1"
            >
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
