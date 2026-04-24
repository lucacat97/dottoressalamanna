import { useState } from "react";
import { BookOpen, Users, Upload, KeyRound, Calendar, MapPin, Trash2, Shield, Key, MessageSquareText, Pencil, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminCreateEdition from "@/components/admin/AdminCreateEdition";
import AdminRegistrations from "@/components/admin/AdminRegistrations";
import AdminMaterials from "@/components/admin/AdminMaterials";
import AdminAccessControl from "@/components/admin/AdminAccessControl";
import AdminApiKeys from "@/components/admin/AdminApiKeys";
import AdminFeedback from "@/components/admin/AdminFeedback";
import AdminKnowledge from "@/components/admin/AdminKnowledge";
import AdminLandingEditor from "@/components/admin/AdminLandingEditor";

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

interface AdminTabProps {
  editions: CourseEdition[];
  materials: CourseMaterial[];
  onFetchData: () => void;
  onDeleteEdition: (id: string) => void;
}

const AdminTab = ({ editions, materials, onFetchData, onDeleteEdition }: AdminTabProps) => {
  const [adminTab, setAdminTab] = useState<"editions" | "registrations" | "materials" | "access" | "apikeys" | "feedback" | "knowledge">("editions");
  const [editingLandingId, setEditingLandingId] = useState<string | null>(null);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-gold" />
        <h2 className="font-display text-xl font-semibold text-foreground">Pannello Admin</h2>
      </div>

      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit flex-wrap">
        {([
          { key: "editions" as const, label: "Edizioni", icon: BookOpen },
          { key: "registrations" as const, label: "Iscrizioni", icon: Users },
          { key: "materials" as const, label: "Materiali", icon: Upload },
          { key: "access" as const, label: "Accessi", icon: KeyRound },
          { key: "apikeys" as const, label: "API Keys", icon: Key },
          { key: "feedback" as const, label: "Feedback IA", icon: MessageSquareText },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAdminTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-all ${
              adminTab === key
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {adminTab === "editions" && (
        <div className="space-y-4">
          <AdminCreateEdition onCreated={onFetchData} />
          <div className="space-y-3">
            {editions.map((edition) => (
              <div key={edition.id} className="space-y-3">
                <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-base font-semibold text-foreground">{edition.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(edition.date)}</span>
                      {edition.location && <span className="flex items-center gap-1"><MapPin size={11} />{edition.location}</span>}
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${edition.status === "completed" ? "bg-primary/10 text-petrolio" : "bg-gold/10 text-gold"}`}>
                        {edition.status === "completed" ? "Completato" : edition.status === "ongoing" ? "In corso" : "In programma"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLandingId(editingLandingId === edition.id ? null : edition.id)}
                      className="font-body"
                    >
                      <Pencil size={14} className="mr-1" />
                      {editingLandingId === edition.id ? "Chiudi" : "Landing"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteEdition(edition.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                {editingLandingId === edition.id && (
                  <AdminLandingEditor editionId={edition.id} onClose={() => setEditingLandingId(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === "registrations" && <AdminRegistrations editions={editions} />}
      {adminTab === "materials" && <AdminMaterials editions={editions} materials={materials} onUpdated={onFetchData} />}
      {adminTab === "access" && <AdminAccessControl editions={editions} />}
      {adminTab === "apikeys" && <AdminApiKeys />}
      {adminTab === "feedback" && <AdminFeedback />}
    </div>
  );
};

export default AdminTab;
