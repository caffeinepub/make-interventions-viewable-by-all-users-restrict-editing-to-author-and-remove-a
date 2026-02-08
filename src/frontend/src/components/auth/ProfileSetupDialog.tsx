import { useState } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../../hooks/useCurrentUser';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ProfileSetupDialog() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await saveProfile({ name: name.trim() });
      window.location.reload();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={showProfileSetup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Bienvenue</DialogTitle>
          <DialogDescription>Veuillez entrer votre nom pour continuer</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Continuer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
