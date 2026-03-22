import { BookOpen, Calendar, MapPin, FileText, Download, Monitor, Brain } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
                      <div className="border-t border-border pt-4 space-y-2">
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3">
                          <FileText size={12} className="inline mr-1" />
                          {editionMaterials.length} materiale/i disponibile/i
                        </p>
                        {editionMaterials.map((mat) => (
                          <button
                            key={mat.id}
                            onClick={() => onDownload(mat)}
                            className="w-full flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            <span className="font-body text-sm text-foreground group-hover:text-petrolio transition-colors">{mat.file_name}</span>
                            <Download size={16} className="text-muted-foreground group-hover:text-petrolio transition-colors" />
                          </button>
                        ))}
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
