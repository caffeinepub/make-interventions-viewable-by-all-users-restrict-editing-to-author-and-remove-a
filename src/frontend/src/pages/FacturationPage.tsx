import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { BillingRecord } from "../backend";
import {
  useDeleteBillingRecord,
  useGetBillingRecords,
  useUpdateBillingRecordStatus,
} from "../hooks/useFacturation";

function formatDate(date: { day: bigint; month: bigint; year: bigint }) {
  return `${String(Number(date.day)).padStart(2, "0")}/${String(Number(date.month)).padStart(2, "0")}/${Number(date.year)}`;
}

function BillingCard({ record }: { record: BillingRecord }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateBillingRecordStatus();
  const deleteRecord = useDeleteBillingRecord();
  const isPending = record.status === "pending";

  const handleExportPDF = async () => {
    // Generate simple text-based PDF using browser print
    const content = `
FACTURATION - ${record.clientName}
================================
Date: ${formatDate(record.date)}
Employé: ${record.employeeName}
Motif: ${record.reason}

Pièces / Références:
${record.parts.length > 0 ? record.parts.map((p) => `  - ${p.reference} x${p.quantity}`).join("\n") : "  Aucune pièce"}

Commentaire:
${record.comment || "Aucun commentaire"}

Statut: ${isPending ? "En attente" : "Terminé"}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturation-${record.clientName.replace(/\s+/g, "-")}-${formatDate(record.date).replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // Mark as completed after export
    if (isPending) {
      await updateStatus.mutateAsync({ id: record.id, status: "completed" });
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-base">{record.clientName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(record.date)} — {record.employeeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`border-0 text-white ${
                isPending ? "bg-orange-500" : "bg-green-500"
              }`}
            >
              {isPending ? "En attente" : "Terminé"}
            </Badge>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />

          {record.reason && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Motif</p>
              <p className="text-sm">{record.reason}</p>
            </div>
          )}

          {record.comment && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Commentaire</p>
              <p className="text-sm">{record.comment}</p>
            </div>
          )}

          {record.parts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Pièces / Références
              </p>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b border-border pb-1 mb-1">
                  <span>Référence</span>
                  <span>Quantité</span>
                  <span />
                </div>
                {record.parts.map((p, i) => (
                  <div
                    key={`${p.reference}-${i}`}
                    className="grid grid-cols-3 text-sm"
                  >
                    <span>{p.reference}</span>
                    <span>{p.quantity}</span>
                    <span />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={updateStatus.isPending}
              className="flex items-center gap-2"
            >
              {updateStatus.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exporter PDF
            </Button>

            {!isPending && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer cet enregistrement ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Les enregistrements terminés peuvent être supprimés
                      manuellement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground"
                      onClick={() => deleteRecord.mutateAsync(record.id)}
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function FacturationPage() {
  const { data: records = [], isLoading } = useGetBillingRecords();

  const pending = records.filter((r) => r.status === "pending");
  const completed = records.filter((r) => r.status === "completed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Aucune intervention validée pour l&apos;instant.
          </p>
          <p className="text-sm text-muted-foreground">
            Les interventions validées depuis le planning apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-foreground">
                  En attente ({pending.length})
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {pending.map((r) => (
                  <BillingCard key={r.id} record={r} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-semibold text-foreground">
                  Terminé ({completed.length})
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {completed.map((r) => (
                  <BillingCard key={r.id} record={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
