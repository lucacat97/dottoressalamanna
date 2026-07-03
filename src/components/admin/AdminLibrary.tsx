import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Video, FileText, Link2, BookOpen, Pencil, Eye, EyeOff, Save, X } from "lucide-react";

type Plan = "base" | "pro" | "platinum";
type ContentType = "video_link" | "video_upload" | "pdf" | "article";

interface Section {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

interface Material {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  video_url: string | null;
  file_path: string | null;
  file_size: number | null;
  article_content: string | null;
  allowed_plans: Plan[];
  sort_order: number;
  is_published: boolean;
}

const PLAN_LABEL: Record<Plan, string> = { base: "Base", pro: "Pro", platinum: "Platinum" };
const TYPE_META: Record<ContentType, { label: string; icon: typeof Video }> = {
  video_link: { label: "Video (link)", icon: Link2 },
  video_upload: { label: "Video caricato", icon: Video },
  pdf: { label: "PDF / Documento", icon: FileText },
  article: { label: "Articolo", icon: BookOpen },
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminLibrary = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [newSectionName, setNewSectionName] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [sRes, mRes] = await Promise.all([
      supabase.from("material_sections").select("*").order("sort_order").order("name"),
      supabase.from("learning_materials").select("*").order("sort_order"),
    ]);
    if (sRes.data) setSections(sRes.data as Section[]);
    if (mRes.data) setMaterials(mRes.data as Material[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    const slug = slugify(name);
    const sort_order = sections.length;
    const { error } = await supabase.from("material_sections").insert({ name, slug, sort_order });
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    setNewSectionName("");
    toast({ title: "Sezione creata" });
    fetchAll();
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Eliminare questa sezione e tutti i suoi materiali?")) return;
    const { error } = await supabase.from("material_sections").delete().eq("id", id);
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    toast({ title: "Sezione eliminata" });
    fetchAll();
  };

  const moveSection = async (id: string, dir: -1 | 1) => {
    const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("material_sections").update({ sort_order: swap.sort_order }).eq("id", id),
      supabase.from("material_sections").update({ sort_order: sorted[idx].sort_order }).eq("id", swap.id),
    ]);
    fetchAll();
  };

  const deleteMaterial = async (m: Material) => {
    if (!confirm(`Eliminare "${m.title}"?`)) return;
    if (m.file_path) await supabase.storage.from("learning-materials").remove([m.file_path]);
    const { error } = await supabase.from("learning_materials").delete().eq("id", m.id);
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    toast({ title: "Materiale eliminato" });
    fetchAll();
  };

  const togglePublish = async (m: Material) => {
    await supabase.from("learning_materials").update({ is_published: !m.is_published }).eq("id", m.id);
    fetchAll();
  };

