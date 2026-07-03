import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video, FileText, Link2, BookOpen, Play, Download, ChevronDown, Crown, Star, User as UserIcon, Lock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Plan = "base" | "pro" | "platinum";
type ContentType = "video_link" | "video_upload" | "pdf" | "article";

interface Section {
  id: string;
  name: string;
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

const PLAN_META: Record<Plan, { label: string; icon: typeof UserIcon; className: string }> = {
  base: { label: "Base", icon: UserIcon, className: "text-muted-foreground bg-muted" },
  pro: { label: "Pro", icon: Star, className: "text-petrolio bg-primary/10" },
  platinum: { label: "Platinum", icon: Crown, className: "text-gold bg-gold/15" },
};

const TYPE_ICON: Record<ContentType, typeof Video> = {
  video_link: Link2,
  video_upload: Video,
  pdf: FileText,
  article: BookOpen,
};

const embedUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return url;
  } catch { return null; }
};



const videoThumbnail = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://i.ytimg.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://vumbnail.com/${id}.jpg` : null;
    }
    return null;
  } catch { return null; }
};

/** Card thumbnail that lazily requests a signed URL for uploaded videos and PDFs
 *  so the browser can render the first frame / first page as a preview. */
const MaterialThumb = ({ material }: { material: Material }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (material.content_type === "video_link" && material.video_url) {
      setUrl(videoThumbnail(material.video_url));
      return;
    }
    if ((material.content_type === "video_upload" || material.content_type === "pdf") && material.file_path) {
      supabase.storage.from("learning-materials").createSignedUrl(material.file_path, 600).then(({ data }) => {
        if (!cancelled && data?.signedUrl) setUrl(data.signedUrl);
      });
    }
    return () => { cancelled = true; };
  }, [material]);

  const Icon = TYPE_ICON[material.content_type];

  if (material.content_type === "article") {
    return (
      <div className="relative aspect-video rounded-md overflow-hidden bg-gradient-to-br from-petrolio via-petrolio-dark to-gold/60 flex items-center justify-center">
        <BookOpen size={32} className="text-cream/90" />
        <span className="absolute bottom-2 left-2 font-body text-[10px] uppercase tracking-widest text-cream/80 font-semibold">Articolo</span>
      </div>
    );
  }

  if (material.content_type === "pdf") {
    return (
      <div className="relative aspect-video rounded-md overflow-hidden bg-muted/40 border border-border">
        {url ? (
          <object data={`${url}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" className="w-full h-full pointer-events-none">
            <div className="flex items-center justify-center h-full">
              <FileText size={32} className="text-red-500/70" />
            </div>
          </object>
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileText size={32} className="text-red-500/70" />
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 font-body text-[10px] uppercase tracking-wider bg-card/90 text-foreground px-1.5 py-0.5 rounded">PDF</span>
      </div>
    );
  }

  // video_link or video_upload
  return (
    <div className="relative aspect-video rounded-md overflow-hidden bg-black group/thumb">
      {url ? (
        material.content_type === "video_upload" ? (
          <video
            src={`${url}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon size={28} className="text-cream/60" />
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-black/10 to-transparent">
        <div className="w-11 h-11 rounded-full bg-cream/95 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
          <Play size={18} className="text-petrolio fill-petrolio ml-0.5" />
        </div>
      </div>
    </div>
  );
};


const LibraryTab = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [plan, setPlan] = useState<Plan>("base");
  const [loading, setLoading] = useState(true);
  const [openMaterial, setOpenMaterial] = useState<Material | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.rpc("get_user_plan", { _user_id: user.id });
        if (p) setPlan(p as Plan);
      }

      const [sRes, mRes] = await Promise.all([
        supabase.from("material_sections").select("*").order("sort_order").order("name"),
        supabase.from("learning_materials").select("*").eq("is_published", true).order("sort_order"),
      ]);
      if (sRes.data) {
        setSections(sRes.data as Section[]);
        const exp: Record<string, boolean> = {};
        (sRes.data as Section[]).forEach((s) => { exp[s.id] = true; });
        setExpanded(exp);
      }
      if (mRes.data) setMaterials(mRes.data as Material[]);
      setLoading(false);
    })();
  }, []);

  const openContent = async (m: Material) => {
    setOpenMaterial(m);
    setMediaUrl(null);
    if (m.content_type === "video_upload" || m.content_type === "pdf") {
      if (m.file_path) {
        const { data } = await supabase.storage.from("learning-materials").createSignedUrl(m.file_path, 600);
        if (data?.signedUrl) setMediaUrl(data.signedUrl);
      }
    } else if (m.content_type === "video_link" && m.video_url) {
      setMediaUrl(embedUrl(m.video_url));
    }
  };

  const download = async (m: Material) => {
    if (!m.file_path) return;
    const { data } = await supabase.storage.from("learning-materials").createSignedUrl(m.file_path, 120);
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = m.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const currentPlan = PLAN_META[plan];
  const CurrentIcon = currentPlan.icon;

  if (loading) return <p className="font-body text-sm text-muted-foreground">Caricamento libreria…</p>;

  const visibleSections = sections.filter((s) => materials.some((m) => m.section_id === s.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Libreria contenuti</h2>
          <p className="font-body text-sm text-muted-foreground">
            Video, protocolli, articoli e materiali riservati agli iscritti.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${currentPlan.className}`}>
          <CurrentIcon size={14} />
          <span className="font-body text-xs font-semibold uppercase tracking-wider">Piano {currentPlan.label}</span>
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-10 text-center">
          <p className="font-body text-muted-foreground">Nessun contenuto disponibile per il tuo piano al momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleSections.map((section) => {
            const items = materials.filter((m) => m.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
            const isOpen = expanded[section.id] !== false;
            return (
              <section key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [section.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen size={16} className="text-petrolio" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{section.name}</h3>
                      <p className="font-body text-xs text-muted-foreground">{items.length} contenuti</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-border grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted/10">
                    {items.map((m) => {
                      const Icon = TYPE_ICON[m.content_type];
                      return (
                        <button
                          key={m.id}
                          onClick={() => openContent(m)}
                          className="group text-left bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary/15 to-gold/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                              <Icon size={18} className="text-petrolio" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-display text-sm font-semibold text-foreground leading-snug line-clamp-2">{m.title}</h4>
                              {m.description && (
                                <p className="font-body text-xs text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 font-body text-[11px] text-primary font-semibold">
                                {m.content_type === "pdf" ? <><Download size={11} /> Apri / scarica</> : <><Play size={11} /> Apri</>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Viewer modal */}
      {openMaterial && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-elevated max-w-4xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-foreground truncate">{openMaterial.title}</h3>
                {openMaterial.description && (
                  <p className="font-body text-xs text-muted-foreground line-clamp-1">{openMaterial.description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpenMaterial(null)}><X size={18} /></Button>
            </div>

            <div className="p-5">
              {openMaterial.content_type === "article" ? (
                <div className="prose prose-sm max-w-none font-body whitespace-pre-wrap text-foreground">
                  {openMaterial.article_content}
                </div>
              ) : openMaterial.content_type === "pdf" ? (
                mediaUrl ? (
                  <div className="space-y-3">
                    <iframe src={mediaUrl} className="w-full h-[70vh] rounded-md border border-border" title={openMaterial.title} />
                    <Button onClick={() => download(openMaterial)} variant="outline" className="font-body">
                      <Download size={14} className="mr-2" /> Scarica il file
                    </Button>
                  </div>
                ) : <p className="font-body text-sm text-muted-foreground">Caricamento file…</p>
              ) : openMaterial.content_type === "video_upload" ? (
                mediaUrl ? (
                  <video src={mediaUrl} controls className="w-full rounded-md" />
                ) : <p className="font-body text-sm text-muted-foreground">Caricamento video…</p>
              ) : openMaterial.content_type === "video_link" ? (
                mediaUrl ? (
                  <div className="space-y-2">
                    <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
                      <iframe src={mediaUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" title={openMaterial.title} />
                    </div>
                    {openMaterial.video_url && (
                      <a href={openMaterial.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-xs text-primary hover:underline">
                        <ExternalLink size={11} /> Apri sulla piattaforma originale
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="font-body text-sm text-muted-foreground flex items-center gap-2"><Lock size={14} /> Video non disponibile.</p>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryTab;
