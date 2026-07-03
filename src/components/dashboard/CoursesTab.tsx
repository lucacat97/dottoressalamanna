import { Calendar, MapPin, FileText, Download, Monitor, Brain, Image, FileSpreadsheet, File, Lock, CheckCircle2, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";

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
  file_path: string;
  file_size: number | null;
}

interface CoursesTabProps {
  editions: CourseEdition[];
  materials: CourseMaterial[];
  onDownload: (material: CourseMaterial) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf"].includes(ext)) return FileText;
  return File;
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "text-red-500 bg-red-50 dark:bg-red-950/30";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "text-blue-500 bg-blue-50 dark:bg-blue-950/30";
  if (["xls", "xlsx", "csv"].includes(ext)) return "text-green-600 bg-green-50 dark:bg-green-950/30";
  if (["doc", "docx"].includes(ext)) return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
  if (["ppt", "pptx"].includes(ext)) return "text-orange-500 bg-orange-50 dark:bg-orange-950/30";
  return "text-muted-foreground bg-muted/50";
};

const getFileExt = (fileName: string) => fileName.split(".").pop()?.toUpperCase() || "FILE";

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const MaterialThumbnail = ({ material, onDownload }: { material: CourseMaterial; onDownload: (m: CourseMaterial) => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ext = material.file_name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const Icon = getFileIcon(material.file_name);
  const colorClass = getFileColor(material.file_name);

  const handlePreview = async () => {
    if (isImage && !previewUrl) {
      const { data } = await supabase.storage.from("course-materials").createSignedUrl(material.file_path, 300);
      if (data?.signedUrl) setPreviewUrl(data.signedUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onDownload(material)}
      onMouseEnter={handlePreview}
      className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left w-full"
    >
      <div className={`w-11 h-11 shrink-0 rounded-md flex items-center justify-center overflow-hidden ${isImage && previewUrl ? "" : colorClass}`}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon size={20} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-foreground truncate" title={material.file_name}>
          {material.file_name}
        </p>
        <p className="font-body text-[11px] text-muted-foreground">
          {getFileExt(material.file_name)}{material.file_size ? ` · ${formatSize(material.file_size)}` : ""}
        </p>
      </div>
      <Download size={16} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
    </button>
  );
};

const EditionCard = ({
  edition,
  materials,
  hasAccess,
  accessLoading,
  isPast,
  onDownload,
}: {
  edition: CourseEdition;
  materials: CourseMaterial[];
  hasAccess: boolean;
  accessLoading: boolean;
  isPast: boolean;
  onDownload: (m: CourseMaterial) => void;
}) => {
  const dateObj = new Date(edition.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("it-IT", { month: "short" }).toUpperCase().replace(".", "");
  const year = dateObj.getFullYear();

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all">
      <div className="flex items-stretch">
        {/* Date badge */}
        <div className={`shrink-0 w-20 sm:w-24 flex flex-col items-center justify-center py-4 border-r border-border ${isPast ? "bg-muted/40" : "bg-gradient-to-br from-petrolio/10 to-gold/10"}`}>
          <span className={`font-body text-[10px] uppercase tracking-widest font-semibold ${isPast ? "text-muted-foreground" : "text-gold"}`}>{month}</span>
          <span className="font-display text-3xl font-bold text-foreground leading-none my-0.5">{day}</span>
          <span className="font-body text-xs text-muted-foreground">{year}</span>
        </div>

        <div className="flex-1 p-5 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground leading-tight">{edition.title}</h3>
              {edition.location && (
                <p className="flex items-center gap-1.5 mt-1 font-body text-xs text-muted-foreground">
                  <MapPin size={12} />
                  {edition.location}
                </p>
              )}
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

          {/* Materials block */}
          {accessLoading ? (
            <p className="font-body text-xs text-muted-foreground italic mt-3">Verifica accesso…</p>
          ) : hasAccess ? (
            materials.length > 0 ? (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={12} className="text-muted-foreground" />
                  <span className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Materiali · {materials.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {materials.map((m) => (
                    <MaterialThumbnail key={m.id} material={m} onDownload={onDownload} />
                  ))}
                </div>
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

const CoursesTab = ({ editions, materials, onDownload }: CoursesTabProps) => {
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [accessLoading, setAccessLoading] = useState(true);

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
                hasAccess={accessMap[edition.id] ?? false}
                accessLoading={accessLoading}
                isPast={isPast}
                onDownload={onDownload}
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
        <p className="font-body text-sm text-muted-foreground">
          Consulta le edizioni a cui sei iscritto e scarica i materiali didattici associati.
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
    </div>
  );
};

export default CoursesTab;