  const moveMaterial = async (m: Material, dir: -1 | 1) => {
    const siblings = materials.filter((x) => x.section_id === m.section_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((s) => s.id === m.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("learning_materials").update({ sort_order: swap.sort_order }).eq("id", m.id),
      supabase.from("learning_materials").update({ sort_order: siblings[idx].sort_order }).eq("id", swap.id),
    ]);
    fetchAll();
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (m: Material) => { setEditing(m); setShowForm(true); };

  return (
    <div className="space-y-6">
      {/* Sections manager */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-display text-base font-semibold mb-3">Sezioni</h3>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nuova sezione (es. Video dimostrativi)"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createSection()}
            className="font-body"
          />
          <Button onClick={createSection} className="font-body shrink-0">
            <Plus size={16} className="mr-1" /> Crea sezione
          </Button>
        </div>
        {sections.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground italic">Nessuna sezione creata. Crea la prima per iniziare.</p>
        ) : (
          <div className="space-y-2">
            {[...sections].sort((a, b) => a.sort_order - b.sort_order).map((s, i, arr) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border">
                <div className="flex flex-col">
                  <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30 hover:text-foreground text-xs">▲</button>
                  <button onClick={() => moveSection(s.id, 1)} disabled={i === arr.length - 1} className="text-muted-foreground disabled:opacity-30 hover:text-foreground text-xs">▼</button>
                </div>
                <span className="font-body text-sm text-foreground flex-1">{s.name}</span>
                <span className="font-body text-[11px] text-muted-foreground">{materials.filter((m) => m.section_id === s.id).length} materiali</span>
                <Button variant="ghost" size="icon" onClick={() => deleteSection(s.id)} className="text-destructive h-8 w-8">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Materials list */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold">Materiali</h3>
          <Button onClick={openNew} disabled={sections.length === 0} className="font-body">
            <Plus size={16} className="mr-1" /> Nuovo materiale
          </Button>
        </div>

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Caricamento…</p>
        ) : sections.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground italic">Crea prima una sezione per poter caricare materiali.</p>
        ) : (
          <div className="space-y-6">
            {[...sections].sort((a, b) => a.sort_order - b.sort_order).map((section) => {
              const items = materials.filter((m) => m.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div key={section.id}>
                  <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">{section.name}</h4>
                  {items.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground italic pl-3">Nessun materiale in questa sezione.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((m, i, arr) => {
                        const Icon = TYPE_META[m.content_type].icon;
                        return (
                          <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 border border-border">
                            <div className="flex flex-col">
                              <button onClick={() => moveMaterial(m, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30 text-xs">▲</button>
                              <button onClick={() => moveMaterial(m, 1)} disabled={i === arr.length - 1} className="text-muted-foreground disabled:opacity-30 text-xs">▼</button>
                            </div>
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon size={15} className="text-petrolio" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm text-foreground truncate">
                                <span className="text-muted-foreground text-[11px] mr-1.5">#{m.sort_order}</span>
                                {m.title}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {m.allowed_plans.map((p) => (
                                  <span key={p} className="font-body text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-petrolio">{PLAN_LABEL[p]}</span>
                                ))}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => togglePublish(m)} className="h-8 w-8" title={m.is_published ? "Pubblicato — clicca per nascondere" : "Nascosto — clicca per pubblicare"}>
                              {m.is_published ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} className="text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(m)} className="h-8 w-8">
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMaterial(m)} className="h-8 w-8 text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <MaterialForm
          sections={sections}
          existing={editing}
          existingCountForSection={(sectionId) => materials.filter((m) => m.section_id === sectionId).length}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAll(); }}
        />
      )}
    </div>
  );
};

// ============================================================
// Material form (modal-like inline panel)
// ============================================================
const MaterialForm = ({
  sections,
  existing,
  existingCountForSection,
  onClose,
  onSaved,
}: {
  sections: Section[];
  existing: Material | null;
  existingCountForSection: (id: string) => number;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [sectionId, setSectionId] = useState(existing?.section_id ?? sections[0]?.id ?? "");
  const [contentType, setContentType] = useState<ContentType>(existing?.content_type ?? "video_link");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");
  const [articleContent, setArticleContent] = useState(existing?.article_content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [plans, setPlans] = useState<Plan[]>(existing?.allowed_plans ?? ["base", "pro", "platinum"]);
  const [sortOrder, setSortOrder] = useState(existing?.sort_order ?? existingCountForSection(sections[0]?.id ?? ""));
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? true);
  const [saving, setSaving] = useState(false);

  const togglePlan = (p: Plan) =>
    setPlans((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleSave = async () => {
    if (!title.trim() || !sectionId) {
      toast({ title: "Compila titolo e sezione", variant: "destructive" });
      return;
    }
    if (plans.length === 0) {
      toast({ title: "Seleziona almeno un piano", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let file_path = existing?.file_path ?? null;
      let file_size = existing?.file_size ?? null;
      let file_mime = null as string | null;

      if ((contentType === "pdf" || contentType === "video_upload") && file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${sectionId}/${Date.now()}-${slugify(title)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("learning-materials").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        file_path = path;
        file_size = file.size;
        file_mime = file.type;
      }

      const payload = {
        section_id: sectionId,
        title: title.trim(),
        description: description.trim() || null,
        content_type: contentType,
        video_url: contentType === "video_link" ? (videoUrl.trim() || null) : null,
        article_content: contentType === "article" ? (articleContent.trim() || null) : null,
        file_path,
        file_size,
        file_mime,
        allowed_plans: plans,
        sort_order: sortOrder,
        is_published: isPublished,
      };

      if (existing) {
        const { error } = await supabase.from("learning_materials").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast({ title: "Materiale aggiornato" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("learning_materials").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
        toast({ title: "Materiale creato" });
      }
      onSaved();
    } catch (e) {
      toast({ title: "Errore", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-elevated max-w-2xl w-full my-8 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{existing ? "Modifica materiale" : "Nuovo materiale"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="space-y-2">
          <Label className="font-body">Titolo *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-body" />
        </div>

        <div className="space-y-2">
          <Label className="font-body">Descrizione</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="font-body" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-body">Sezione *</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-body">Ordine nella sezione</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="font-body" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-body">Tipo di contenuto *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(TYPE_META) as ContentType[]).map((t) => {
              const Icon = TYPE_META[t].icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setContentType(t)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-md border transition-all text-xs font-body ${
                    contentType === t ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon size={18} />
                  {TYPE_META[t].label}
                </button>
              );
            })}
          </div>
        </div>

        {contentType === "video_link" && (
          <div className="space-y-2">
            <Label className="font-body">URL del video (YouTube / Vimeo)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="font-body" />
          </div>
        )}

        {(contentType === "video_upload" || contentType === "pdf") && (
          <div className="space-y-2">
            <Label className="font-body">
              File {existing?.file_path ? "(lascia vuoto per mantenere quello attuale)" : "*"}
            </Label>
            <Input
              type="file"
              accept={contentType === "pdf" ? "application/pdf,.pdf,.doc,.docx" : "video/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="font-body"
            />
            {existing?.file_path && (
              <p className="font-body text-[11px] text-muted-foreground truncate">Attuale: {existing.file_path}</p>
            )}
          </div>
        )}

        {contentType === "article" && (
          <div className="space-y-2">
            <Label className="font-body">Contenuto (markdown supportato)</Label>
            <Textarea value={articleContent} onChange={(e) => setArticleContent(e.target.value)} rows={8} className="font-body font-mono text-sm" />
          </div>
        )}

        <div className="space-y-2">
          <Label className="font-body">Piani abilitati *</Label>
          <div className="flex flex-wrap gap-3">
            {(["base", "pro", "platinum"] as Plan[]).map((p) => (
              <label key={p} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card cursor-pointer hover:border-primary/40">
                <Checkbox checked={plans.includes(p)} onCheckedChange={() => togglePlan(p)} />
                <span className="font-body text-sm">{PLAN_LABEL[p]}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isPublished} onCheckedChange={(v) => setIsPublished(!!v)} />
          <span className="font-body text-sm">Pubblicato (visibile agli utenti)</span>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose} className="font-body">Annulla</Button>
          <Button onClick={handleSave} disabled={saving} className="font-body">
            <Save size={16} className="mr-1" /> {saving ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLibrary;
