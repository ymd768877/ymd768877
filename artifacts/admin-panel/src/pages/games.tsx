import { useState } from "react";
import {
  useGetGames,
  useCreateGame,
  useUpdateGame,
  useDeleteGame,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type GameForm = {
  name: string;
  category: "hot" | "favorites" | "slots";
  provider: string;
  imageUrl: string;
  multiplier: string;
  isActive: boolean;
};

const DEFAULT_FORM: GameForm = {
  name: "",
  category: "hot",
  provider: "",
  imageUrl: "",
  multiplier: "",
  isActive: true,
};

export default function Games() {
  const { data: games, isLoading } = useGetGames({});
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; id?: number } | null>(null);
  const [form, setForm] = useState<GameForm>(DEFAULT_FORM);

  const createMutation = useCreateGame({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Game created" }); setDialog(null); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateGame({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Game updated" }); setDialog(null); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteGame({
    mutation: {
      onSuccess: () => { qc.invalidateQueries(); toast({ title: "Game deleted" }); },
      onError: (e: any) => toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" }),
    },
  });

  function openCreate() {
    setForm(DEFAULT_FORM);
    setDialog({ mode: "create" });
  }

  function openEdit(game: any) {
    setForm({
      name: game.name,
      category: game.category,
      provider: game.provider,
      imageUrl: game.imageUrl,
      multiplier: game.multiplier ?? "",
      isActive: game.isActive,
    });
    setDialog({ mode: "edit", id: game.id });
  }

  function handleSubmit() {
    if (!form.name || !form.provider || !form.imageUrl) return;
    const data = { ...form, multiplier: form.multiplier || undefined };
    if (dialog?.mode === "create") {
      createMutation.mutate({ data });
    } else if (dialog?.id) {
      updateMutation.mutate({ gameId: dialog.id, data });
    }
  }

  const filtered = games?.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.provider.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            Games
          </h1>
          <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} games</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Game
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered?.map((game) => (
            <div key={game.id} className="bg-card border border-border rounded-xl overflow-hidden group">
              <div className="aspect-[3/4] relative">
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/300x400/1a1a2e/gold?text=Game"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                  <div className="text-[10px] text-primary/80 uppercase tracking-wider">{game.provider}</div>
                  <div className="text-sm font-bold text-white leading-tight">{game.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                      game.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {game.isActive ? "Active" : "Off"}
                    </span>
                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">
                      {game.category}
                    </span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-7 h-7 bg-black/70 rounded flex items-center justify-center text-white hover:bg-primary/80 transition-colors"
                    onClick={() => openEdit(game)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="w-7 h-7 bg-black/70 rounded flex items-center justify-center text-red-400 hover:bg-red-500/80 hover:text-white transition-colors"
                    onClick={() => deleteMutation.mutate({ gameId: game.id })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          No games found
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) setDialog(null); }}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "Add Game" : "Edit Game"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Super Ace" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input placeholder="JILI, PG Soft..." value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                  <SelectItem value="slots">Slots</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Multiplier (optional)</Label>
              <Input placeholder="e.g. 1000x" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} className="bg-background" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !form.name || !form.provider || !form.imageUrl}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
