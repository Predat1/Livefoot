import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, RotateCcw, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PROMPT =
  'Logo professionnel et mémorable pour "LiveFoot", application de scores de football en direct. Design minimaliste et moderne. Couleurs vert vif (#22c55e) et blanc sur fond sombre. Inclure un ballon de football stylisé ou un éclair représentant le "live". Design iconique propre adapté aux petites tailles (favicon/icône PWA). Pas de texte, juste le symbole.';

interface Variant {
  id: string;
  url: string;
}

const LogoGenerator = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const generateOne = async (): Promise<Variant | null> => {
    const { data, error } = await supabase.functions.invoke("generate-logo", {
      body: { prompt },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.imageUrl) throw new Error("Aucune image reçue");
    return { id: crypto.randomUUID(), url: data.imageUrl };
  };

  const handleGenerate = async (count: number = 3) => {
    setGenerating(true);
    try {
      const results: Variant[] = [];
      for (let i = 0; i < count; i++) {
        const v = await generateOne();
        if (v) {
          results.push(v);
          // Show results progressively
          setVariants((prev) => [...prev, v]);
          if (results.length === 1 && !selectedId) setSelectedId(v.id);
        }
      }
      toast({ title: `${results.length} variante(s) générée(s) !`, description: "Choisissez votre préférée." });
    } catch (e: any) {
      console.error("Logo generation error:", e);
      toast({ title: "Erreur", description: e.message || "Impossible de générer le logo.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddOne = async () => {
    setGenerating(true);
    try {
      const v = await generateOne();
      if (v) {
        setVariants((prev) => [...prev, v]);
        setSelectedId(v.id);
        toast({ title: "Nouvelle variante ajoutée !" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Échec de la génération.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
    if (selectedId === id) {
      setSelectedId(variants.find((v) => v.id !== id)?.id || null);
    }
  };

  const selectedVariant = variants.find((v) => v.id === selectedId);

  const base64ToBlob = (base64Url: string): Blob => {
    const base64Data = base64Url.split(",")[1];
    if (!base64Data) throw new Error("Format d'image invalide");
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: "image/png" });
  };

  const handleApply = async () => {
    if (!selectedVariant) return;
    setApplying(true);

    try {
      const blob = base64ToBlob(selectedVariant.url);

      // Upload main logo
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload("logo.png", blob, { upsert: true, contentType: "image/png" });
      if (uploadError) throw uploadError;

      // Also upload as favicon and PWA icons (same image, different names)
      await Promise.all([
        supabase.storage.from("logos").upload("favicon.png", blob, { upsert: true, contentType: "image/png" }),
        supabase.storage.from("logos").upload("pwa-192.png", blob, { upsert: true, contentType: "image/png" }),
        supabase.storage.from("logos").upload("pwa-512.png", blob, { upsert: true, contentType: "image/png" }),
      ]);

      // Update favicon in the DOM immediately
      const { data: faviconData } = supabase.storage.from("logos").getPublicUrl("favicon.png");
      if (faviconData?.publicUrl) {
        const ts = Date.now();
        // Update favicon link
        let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (faviconLink) faviconLink.href = faviconData.publicUrl + "?t=" + ts;
        // Update apple-touch-icon
        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (appleIcon) appleIcon.href = faviconData.publicUrl + "?t=" + ts;
      }

      toast({
        title: "Logo appliqué partout ! ✅",
        description: "Header, footer, favicon et icônes PWA mis à jour.",
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      console.error("Logo upload error:", e);
      toast({ title: "Erreur", description: e.message || "Impossible d'appliquer le logo.", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-foreground">Générateur de Logo IA</h2>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="logoPrompt">Décrivez votre logo</Label>
          <Textarea
            id="logoPrompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="rounded-xl border-border/50 bg-background resize-none text-sm"
            placeholder="Décrivez le logo que vous souhaitez..."
          />
          <button
            onClick={() => setPrompt(DEFAULT_PROMPT)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Réinitialiser le prompt
          </button>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => { setVariants([]); setSelectedId(null); handleGenerate(3); }}
            disabled={generating || !prompt.trim()}
            className="flex-1 h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30 gap-2"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Générer 3 variantes</>
            )}
          </Button>
          {variants.length > 0 && !generating && (
            <Button
              onClick={handleAddOne}
              variant="outline"
              className="h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1 px-4"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Generating indicator */}
        {generating && variants.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Génération de la variante {variants.length + 1}...
          </div>
        )}

        {/* Variants grid */}
        {variants.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <Label>Choisissez votre logo ({variants.length} variante{variants.length > 1 ? "s" : ""})</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "relative group rounded-xl border-2 p-3 transition-all duration-200 bg-muted/20 hover:bg-muted/40",
                    selectedId === v.id
                      ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                      : "border-border/50 hover:border-primary/40"
                  )}
                >
                  {/* Selection badge */}
                  {selectedId === v.id && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(v.id); }}
                    className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                  <img
                    src={v.url}
                    alt={`Variante ${i + 1}`}
                    className="w-full aspect-square object-contain rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2 font-medium">#{i + 1}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected preview */}
        {selectedVariant && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-full rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-3 text-center">Aperçu dans l'en-tête</p>
              <div className="flex items-center justify-center gap-2 bg-card rounded-lg p-3 border border-border/50">
                <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md">
                  <img src={selectedVariant.url} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">LIVEFOOT</span>
              </div>
            </div>

            {/* Favicon preview */}
            <div className="w-full rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-3 text-center">Aperçu favicon & PWA</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="h-4 w-4 mx-auto rounded-sm overflow-hidden border border-border/50">
                    <img src={selectedVariant.url} alt="Favicon 16" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">16px</p>
                </div>
                <div className="text-center">
                  <div className="h-8 w-8 mx-auto rounded-lg overflow-hidden border border-border/50">
                    <img src={selectedVariant.url} alt="Favicon 32" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">32px</p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-xl overflow-hidden border border-border/50 shadow-md">
                    <img src={selectedVariant.url} alt="PWA icon" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">PWA</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleApply}
              disabled={applying}
              variant="outline"
              className="w-full h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-semibold gap-2"
            >
              {applying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Application partout...</>
              ) : (
                <><Check className="h-4 w-4" /> Appliquer comme logo, favicon & PWA</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoGenerator;
