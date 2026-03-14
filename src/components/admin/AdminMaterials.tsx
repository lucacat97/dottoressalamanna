import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Material {
  id: string;
  edition_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
}

interface Edition {
  id: string;
  title: string;
}

interface Props {
  editions: Edition[];
  materials: Material[];
  onUpdated: () => void;
}

const AdminMaterials = ({ editions, materials, onUpdated }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEdition) return;

    setUploading(true);
    const filePath = `${selectedEdition}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("course-materials")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Errore upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("course_materials").insert({
      edition_id: selectedEdition,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
    });

    setUploading(false);
    if (dbError) {
      toast({ title: "Errore", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Materiale caricato", description: file.name });
      onUpdated();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (material: Material) => {
    await supabase.storage.from("course-materials").remove([material.file_path]);
    const { error } = await supabase.from("course_materials").delete().eq("id", material.id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Materiale eliminato" });
      onUpdated();
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-3">Carica Materiale</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedEdition}
            onChange={(e) => setSelectedEdition(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleziona edizione...</option>
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>{ed.title}</option>
            ))}
          </select>
          <div className="relative">
            <input
              ref={fileRef}
              type="file"
              onChange={handleUpload}
              disabled={!selectedEdition || uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Button
              disabled={!selectedEdition || uploading}
              className="bg-primary text-primary-foreground font-body pointer-events-none w-full sm:w-auto"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? "Caricamento..." : "Carica File"}
            </Button>
          </div>
        </div>
      </div>

      {/* Materials list by edition */}
      {editions.map((edition) => {
        const edMats = materials.filter((m) => m.edition_id === edition.id);
        if (edMats.length === 0) return null;
        return (
          <div key={edition.id}>
            <h4 className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">{edition.title}</h4>
            <div className="space-y-1">
              {edMats.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-petrolio flex-shrink-0" />
                    <span className="font-body text-sm text-foreground truncate">{mat.file_name}</span>
                    {mat.file_size && (
                      <span className="font-body text-xs text-muted-foreground flex-shrink-0">({formatSize(mat.file_size)})</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => handleDelete(mat)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminMaterials;
