import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import MediaPicker from "../components/media/MediaPicker";
import { useUserAccess } from "../contexts/UserAccessContext";
import { useActor } from "../hooks/useActor";
import { useGetCallerUserProfile } from "../hooks/useCurrentUser";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemoItem {
  id: string;
  authorPrincipal: { toString(): string };
  authorName: string;
  title: string;
  content: string;
  media: ExternalBlob[];
  voiceNote: [] | [ExternalBlob];
  createdAt: bigint;
}

// ── Voice Recorder ────────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onRecorded: (blob: ExternalBlob | null) => void;
  voiceBlob: ExternalBlob | null;
}

function VoiceRecorder({ onRecorded, voiceBlob }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When voiceBlob changes externally (e.g. reset), clear preview
  useEffect(() => {
    if (!voiceBlob && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSeconds(0);
    }
  }, [voiceBlob, previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        for (const track of stream.getTracks()) track.stop();
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        const bytes = new Uint8Array(await audioBlob.arrayBuffer());
        onRecorded(ExternalBlob.fromBytes(bytes));
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const clearRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    onRecorded(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Note vocale</Label>
      <div className="flex items-center gap-3 flex-wrap">
        {!isRecording && !previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            className="gap-2"
            data-ocid="memo.voice.button"
          >
            <Mic className="w-4 h-4 text-[#0066CC]" />
            Enregistrer
          </Button>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-red-600">
                {formatTime(seconds)}
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="gap-2"
            >
              <MicOff className="w-4 h-4" />
              Arrêter
            </Button>
          </div>
        )}

        {previewUrl && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* biome-ignore lint/a11y/useMediaCaption: user-recorded voice memo, captions not applicable */}
            <audio controls src={previewUrl} className="h-8 max-w-[200px]" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearRecording}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Media display ─────────────────────────────────────────────────────────────

function MemoMediaDisplay({ media }: { media: ExternalBlob[] }) {
  if (media.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {media.map((blob, i) => {
        const url = blob.getDirectURL();
        const isVideo =
          url.includes("video") ||
          url.endsWith(".mp4") ||
          url.endsWith(".webm") ||
          url.endsWith(".mov");

        if (isVideo) {
          return (
            // biome-ignore lint/a11y/useMediaCaption: user-uploaded video content
            <video
              key={url}
              src={url}
              controls
              className="max-w-full rounded-lg border border-border"
              style={{ maxHeight: "200px" }}
              aria-label={`Vidéo ${i + 1}`}
            />
          );
        }

        return (
          <img
            key={url}
            src={url}
            alt={`Media ${i + 1}`}
            className="max-w-full rounded-lg border border-border object-cover"
            style={{ maxHeight: "200px" }}
          />
        );
      })}
    </div>
  );
}

// ── Create Memo Dialog ────────────────────────────────────────────────────────

function CreateMemoDialog({
  defaultAuthor,
  onCreated,
}: {
  defaultAuthor: string;
  onCreated: () => void;
}) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState(defaultAuthor);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<ExternalBlob[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<ExternalBlob | null>(null);

  // Update author when defaultAuthor is resolved
  useEffect(() => {
    if (defaultAuthor && !author) setAuthor(defaultAuthor);
  }, [defaultAuthor, author]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      const a = actor as any;
      const voiceArg: [] | [ExternalBlob] = voiceBlob ? [voiceBlob] : [];
      await a.createMemo(
        title.trim(),
        author.trim(),
        content.trim(),
        media,
        voiceArg,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      toast.success("Mémo créé avec succès");
      setOpen(false);
      setTitle("");
      setContent("");
      setMedia([]);
      setVoiceBlob(null);
      onCreated();
    },
    onError: (err: Error) => {
      toast.error(`Erreur: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!author.trim()) {
      toast.error("Le nom de l'auteur est obligatoire");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] text-white"
          data-ocid="memo.open_modal_button"
        >
          <Plus className="w-4 h-4" />
          Nouvelle note
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        data-ocid="memo.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-[#0066CC]" />
            Nouvelle note
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo-title">Titre *</Label>
            <Input
              id="memo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la note"
              data-ocid="memo.input"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo-author">Auteur</Label>
            <Input
              id="memo-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Votre nom"
              data-ocid="memo.author.input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo-content">Contenu</Label>
            <Textarea
              id="memo-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Saisissez votre note..."
              rows={4}
              data-ocid="memo.textarea"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Photos / Vidéos</Label>
            <MediaPicker media={media} onChange={setMedia} />
          </div>

          <VoiceRecorder voiceBlob={voiceBlob} onRecorded={setVoiceBlob} />

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              data-ocid="memo.cancel_button"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0066CC] hover:bg-[#0055AA] text-white"
              disabled={mutation.isPending}
              data-ocid="memo.submit_button"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Memo Card ─────────────────────────────────────────────────────────────────

function MemoCard({
  memo,
  canDelete,
  onDelete,
}: {
  memo: MemoItem;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const createdAt = new Date(Number(memo.createdAt / BigInt(1_000_000)));
  const dateStr = createdAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = createdAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const voiceNote = memo.voiceNote.length > 0 ? memo.voiceNote[0] : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
            {memo.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#0066CC]">
              {memo.authorName || "Anonyme"}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {dateStr} à {timeStr}
            </span>
          </div>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8"
            onClick={() => onDelete(memo.id)}
            data-ocid="memo.delete_button"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {memo.content && (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {memo.content}
        </p>
      )}

      {/* Media */}
      <MemoMediaDisplay media={memo.media} />

      {/* Voice note */}
      {voiceNote && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mic className="w-3 h-3" />
            Note vocale
          </span>
          {/* biome-ignore lint/a11y/useMediaCaption: user-recorded voice memo, captions not applicable */}
          <audio
            controls
            src={voiceNote.getDirectURL()}
            className="w-full h-8"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MemoPage() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isAdmin } = useUserAccess();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";
  const defaultAuthor = userProfile?.name ?? "";

  const {
    data: memos,
    isLoading,
    error,
    refetch,
  } = useQuery<MemoItem[]>({
    queryKey: ["memos"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const a = actor as any;
        const result = await a.getMemos();
        return (result as MemoItem[]).sort((x: MemoItem, y: MemoItem) =>
          Number(y.createdAt - x.createdAt),
        );
      } catch (err) {
        console.warn("getMemos failed:", err);
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor non disponible");
      const a = actor as any;
      await a.deleteMemo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      toast.success("Note supprimée");
    },
    onError: (err: Error) => {
      toast.error(`Erreur: ${err.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    deleteMutation.mutate(id);
  };

  const canDeleteMemo = (memo: MemoItem) => {
    if (isAdmin) return true;
    return memo.authorPrincipal.toString() === currentPrincipal;
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-[#0066CC]" />
          <h1 className="text-xl font-bold text-foreground">Mémo</h1>
        </div>
        <CreateMemoDialog
          defaultAuthor={defaultAuthor}
          onCreated={() => refetch()}
        />
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground">
        Notes partagées — visibles par tous les utilisateurs
      </p>

      {/* Content */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="memo.loading_state"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#0066CC]" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 py-10"
          data-ocid="memo.error_state"
        >
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center">
            {(error as Error).message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      ) : !memos || memos.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-16"
          data-ocid="memo.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-[#0066CC]/10 flex items-center justify-center">
            <StickyNote className="w-8 h-8 text-[#0066CC]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              Aucune note pour l'instant
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez la première note partagée de l'équipe
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {memos.map((memo, idx) => (
            <div key={memo.id} data-ocid={`memo.item.${idx + 1}`}>
              <MemoCard
                memo={memo}
                canDelete={canDeleteMemo(memo)}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
