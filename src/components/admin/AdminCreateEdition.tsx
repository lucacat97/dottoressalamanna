import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  onCreated: () => void;
}

const AdminCreateEdition = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    max_participants: "25",
    status: "upcoming",
    type: "live",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;

    setSubmitting(true);
    const { error } = await supabase.from("course_editions").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: form.date,
      location: form.location.trim() || null,
      max_participants: parseInt(form.max_participants) || 25,
      status: form.status,
      type: form.type,
    } as any);
    setSubmitting(false);

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Edizione creata", description: "La nuova edizione è stata aggiunta." });
      setForm({ title: "", description: "", date: "", location: "", max_participants: "25", status: "upcoming", type: "live" });
      setOpen(false);
      onCreated();
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground font-body">
        <Plus size={16} className="mr-2" />
        Nuova Edizione
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Crea Nuova Edizione</h3>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Titolo *</label>
          <input
            required
            type="text"
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Es. Check-up Ortodontico-Posturale - Ed. Primavera"
          />
        </div>
        <div className="md:col-span-2">
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Descrizione</label>
          <textarea
            rows={2}
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Breve descrizione del corso..."
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
            <Calendar size={12} className="inline mr-1" />Data *
          </label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
            <MapPin size={12} className="inline mr-1" />Location
          </label>
          <input
            type="text"
            maxLength={200}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Es. Roma - Hotel Palazzo Naiadi"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
            <Users size={12} className="inline mr-1" />Max Partecipanti
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={form.max_participants}
            onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="live">Corso Live</option>
            <option value="webinar">Webinar</option>
          </select>
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Stato</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="upcoming">In programma</option>
            <option value="ongoing">In corso</option>
            <option value="completed">Completato</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-body">
            Annulla
          </Button>
          <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground font-body">
            {submitting ? "Creazione..." : "Crea Edizione"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEdition;
