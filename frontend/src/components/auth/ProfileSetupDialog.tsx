import React, { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../../hooks/useCurrentUser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ProfileSetupDialog() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [name, setName] = useState('');

  const isAuthenticated = !!identity;
  const showDialog = isAuthenticated && !isLoading && isFetched && userProfile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
  };

  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Bienvenue !</DialogTitle>
          <DialogDescription>
            Veuillez entrer votre nom pour configurer votre profil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-name">Votre nom</Label>
            <Input
              id="profile-name"
              placeholder="Entrez votre nom..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || saveProfile.isPending} className="w-full">
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
