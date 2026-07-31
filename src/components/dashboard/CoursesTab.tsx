import { Calendar, MapPin, FileText, Play, Monitor, Brain, Image as ImageIcon, FileSpreadsheet, File, Lock, CheckCircle2, Clock, X, Eye, PlayCircle, BookOpen, Link2, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo, useRef } from "react";

interface CourseEdition {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  status: string;
  type: string;
}

interface CourseMaterial {
  id: string;
  edition_id: string;
  file_name: string;
  file_path: string | null;
  file_size: number | null;
  module_id: string | null;
  description: string | null;
  sort_order: number;
  material_type?: "file" | "link" | "image" | null;
  external_url?: string | null;
}

interface CourseModule {
  id: string;
  edition_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface CoursesTabProps {
  editions: CourseEdition[];
  materials: CourseMaterial[];
  modules: CourseModule[];
  onDownload?: (material: CourseMaterial) => void; // legacy, ignored
}

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() || "";
const isVideo = (name: string) => ["mp4", "webm", "mov", "m4v", "ogv"].includes(extOf(name));
const isImage = (name: string) => ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extOf(name));
const isPdf = (name: string) => extOf(name) === "pdf";
const isAudio = (name: string) => ["mp3", "wav", "m4a", "ogg", "aac"].includes(extOf(name));
const isOffice = (name: string) => ["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(extOf(name));

const getFileIcon = (name: string) => {
  if (isVideo(name)) return PlayCircle;
  if (isImage(name)) return ImageIcon;
  if (isPdf(name)) return FileText;
  if (["xls", "xlsx", "csv"].includes(extOf(name))) return FileSpreadsheet;
  return File;
};

const getAccent = (name: string) => {
  if (isVideo(name)) return { chip: "bg-petrolio/10 text-petrolio border-petrolio/20", icon: "text-petrolio bg-petrolio/10", label: "Video" };
  if (isPdf(name)) return { chip: "bg-red-500/10 text-red-600 border-red-500/20", icon: "text-red-600 bg-red-50 dark:bg-red-950/30", label: "PDF" };
  if (isImage(name)) return { chip: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", label: "Immagine" };
  if (isAudio(name)) return { chip: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: "text-purple-600 bg-purple-50 dark:bg-purple-950/30", label: "Audio" };
  if (["xls", "xlsx", "csv"].includes(extOf(name))) return { chip: "bg-green-500/10 text-green-700 border-green-500/20", icon: "text-green-700 bg-green-50 dark:bg-green-950/30", label: "Foglio" };
  if (["doc", "docx"].includes(extOf(name))) return { chip: "bg-sky-500/10 text-sky-700 border-sky-500/20", icon: "text-sky-700 bg-sky-50 dark:bg-sky-950/30", label: "Documento" };
  return { chip: "bg-muted text-muted-foreground border-border", icon: "text-muted-foreground bg-muted/50", label: extOf(name).toUpperCase() || "File" };
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

/* ---------------- Office preview (with fallback) ---------------- */
const OfficePreview = ({ url, name }: { url: string; name: string }) => {
  const [engine, setEngine] = useState<"ms" | "gdocs" | "failed">("ms");
  const [loaded, setLoaded] = useState(false);

  // If viewer doesn't load within 8s, try next engine.
  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => {
      if (!loaded) {
        setEngine((prev) => (prev === "ms" ? "gdocs" : prev === "gdocs" ? "failed" : "failed"));
      }
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const src =
    engine === "ms"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      : engine === "gdocs"
      ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
      : "";

  return (
    <div className="w-full h-[80vh] bg-white relative flex flex-col">
      {engine !== "failed" ? (
        <iframe
          key={engine}
          src={src}
          title={name}
          className="w-full flex-1 bg-white"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <FileText size={40} className="text-muted-foreground" />
          <p className="font-body text-sm text-foreground">Anteprima non disponibile per questo file.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-petrolio text-white font-body text-sm font-semibold hover:bg-petrolio/90 transition-colors"
          >
            <ExternalLink size={14} /> Apri in nuova scheda
          </a>
        </div>
      )}
      <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
        <p className="font-body text-[11px] text-muted-foreground">
          Se la preview non si carica, apri il file in una nuova scheda.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-card font-body text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink size={12} /> Apri
        </a>
      </div>
    </div>
  );
};

/* ---------------- Video progress (localStorage) ---------------- */
const progressKey = (userId: string, materialId: string) => `video-progress:${userId}:${materialId}`;
const getSavedProgress = (userId: string, materialId: string): { t: number; d: number } | null => {
  try {
    const raw = localStorage.getItem(progressKey(userId, materialId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.t === "number") return parsed;
  } catch { /* noop */ }
  return null;
};
const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const ResumableVideo = ({
  src,
  materialId,
  name,
  nextName,
  onNext,
}: {
  src: string;
  materialId: string;
  name: string;
  nextName?: string | null;
  onNext?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const lastSaveRef = useRef(0);

  // Auto-advance countdown
  useEffect(() => {
    if (countdown == null) return;
    if (countdown <= 0) {
      setCountdown(null);
      onNext?.();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Reset state when switching video
  useEffect(() => {
    setCountdown(null);
    setShowBanner(false);
  }, [materialId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const saved = getSavedProgress(userId, materialId);
    if (saved && saved.t > 5) setResumeAt(saved.t);
  }, [userId, materialId]);

  const appliedRef = useRef(false);
  const applyResume = () => {
    const v = videoRef.current;
    if (!v || appliedRef.current || resumeAt == null) return;
    // Wait for metadata (duration) before seeking
    if (!v.duration || !isFinite(v.duration)) return;
    if (resumeAt < v.duration - 10) {
      try { v.currentTime = resumeAt; } catch { /* noop */ }
      appliedRef.current = true;
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    } else {
      appliedRef.current = true;
    }
  };

  // Re-apply when resumeAt arrives after metadata is already loaded
  useEffect(() => {
    if (resumeAt == null) return;
    const v = videoRef.current;
    if (v && v.readyState >= 1) applyResume();
  }, [resumeAt]);

  const onLoadedMetadata = () => applyResume();

  const saveNow = (force = false) => {
    const v = videoRef.current;
    if (!v || !userId) return;
    if (!isFinite(v.currentTime) || v.currentTime < 1) return;
    const now = Date.now();
    if (!force && now - lastSaveRef.current < 3000) return;
    lastSaveRef.current = now;
    try {
      localStorage.setItem(progressKey(userId, materialId), JSON.stringify({ t: v.currentTime, d: v.duration || 0 }));
    } catch { /* quota */ }
  };

  const onTimeUpdate = () => saveNow(false);

  const onEnded = () => {
    if (userId) {
      try { localStorage.removeItem(progressKey(userId, materialId)); } catch { /* noop */ }
    }
    if (onNext) setCountdown(5);
  };

  // Flush on unmount / tab hide / page unload — so closing the modal saves the position.
  useEffect(() => {
    const flush = () => saveNow(true);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, materialId]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {showBanner && resumeAt != null && countdown == null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-petrolio text-white font-body text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
          Ripreso da {formatTime(resumeAt)}
        </div>
      )}
      {countdown != null && onNext && (
        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in">
          <p className="font-body text-xs uppercase tracking-widest text-white/60">Prossimo video tra {countdown}s</p>
          <p className="font-display text-lg font-semibold text-white max-w-md line-clamp-2">
            {(nextName || "").replace(/\.[^.]+$/, "")}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setCountdown(null); onNext(); }}
              className="font-body text-sm font-semibold px-5 py-2 rounded-full bg-petrolio text-white hover:opacity-90 transition"
            >
              Riproduci ora
            </button>
            <button
              type="button"
              onClick={() => setCountdown(null)}
              className="font-body text-sm px-5 py-2 rounded-full border border-white/30 text-white/80 hover:bg-white/10 transition"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPause={() => saveNow(true)}
        onEnded={onEnded}
        onContextMenu={(e) => e.preventDefault()}
        title={name}
        className="max-h-[80vh] w-full bg-black"
      />
    </div>
  );
};

/* ---------------- In-app viewer (no download) ---------------- */
const MaterialViewer = ({ material, onClose }: { material: CourseMaterial; onClose: () => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLink = material.material_type === "link";
  const isExtImage = material.material_type === "image";
  const accent = isLink
    ? { chip: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: "text-amber-700 bg-amber-50 dark:bg-amber-950/30", label: "Link" }
    : isExtImage
    ? { chip: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", label: "Immagine" }
    : getAccent(material.file_name);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isLink || isExtImage) {
        setUrl(material.external_url || null);
        if (!material.external_url) setError("URL non disponibile.");
        return;
      }
      if (!material.file_path) { setError("File non disponibile."); return; }
      const { data, error } = await supabase.storage
        .from("course-materials")
        .createSignedUrl(material.file_path, 3600);
      if (cancelled) return;
      if (error || !data?.signedUrl) setError("Impossibile caricare il materiale.");
      else setUrl(data.signedUrl);
    })();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { cancelled = true; window.removeEventListener("keydown", onKey); };
  }, [material.file_path, material.external_url, isLink, isExtImage, onClose]);

  const blockCtx = (e: React.MouseEvent) => e.preventDefault();
  const HeaderIcon = isLink ? Link2 : isExtImage ? ImageIcon : getFileIcon(material.file_name);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={blockCtx}
      >
        <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent.icon}`}>
            <HeaderIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-foreground truncate">{material.file_name}</p>
            {material.description && (
              <p className="font-body text-[11px] text-muted-foreground truncate">{material.description}</p>
            )}
          </div>
          {isLink && url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-petrolio text-white font-body text-xs font-semibold hover:bg-petrolio/90 transition-colors"
            >
              <ExternalLink size={12} /> Apri
            </a>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 min-h-0 bg-black/95 flex items-center justify-center overflow-auto" onContextMenu={blockCtx}>
          {error ? (
            <p className="font-body text-sm text-white/80 p-8">{error}</p>
          ) : !url ? (
            <div className="flex flex-col items-center gap-3 p-8">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="font-body text-xs text-white/60">Caricamento…</p>
            </div>
          ) : isExtImage ? (
            <img src={url} alt={material.file_name} className="max-h-[80vh] max-w-full object-contain select-none pointer-events-none" draggable={false} />
          ) : isLink ? (
            <div className="p-10 text-center max-w-lg">
              <Link2 size={40} className="mx-auto mb-4 text-white/60" />
              <p className="font-body text-sm text-white/90 mb-2">Risorsa esterna</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-petrolio break-all underline hover:text-white transition-colors"
              >
                {url}
              </a>
            </div>
          ) : isVideo(material.file_name) ? (
            <ResumableVideo src={url} materialId={material.id} name={material.file_name} />
          ) : isAudio(material.file_name) ? (
            <div className="p-10 w-full max-w-lg">
              <audio src={url} controls controlsList="nodownload" className="w-full" />
            </div>
          ) : isImage(material.file_name) ? (
            <img src={url} alt={material.file_name} className="max-h-[80vh] max-w-full object-contain select-none pointer-events-none" draggable={false} />
          ) : isPdf(material.file_name) ? (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              title={material.file_name}
              className="w-full h-[80vh] bg-white"
            />
          ) : isOffice(material.file_name) ? (
            <OfficePreview url={url} name={material.file_name} />
          ) : (extOf(material.file_name) === "txt" || extOf(material.file_name) === "md") ? (
            <iframe
              src={url}
              title={material.file_name}
              className="w-full h-[80vh] bg-white"
            />
          ) : (
            <div className="p-10 text-center">
              <Lock size={32} className="mx-auto mb-3 text-white/40" />
              <p className="font-body text-sm text-white/80 mb-1">Anteprima non disponibile per questo formato.</p>
              <p className="font-body text-xs text-white/50">Il file è consultabile solo dall'amministratore del corso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Material tile ---------------- */
const MaterialTile = ({ material, index, onOpen }: { material: CourseMaterial; index: number; onOpen: (m: CourseMaterial) => void }) => {
  const isLink = material.material_type === "link";
  const isExtImage = material.material_type === "image";
  const Icon = isLink ? Link2 : isExtImage ? ImageIcon : getFileIcon(material.file_name);
  const accent = isLink
    ? { chip: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: "text-amber-700 bg-amber-50 dark:bg-amber-950/30", label: "Link" }
    : isExtImage
    ? { chip: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", label: "Immagine" }
    : getAccent(material.file_name);
  const video = !isLink && !isExtImage && isVideo(material.file_name);
  const displayTitle = isLink || isExtImage ? material.file_name : material.file_name.replace(/\.[^.]+$/, "");
  const displayMeta = material.description || (isLink ? material.external_url : (!isExtImage ? formatSize(material.file_size) : null));

  return (
    <button
      type="button"
      onClick={() => onOpen(material)}
      className="group relative flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-petrolio/40 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full"
    >
      <div className={`relative w-12 h-12 shrink-0 rounded-lg flex items-center justify-center overflow-hidden ${accent.icon}`}>
        {isExtImage && material.external_url ? (
          <img src={material.external_url} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <Icon size={22} />
        )}
        {video && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-petrolio text-white flex items-center justify-center shadow-md ring-2 ring-card">
            <Play size={10} fill="currentColor" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-body text-[10px] font-bold text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <span className={`inline-flex font-body text-[10px] font-semibold px-1.5 py-0.5 rounded border ${accent.chip}`}>
            {accent.label}
          </span>
        </div>
        <p className="font-body text-sm text-foreground truncate leading-tight" title={material.file_name}>
          {displayTitle}
        </p>
        {displayMeta && (
          <p className="font-body text-[11px] text-muted-foreground truncate mt-0.5">
            {displayMeta}
          </p>
        )}
      </div>
      <span className="shrink-0 w-8 h-8 rounded-full bg-muted group-hover:bg-petrolio group-hover:text-white flex items-center justify-center transition-colors">
        {isLink ? <ExternalLink size={14} /> : <Eye size={14} />}
      </span>
    </button>
  );
};

/* ---------------- Edition card ---------------- */
const EditionCard = ({
  edition,
  materials,
  modules,
  hasAccess,
  accessLoading,
  isPast,
  onOpen,
}: {
  edition: CourseEdition;
  materials: CourseMaterial[];
  modules: CourseModule[];
  hasAccess: boolean;
  accessLoading: boolean;
  isPast: boolean;
  onOpen: (m: CourseMaterial) => void;
}) => {
  const dateObj = new Date(edition.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("it-IT", { month: "short" }).toUpperCase().replace(".", "");
  const year = dateObj.getFullYear();

  const editionModules = modules.filter((m) => m.edition_id === edition.id).sort((a, b) => a.sort_order - b.sort_order);
  const orphans = materials.filter((m) => m.edition_id === edition.id && !m.module_id);
  const videoCount = materials.filter((m) => isVideo(m.file_name)).length;
  const totalCount = materials.length;

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-petrolio/30 transition-all">
      <div className="flex items-stretch">
        <div className={`shrink-0 w-24 sm:w-28 flex flex-col items-center justify-center py-4 border-r border-border ${isPast ? "bg-muted/40" : "bg-gradient-to-br from-petrolio/15 via-petrolio/5 to-gold/10"}`}>
          <span className={`font-body text-[10px] uppercase tracking-widest font-semibold ${isPast ? "text-muted-foreground" : "text-petrolio"}`}>{month}</span>
          <span className="font-display text-4xl font-bold text-foreground leading-none my-1">{day}</span>
          <span className="font-body text-xs text-muted-foreground">{year}</span>
        </div>

        <div className="flex-1 p-5 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground leading-tight">{edition.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                {edition.location && (
                  <p className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                    <MapPin size={12} /> {edition.location}
                  </p>
                )}
                {hasAccess && totalCount > 0 && (
                  <>
                    <p className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                      <BookOpen size={12} /> {totalCount} {totalCount === 1 ? "materiale" : "materiali"}
                    </p>
                    {videoCount > 0 && (
                      <p className="flex items-center gap-1.5 font-body text-xs text-petrolio font-semibold">
                        <PlayCircle size={12} /> {videoCount} video
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
              isPast ? "bg-primary/10 text-petrolio" : "bg-gold/15 text-gold"
            }`}>
              {isPast ? <><CheckCircle2 size={11} /> Completato</> : <><Clock size={11} /> In programma</>}
            </span>
          </div>

          {edition.description && (
            <p className="font-body text-sm text-muted-foreground line-clamp-2 mb-3">{edition.description}</p>
          )}

          {accessLoading ? (
            <p className="font-body text-xs text-muted-foreground italic mt-3">Verifica accesso…</p>
          ) : hasAccess ? (
            totalCount > 0 || editionModules.length > 0 ? (
              <div className="mt-4 space-y-5">
                {editionModules.map((mod, idx) => {
                  const modMats = materials.filter((m) => m.module_id === mod.id).sort((a, b) => a.sort_order - b.sort_order);
                  if (modMats.length === 0 && !mod.description) return null;
                  return (
                    <div key={mod.id} className="rounded-xl bg-gradient-to-br from-muted/40 to-transparent border border-border/60 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-petrolio text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-[10px] font-bold text-petrolio tracking-widest">MODULO</span>
                            <span className="font-body text-[10px] text-muted-foreground">·</span>
                            <span className="font-body text-[10px] text-muted-foreground">{modMats.length} {modMats.length === 1 ? "lezione" : "lezioni"}</span>
                          </div>
                          <h4 className="font-display text-base font-semibold text-foreground leading-tight">{mod.title}</h4>
                        </div>
                      </div>
                      {mod.description && (
                        <p className="font-body text-xs text-muted-foreground mb-3 pl-11">{mod.description}</p>
                      )}
                      {modMats.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {modMats.map((m, i) => <MaterialTile key={m.id} material={m} index={i} onOpen={onOpen} />)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {orphans.length > 0 && (
                  <div className={editionModules.length > 0 ? "rounded-xl border border-dashed border-border p-4" : ""}>
                    {editionModules.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={12} className="text-muted-foreground" />
                        <span className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Altri materiali · {orphans.length}
                        </span>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-2">
                      {orphans.sort((a, b) => a.sort_order - b.sort_order).map((m, i) => <MaterialTile key={m.id} material={m} index={i} onOpen={onOpen} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-body text-xs text-muted-foreground italic mt-3">
                Nessun materiale caricato per questa edizione.
              </p>
            )
          ) : (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border">
              <Lock size={13} className="text-muted-foreground shrink-0" />
              <p className="font-body text-xs text-muted-foreground">Accesso riservato agli iscritti</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const CoursesTab = ({ editions, materials, modules }: CoursesTabProps) => {
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [accessLoading, setAccessLoading] = useState(true);
  const [viewing, setViewing] = useState<CourseMaterial | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || editions.length === 0) {
        setAccessLoading(false);
        return;
      }
      const results: Record<string, boolean> = {};
      await Promise.all(
        editions.map(async (edition) => {
          const { data } = await supabase.rpc("has_course_access", {
            _user_id: user.id,
            _edition_id: edition.id,
          });
          results[edition.id] = data === true;
        })
      );
      setAccessMap(results);
      setAccessLoading(false);
    };
    checkAccess();
  }, [editions]);

  const now = useMemo(() => Date.now(), []);

  const renderList = (type: "live" | "webinar") => {
    const typeEditions = editions.filter((e) => (e.type || "live") === type);
    const upcoming = typeEditions
      .filter((e) => new Date(e.date).getTime() >= now && e.status !== "completed")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = typeEditions
      .filter((e) => !upcoming.includes(e))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (typeEditions.length === 0) {
      return (
        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-10 text-center">
          <p className="font-body text-muted-foreground">
            Nessun {type === "live" ? "corso live" : "webinar"} disponibile al momento.
          </p>
        </div>
      );
    }

    const Section = ({ title, count, items, isPast }: { title: string; count: number; items: CourseEdition[]; isPast: boolean }) =>
      items.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-body text-xs uppercase tracking-[0.15em] font-semibold text-muted-foreground">{title}</h3>
            <span className="font-body text-xs text-muted-foreground">·</span>
            <span className="font-body text-xs text-muted-foreground">{count}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid gap-3">
            {items.map((edition) => (
              <EditionCard
                key={edition.id}
                edition={edition}
                materials={materials.filter((m) => m.edition_id === edition.id)}
                modules={modules}
                hasAccess={accessMap[edition.id] ?? false}
                accessLoading={accessLoading}
                isPast={isPast}
                onOpen={setViewing}
              />
            ))}
          </div>
        </section>
      ) : null;

    return (
      <div className="space-y-8">
        <Section title="Prossime edizioni" count={upcoming.length} items={upcoming} isPast={false} />
        <Section title="Edizioni passate" count={past.length} items={past} isPast={true} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-foreground">I tuoi corsi</h2>
        <p className="font-body text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          Consulta le edizioni a cui sei iscritto.
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-petrolio/10 text-petrolio font-semibold">
            <Lock size={10} /> Materiali fruibili solo online
          </span>
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-6 bg-muted/80 p-1 rounded-lg">
          <TabsTrigger value="live" className="flex items-center gap-2 px-5 py-2 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Monitor size={14} />
            Corsi Live
          </TabsTrigger>
          <TabsTrigger value="webinar" className="flex items-center gap-2 px-5 py-2 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Brain size={14} />
            Webinar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">{renderList("live")}</TabsContent>
        <TabsContent value="webinar">{renderList("webinar")}</TabsContent>
      </Tabs>

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default CoursesTab;
