import { Calendar, MapPin, FileText, Download, Monitor, Brain, Image, FileSpreadsheet, File, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

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

const getFileExt = (fileName: string) => {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
};

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

  const handlePreview = () => {
    if (isImage && !previewUrl) {
      const { data } = supabase.storage.from("course-materials").getPublicUrl(material.file_path);
      if (data?.publicUrl) setPreviewUrl(data.publicUrl);
    }
  };

  return (
    <div
      className="group relative flex flex-col items-center p-3 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => onDownload(material)}
      onMouseEnter={handlePreview}
    >
      {/* Thumbnail area */}
      <div className={`w-full aspect-square rounded-md flex items-center justify-center mb-2 overflow-hidden ${isImage && previewUrl ? "" : colorClass}`}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={material.file_name} className="w-full h-full object-cover rounded-md" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Icon size={28} />
            <span className="text-[10px] font-bold opacity-70">{getFileExt(material.file_name)}</span>
          </div>
        )}
      </div>

      {/* File name */}
      <p className="font-body text-xs text-foreground text-center truncate w-full" title={material.file_name}>
        {material.file_name}
      </p>
      {material.file_size && (
        <p className="font-body text-[10px] text-muted-foreground">{formatSize(material.file_size)}</p>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Download size={20} className="text-primary" />
      </div>
    </div>
  );
};

const CoursesTab = ({ editions, materials, onDownload }: CoursesTabProps) => {
  const getMaterialsForEdition = (editionId: string) =>
    materials.filter((m) => m.edition_id === editionId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
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

        {["live", "webinar"].map((type) => (
          <TabsContent key={type} value={type}>
            <div className="grid gap-6">
              {editions.filter((e) => (e.type || "live") === type).map((edition) => {
                const editionMaterials = getMaterialsForEdition(edition.id);
                return (
                  <div key={edition.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-card transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">{edition.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(edition.date)}</span>
                          {edition.location && <span className="flex items-center gap-1"><MapPin size={14} />{edition.location}</span>}
                        </div>
                      </div>
                      <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${edition.status === "completed" ? "bg-primary/10 text-petrolio" : "bg-gold/10 text-gold"}`}>
                        {edition.status === "completed" ? "Completato" : "In programma"}
                      </span>
                    </div>

                    {editionMaterials.length > 0 ? (
                      <div className="border-t border-border pt-4">
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3">
                          <FileText size={12} className="inline mr-1" />
                          {editionMaterials.length} materiale/i disponibile/i
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                          {editionMaterials.map((mat) => (
                            <MaterialThumbnail key={mat.id} material={mat} onDownload={onDownload} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-border pt-4">
                        <p className="font-body text-sm text-muted-foreground italic">Nessun materiale disponibile al momento.</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {editions.filter((e) => (e.type || "live") === type).length === 0 && (
                <div className="bg-cream rounded-lg p-8 text-center">
                  <p className="font-body text-muted-foreground">
                    Nessun {type === "live" ? "corso live" : "webinar"} disponibile al momento.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CoursesTab;
