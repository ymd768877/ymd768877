import { useState } from "react";
import {
  useGetAdminAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AnnouncementForm = { message: string; isActive: boolean };

export default function Announcements() {
  const { data: announcements, isLoading } = useGetAdminAnnouncements();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [form, setForm] = useState<AnnouncementForm>({ message: "", isActive: true });

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Announcement created" }); setDialog(null); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateAnnouncement({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Announcement updated" }); setDialog(null); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Announcement deleted" }); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  function openCreate() {
    setForm({ message: "", isActive: true });
    setDialog({ mode: "create" });
  }

  function openEdit(ann: { id: number; message: string; isActive: boolean }) {
    setForm({ message: ann.message, isActive: ann.isActive });
    setDialog({ mode: "edit", id: ann.id });
  }

  function handleSubmit() {
    if (!form.message.trim()) return;
    if (dialog?.mode === "create") {
      createMutation.mutate({ data: form });
    } else if (dialog?.mode === "edit" && dialog.id) {
      updateMutation.mutate({ announcementId: dialog.id, data: form });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">Manage marquee announcements on user site</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements?.map((ann) => (
            <div key={ann.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed line-clamp-2">{ann.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    ann.isActive
                      ? "bg-green-500/15 text-green-500 border border-green-500/20"
                      : "bg-muted text-muted-foreground border border-border"
                  )}>
                    {ann.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(ann)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => deleteMutation.mutate({ announcementId: ann.id })}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {announcements?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              No announcements yet. Create one above.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) setDialog(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "New Announcement" : "Edit Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                placeholder="Enter announcement text..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Active (shows on site)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.message.trim()}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
