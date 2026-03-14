import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { ScheduledIntervention } from "../../backend";
import { useGetClientsWithIds } from "../../hooks/useClients";
import {
  useCreateScheduledIntervention,
  useGetApprovedEmployees,
  useUpdateScheduledIntervention,
} from "../../hooks/useScheduledInterventions";
import { getISOWeek, getISOWeekYear } from "../../utils/dateUtils";
import SignatureCanvas from "./SignatureCanvas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialEmployee?: Principal;
  existing?: ScheduledIntervention;
}

export default function ScheduledInterventionFormDialog({
  open,
  onOpenChange,
  initialDate,
  initialEmployee,
  existing,
}: Props) {
  const { data: clients = [] } = useGetClientsWithIds();
  const { data: employees = [] } = useGetApprovedEmployees();
  const createMutation = useCreateScheduledIntervention();
  const updateMutation = useUpdateScheduledIntervention();

  const isEditing = !!existing;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [assignedEmployee, setAssignedEmployee] = useState<string>("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [employeeSig, setEmployeeSig] = useState<string | null>(null);
  const [clientSig, setClientSig] = useState<string | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = clients.filter((c) =>
    c.info.name.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      if (existing) {
        setAssignedEmployee(existing.assignedEmployee.toString());
        setSelectedClientId(existing.clientId);
        setClientName(existing.clientName);
        setClientSearch(existing.clientName);
        setReason(existing.reason);
        const d = existing.date;
        const y = Number(d.year);
        const m = String(Number(d.month)).padStart(2, "0");
        const day = String(Number(d.day)).padStart(2, "0");
        setDate(`${y}-${m}-${day}`);
        setStartTime(existing.startTime);
        setEndTime(existing.endTime);
        setDescription(existing.description);
        setEmployeeSig(existing.employeeSignature ?? null);
        setClientSig(existing.clientSignature ?? null);
        setMediaFiles([]);
      } else {
        setAssignedEmployee(initialEmployee?.toString() ?? "");
        setSelectedClientId("");
        setClientName("");
        setClientSearch("");
        setReason("");
        const d = initialDate ?? new Date();
        setDate(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        );
        setStartTime("08:00");
        setEndTime("10:00");
        setDescription("");
        setMediaFiles([]);
        setEmployeeSig(null);
        setClientSig(null);
      }
      setShowClientDropdown(false);
    }
  }, [open, existing, initialDate, initialEmployee]);

  const handleClientSelect = (id: string, name: string) => {
    setSelectedClientId(id);
    setClientName(name);
    setClientSearch(name);
    setShowClientDropdown(false);
  };

  const handleClientSearchChange = (val: string) => {
    setClientSearch(val);
    setClientName(val);
    setSelectedClientId("");
    setShowClientDropdown(val.length > 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedEmployee) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Veuillez indiquer un client");
      return;
    }
    if (!date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const weekNumber = getISOWeek(dateObj);
    const weekYear = getISOWeekYear(dateObj);

    const employeePrincipal = employees.find(
      ([p]) => p.toString() === assignedEmployee,
    )?.[0];
    if (!employeePrincipal) {
      toast.error("Employé introuvable");
      return;
    }

    // Upload media
    const mediaBlobs: ExternalBlob[] = [];
    for (const file of mediaFiles) {
      const buf = await file.arrayBuffer();
      mediaBlobs.push(ExternalBlob.fromBytes(new Uint8Array(buf)));
    }
    // Keep existing media if editing
    if (isEditing && existing) {
      mediaBlobs.unshift(...existing.media);
    }

    const params = {
      clientId: selectedClientId || `new-${Date.now()}`,
      clientName: clientName.trim(),
      assignedEmployee: employeePrincipal,
      reason,
      startTime,
      endTime,
      description,
      media: mediaBlobs,
      day,
      month,
      year,
      weekNumber,
      weekYear,
    };

    if (isEditing && existing) {
      await updateMutation.mutateAsync({
        ...params,
        id: existing.id,
        employeeSignature: employeeSig,
        clientSignature: clientSig,
      });
    } else {
      await createMutation.mutateAsync(params);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
        data-ocid="planning.dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'intervention" : "Nouvelle intervention"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Assigned employee */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employee-select">Employé assigné *</Label>
            <Select
              value={assignedEmployee}
              onValueChange={setAssignedEmployee}
            >
              <SelectTrigger id="employee-select" data-ocid="planning.select">
                <SelectValue placeholder="Choisir un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(([principal, profile]) => (
                  <SelectItem
                    key={principal.toString()}
                    value={principal.toString()}
                  >
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="flex flex-col gap-1.5 relative">
            <Label htmlFor="client-search">Client *</Label>
            <Input
              id="client-search"
              data-ocid="planning.search_input"
              value={clientSearch}
              onChange={(e) => handleClientSearchChange(e.target.value)}
              onFocus={() => setShowClientDropdown(clientSearch.length > 0)}
              placeholder="Rechercher ou saisir un client"
              autoComplete="off"
            />
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredClients.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => handleClientSelect(c.id, c.info.name)}
                  >
                    {c.info.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Motif */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason-input">Motif</Label>
            <Input
              id="reason-input"
              data-ocid="planning.input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif de l'intervention"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-input">Date *</Label>
            <Input
              id="date-input"
              type="date"
              data-ocid="planning.input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start-time">Heure début</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end-time">Heure fin</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-ocid="planning.textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'intervention réalisée..."
              rows={3}
            />
          </div>

          {/* Media */}
          <div className="flex flex-col gap-1.5">
            <Label>Photos / Vidéos</Label>
            <div className="flex flex-wrap gap-2">
              {mediaFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs"
                >
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaFiles((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="planning.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="w-fit"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter des médias
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Signatures */}
          <SignatureCanvas
            label="Signature de l'employé"
            value={employeeSig}
            onChange={setEmployeeSig}
          />
          <SignatureCanvas
            label="Signature du client"
            value={clientSig}
            onChange={setClientSig}
          />

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="planning.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              data-ocid="planning.submit_button"
              disabled={isPending}
              className="bg-primary text-primary-foreground"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
