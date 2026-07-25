import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, FileText, FolderPlus, ChevronDown, ChevronRight, GripVertical, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import * as tus from "tus-js-client";

interface UploadProgressItem {
  name: string;
  size: number;
  loaded: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface Material {
  id: string;
  edition_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  module_id: string | null;
  description: string | null;
  sort_order: number;
}

interface Module {
  id: string;
  edition_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface Edition {
  id: string;
  title: string;
}

interface Props {
  editions: Edition[];
  materials: Material[];
  modules: Module[];
  onUpdated: () => void;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const AdminMaterials = ({ editions, materials, modules, onUpdated }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [progress, setProgress] = useState<Record<string, UploadProgressItem>>({});
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const handleModuleDragStart = (e: React.DragEvent<HTMLDivElement>, modId: string) => {
    setDraggedModuleId(modId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleModuleDragOver = (e: React.DragEvent<HTMLDivElement>, modId: string) => {
    e.preventDefault();
    if (modId === draggedModuleId) return;
    setDragOverModuleId(modId);
  };

  const handleModuleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverModuleId(null);
    if (!draggedModuleId || draggedModuleId === targetId) {
      setDraggedModuleId(null);
      return;
    }
    const source = modules.find((m) => m.id === draggedModuleId);
    const target = modules.find((m) => m.id === targetId);
    if (!source || !target || source.edition_id !== target.edition_id) {
      setDraggedModuleId(null);
      return;
    }
    const editionModules = modules
      .filter((m) => m.edition_id === source.edition_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const fromIndex = editionModules.findIndex((m) => m.id === draggedModuleId);
    const toIndex = editionModules.findIndex((m) => m.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedModuleId(null);
      return;
    }
    const reordered = [...editionModules];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates = reordered.map((m, i) =>
      supabase.from("course_modules").update({ sort_order: i }).eq("id", m.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) {
      toast({ title: "Errore", description: firstError.message, variant: "destructive" });
    } else {
      toast({ title: "Ordine moduli aggiornato" });
      onUpdated();
    }
    setDraggedModuleId(null);
  };

  const handleModuleDragEnd = () => {
    setDraggedModuleId(null);
    setDragOverModuleId(null);
  };

  const handleCreateModule = async () => {
    if (!selectedEdition || !newModuleTitle.trim()) return;
    const editionModules = modules.filter((m) => m.edition_id === selectedEdition);
    const nextOrder = editionModules.length > 0 ? Math.max(...editionModules.map((m) => m.sort_order)) + 1 : 0;
    const { error } = await supabase.from("course_modules").insert({
      edition_id: selectedEdition,
      title: newModuleTitle.trim(),
      sort_order: nextOrder,
    });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Modulo creato", description: newModuleTitle });
      setNewModuleTitle("");
      onUpdated();
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Eliminare il modulo? I materiali resteranno ma perderanno l'associazione.")) return;
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Modulo eliminato" }); onUpdated(); }
  };

  const startEditModule = (mod: Module) => {
    setEditingModule(mod.id);
    setEditTitle(mod.title);
    setEditDescription(mod.description || "");
  };

  const saveEditModule = async () => {
    if (!editingModule) return;
    const { error } = await supabase.from("course_modules")
      .update({ title: editTitle.trim(), description: editDescription.trim() || null })
      .eq("id", editingModule);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Modulo aggiornato" }); setEditingModule(null); onUpdated(); }
  };

  const uploadOneTus = (file: File, filePath: string, key: string) =>
    new Promise<void>(async (resolve, reject) => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const upload = new tus.Upload(file, {
        endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        headers: {
          authorization: `Bearer ${token || anonKey}`,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: "course-materials",
          objectName: filePath,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (err) => {
          setProgress((p) => ({ ...p, [key]: { ...p[key], status: "error", error: err.message } }));
          reject(err);
        },
        onProgress: (loaded, total) => {
          setProgress((p) => ({ ...p, [key]: { ...p[key], loaded, size: total } }));
        },
        onSuccess: () => {
          setProgress((p) => ({ ...p, [key]: { ...p[key], status: "done", loaded: file.size } }));
          resolve();
        },
      });
      upload.start();
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedEdition) return;

    setUploading(true);
    const editionMats = materials.filter((m) => m.edition_id === selectedEdition && m.module_id === (selectedModule || null));
    let nextOrder = editionMats.length > 0 ? Math.max(...editionMats.map((m) => m.sort_order || 0)) + 1 : 0;

    // Initialize progress state
    const initial: Record<string, UploadProgressItem> = {};
    files.forEach((f, i) => {
      initial[`${i}_${f.name}`] = { name: f.name, size: f.size, loaded: 0, status: "uploading" };
    });
    setProgress((p) => ({ ...p, ...initial }));

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const key = `${i}_${file.name}`;
      const filePath = `${selectedEdition}/${Date.now()}_${file.name}`;
      try {
        await uploadOneTus(file, filePath, key);
      } catch (err: any) {
        toast({ title: `Errore upload: ${file.name}`, description: err.message, variant: "destructive" });
        continue;
      }
      const { error: dbError } = await supabase.from("course_materials").insert({
        edition_id: selectedEdition,
        module_id: selectedModule || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        sort_order: nextOrder++,
      });
      if (dbError) toast({ title: `Errore DB: ${file.name}`, description: dbError.message, variant: "destructive" });
      else successCount++;
    }

    setUploading(false);
    if (successCount > 0) {
      toast({ title: `${successCount} file caricat${successCount === 1 ? "o" : "i"}` });
      onUpdated();
    }
    if (fileRef.current) fileRef.current.value = "";
    // Auto-clear completed progress after a delay
    setTimeout(() => {
      setProgress((p) => {
        const next = { ...p };
        Object.keys(next).forEach((k) => { if (next[k].status === "done") delete next[k]; });
        return next;
      });
    }, 4000);
  };


  const handleAssignModule = async (materialId: string, moduleId: string) => {
    const { error } = await supabase.from("course_materials")
      .update({ module_id: moduleId || null })
      .eq("id", materialId);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else onUpdated();
  };

  const handleDeleteMaterial = async (material: Material) => {
    await supabase.storage.from("course-materials").remove([material.file_path]);
    const { error } = await supabase.from("course_materials").delete().eq("id", material.id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Materiale eliminato" }); onUpdated(); }
  };

  const currentEditionModules = modules.filter((m) => m.edition_id === selectedEdition).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      {/* Edition + Module selectors + Upload */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Edizione</label>
          <select
            value={selectedEdition}
            onChange={(e) => { setSelectedEdition(e.target.value); setSelectedModule(""); }}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleziona edizione...</option>
            {editions.map((ed) => <option key={ed.id} value={ed.id}>{ed.title}</option>)}
          </select>
        </div>

        {selectedEdition && (
          <>
            {/* Create module */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Nuovo modulo</label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Es. Introduzione, Modulo 1 - Cefalometria..."
                  className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button onClick={handleCreateModule} disabled={!newModuleTitle.trim()} className="bg-primary text-primary-foreground">
                <FolderPlus size={16} className="mr-2" /> Crea
              </Button>
            </div>

            {/* Upload */}
            <div className="border-t border-border pt-4">
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                Carica materiale {selectedModule ? "nel modulo selezionato" : "(senza modulo)"}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Nessun modulo —</option>
                  {currentEditionModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <div className="relative">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Button disabled={uploading} className="bg-primary text-primary-foreground pointer-events-none">
                    <Upload size={16} className="mr-2" />
                    {uploading ? "Caricamento..." : "Carica"}
                  </Button>
                </div>
              </div>
              <p className="font-body text-[11px] text-muted-foreground mt-1.5">Puoi selezionare più file contemporaneamente. Upload resumable — non chiudere la pagina finché non finisce.</p>

              {Object.keys(progress).length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {Object.entries(progress).map(([key, item]) => {
                    const pct = item.size > 0 ? Math.min(100, Math.round((item.loaded / item.size) * 100)) : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-body text-foreground truncate flex-1" title={item.name}>{item.name}</span>
                          <span className={`font-body shrink-0 ${item.status === "error" ? "text-destructive" : item.status === "done" ? "text-primary" : "text-muted-foreground"}`}>
                            {item.status === "error" ? "Errore" : item.status === "done" ? "✓ Completato" : `${pct}% · ${formatSize(item.loaded)} / ${formatSize(item.size)}`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${item.status === "error" ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {item.error && <p className="font-body text-[10px] text-destructive">{item.error}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Materials tree by edition */}
      {editions.map((edition) => {
        const edMats = materials.filter((m) => m.edition_id === edition.id);
        const edMods = modules.filter((m) => m.edition_id === edition.id).sort((a, b) => a.sort_order - b.sort_order);
        if (edMats.length === 0 && edMods.length === 0) return null;
        const isOpen = expanded[edition.id] ?? true;
        return (
          <div key={edition.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpanded(edition.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-display text-sm font-semibold text-foreground">{edition.title}</span>
              </div>
              <span className="font-body text-xs text-muted-foreground">
                {edMods.length} modul{edMods.length === 1 ? "o" : "i"} · {edMats.length} material{edMats.length === 1 ? "e" : "i"}
              </span>
            </button>

            {isOpen && (
              <div className="p-3 space-y-3">
                {edMods.map((mod) => {
                  const modMats = edMats.filter((m) => m.module_id === mod.id).sort((a, b) => a.sort_order - b.sort_order);
                  const isEditing = editingModule === mod.id;
                  return (
                    <div key={mod.id} className={`border border-border/60 rounded-md transition-all ${draggedModuleId === mod.id ? "opacity-40" : ""} ${dragOverModuleId === mod.id ? "border-primary shadow-sm" : ""}`}>
                      <div
                        draggable
                        onDragStart={(e) => handleModuleDragStart(e, mod.id)}
                        onDragOver={(e) => handleModuleDragOver(e, mod.id)}
                        onDrop={(e) => handleModuleDrop(e, mod.id)}
                        onDragEnd={handleModuleDragEnd}
                        className={`flex items-center justify-between gap-2 px-3 py-2 bg-gold/5 border-b border-border/60 cursor-move transition-colors ${dragOverModuleId === mod.id ? "bg-primary/20" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <GripVertical size={14} className="text-muted-foreground cursor-grab active:cursor-grabbing" />
                          {isEditing ? (
                            <div className="flex-1 space-y-1">
                              <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-2 py-1 rounded border border-input bg-background text-sm"
                              />
                              <input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Descrizione (opzionale)"
                                className="w-full px-2 py-1 rounded border border-input bg-background text-xs"
                              />
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <p className="font-body text-sm font-semibold text-foreground truncate">{mod.title}</p>
                              {mod.description && <p className="font-body text-xs text-muted-foreground truncate">{mod.description}</p>}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={saveEditModule}><Check size={14} /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingModule(null)}><X size={14} /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => startEditModule(mod)}><Pencil size={13} /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteModule(mod.id)}><Trash2 size={13} /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        {modMats.length === 0 ? (
                          <p className="font-body text-xs text-muted-foreground italic px-2 py-1">Nessun materiale in questo modulo.</p>
                        ) : modMats.map((mat) => (
                          <MaterialRow key={mat.id} material={mat} modules={edMods} onAssign={handleAssignModule} onDelete={handleDeleteMaterial} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Orphan materials (no module) */}
                {edMats.filter((m) => !m.module_id).length > 0 && (
                  <div className="border border-dashed border-border rounded-md p-2">
                    <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Senza modulo</p>
                    <div className="space-y-1">
                      {edMats.filter((m) => !m.module_id).map((mat) => (
                        <MaterialRow key={mat.id} material={mat} modules={edMods} onAssign={handleAssignModule} onDelete={handleDeleteMaterial} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MaterialRow = ({ material, modules, onAssign, onDelete }: {
  material: Material;
  modules: Module[];
  onAssign: (id: string, modId: string) => void;
  onDelete: (m: Material) => void;
}) => (
  <div className="flex items-center gap-2 p-2 bg-muted/20 rounded">
    <FileText size={13} className="text-petrolio shrink-0" />
    <span className="font-body text-sm text-foreground truncate flex-1" title={material.file_name}>{material.file_name}</span>
    {material.file_size && <span className="font-body text-xs text-muted-foreground shrink-0">{formatSize(material.file_size)}</span>}
    <select
      value={material.module_id || ""}
      onChange={(e) => onAssign(material.id, e.target.value)}
      className="text-xs px-2 py-1 rounded border border-input bg-background max-w-[140px]"
    >
      <option value="">— nessun modulo —</option>
      {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
    </select>
    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-7 w-7" onClick={() => onDelete(material)}>
      <Trash2 size={12} />
    </Button>
  </div>
);

export default AdminMaterials;
