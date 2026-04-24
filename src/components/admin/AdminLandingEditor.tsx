import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, Trash2, X, Image as ImageIcon, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import MarkdownEditor from "./MarkdownEditor";

interface CourseMedia {
  id: string;
  edition_id: string;
  media_type: "image" | "video";
  url: string;
  caption: string | null;
  sort_order: number;
}

interface Props {
  editionId: string;
  onClose: () => void;
}

const inputCls =
  "w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const AdminLandingEditor = ({ editionId, onClose }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    cover_image_url: "",
    long_description: "",
    agenda: "",
    objectives: "",
    price: "",
  });
  const [media, setMedia] = useState<CourseMedia[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");

  const reload = async () => {
    const [{ data: ed }, { data: m }] = await Promise.all([
      supabase.from("course_editions").select("cover_image_url, long_description, agenda, objectives, price").eq("id", editionId).maybeSingle(),
      supabase.from("course_media").select("*").eq("edition_id", editionId).order("sort_order"),
    ]);
    if (ed) {
      setForm({
        cover_image_url: ed.cover_image_url || "",
        long_description: ed.long_description || "",
        agenda: ed.agenda || "",
        objectives: ed.objectives || "",
        price: ed.price || "",
      });
    }
    setMedia((m || []) as CourseMedia[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [editionId]);

  const saveFields = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("course_editions")
      .update({
        cover_image_url: form.cover_image_url.trim() || null,
        long_description: form.long_description.trim() || null,
        agenda: form.agenda.trim() || null,
        objectives: form.objectives.trim() || null,
        price: form.price.trim() || null,
      })
      .eq("id", editionId);
    setSaving(false);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else toast({ title: "Salvato", description: "Landing aggiornata." });
  };

  const uploadFile = async (file: File, mediaType: "image" | "video") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${editionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("course-landings").upload(path, file);
    if (upErr) {
      toast({ title: "Errore upload", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return null;
    }
    const { data } = supabase.storage.from("course-landings").getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "image");
    if (url) setForm({ ...form, cover_image_url: url });
    e.target.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const url = await uploadFile(file, "image");
      if (url) {
        await supabase.from("course_media").insert({
          edition_id: editionId,
          media_type: "image",
          url,
          sort_order: media.length,
        });
      }
    }
    e.target.value = "";
    reload();
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "video");
    if (url) {
      await supabase.from("course_media").insert({
        edition_id: editionId,
        media_type: "video",
        url,
        caption: videoCaption.trim() || null,
        sort_order: media.length,
      });
      setVideoCaption("");
      reload();
    }
    e.target.value = "";
  };

  const addVideoLink = async () => {
    if (!videoUrl.trim()) return;
    await supabase.from("course_media").insert({
      edition_id: editionId,
      media_type: "video",
      url: videoUrl.trim(),
      caption: videoCaption.trim() || null,
      sort_order: media.length,
    });
    setVideoUrl("");
    setVideoCaption("");
    reload();
  };

  const deleteMedia = async (m: CourseMedia) => {
    await supabase.from("course_media").delete().eq("id", m.id);
    // Se il file è nello storage, prova a eliminarlo
    if (m.url.includes("/course-landings/")) {
      const path = m.url.split("/course-landings/")[1]?.split("?")[0];
      if (path) await supabase.storage.from("course-landings").remove([path]);
    }
    reload();
  };

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from("course_media").update({ caption }).eq("id", id);
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground font-body text-sm">Caricamento landing...</div>;
  }

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Editor Landing Page</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/corso/${editionId}`} target="_blank" rel="noreferrer" className="font-body">
              <ExternalLink size={14} className="mr-1" />Anteprima
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
      </div>

      {/* Cover */}
      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Immagine di copertina</label>
        {form.cover_image_url && (
          <img src={form.cover_image_url} alt="Cover" className="w-full max-w-md aspect-[16/9] object-cover rounded-md mb-2 border border-border" />
        )}
        <div className="flex gap-2 items-center">
          <input type="text" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="URL o carica un file" className={inputCls} />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploading} />
            <span className="inline-flex items-center gap-1 px-3 py-2.5 bg-muted hover:bg-muted/70 rounded-md font-body text-sm whitespace-nowrap"><Upload size={14} />{uploading ? "..." : "Upload"}</span>
          </label>
        </div>
      </div>

      {/* Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Prezzo / Quota</label>
          <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Es. €450 + IVA" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Descrizione estesa</label>
        <textarea rows={5} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} placeholder="Racconta il corso in dettaglio..." className={`${inputCls} resize-y`} />
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Obiettivi formativi</label>
        <textarea rows={4} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="Cosa imparerà il partecipante..." className={`${inputCls} resize-y`} />
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Programma / Agenda</label>
        <textarea rows={5} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} placeholder="Es.&#10;9:00 - Introduzione&#10;10:30 - ..." className={`${inputCls} resize-y`} />
      </div>

      <div className="flex justify-end">
        <Button onClick={saveFields} disabled={saving} className="bg-primary text-primary-foreground font-body">
          <Save size={14} className="mr-2" />{saving ? "Salvataggio..." : "Salva campi"}
        </Button>
      </div>

      {/* Galleria immagini */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2"><ImageIcon size={16} />Galleria foto ({images.length})</h4>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            <span className="inline-flex items-center gap-1 px-3 py-2 bg-petrolio text-primary-foreground rounded-md font-body text-sm hover:bg-accent">
              <Upload size={14} />{uploading ? "Caricamento..." : "Aggiungi foto"}
            </span>
          </label>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group border border-border rounded-md overflow-hidden">
                <img src={img.url} alt={img.caption || ""} className="w-full aspect-square object-cover" />
                <input
                  type="text"
                  defaultValue={img.caption || ""}
                  placeholder="Didascalia"
                  onBlur={(e) => updateCaption(img.id, e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-background border-t border-border focus:outline-none"
                />
                <button onClick={() => deleteMedia(img)} className="absolute top-1 right-1 p-1 bg-destructive/90 text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div className="border-t border-border pt-6">
        <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2 mb-3"><Video size={16} />Video ({videos.length})</h4>

        <div className="bg-muted/40 rounded-md p-4 mb-4 space-y-3">
          <p className="font-body text-xs text-muted-foreground">Aggiungi un link YouTube/Vimeo oppure carica un file video</p>
          <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
          <input type="text" value={videoCaption} onChange={(e) => setVideoCaption(e.target.value)} placeholder="Didascalia (opzionale)" className={inputCls} />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={addVideoLink} disabled={!videoUrl.trim()} size="sm" className="bg-primary text-primary-foreground font-body">
              <LinkIcon size={14} className="mr-1" />Aggiungi link
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploading} />
              <span className="inline-flex items-center gap-1 px-3 py-2 bg-muted hover:bg-muted/70 rounded-md font-body text-sm">
                <Upload size={14} />{uploading ? "Caricamento..." : "Carica video"}
              </span>
            </label>
          </div>
        </div>

        {videos.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {videos.map((v) => (
              <div key={v.id} className="border border-border rounded-md p-3 space-y-2">
                <p className="font-body text-xs text-muted-foreground truncate" title={v.url}>{v.url}</p>
                <input
                  type="text"
                  defaultValue={v.caption || ""}
                  placeholder="Didascalia"
                  onBlur={(e) => updateCaption(v.id, e.target.value)}
                  className={inputCls}
                />
                <Button onClick={() => deleteMedia(v)} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 size={12} className="mr-1" />Rimuovi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLandingEditor;
