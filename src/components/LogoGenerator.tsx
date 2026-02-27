import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Upload, Loader2, RotateCcw, Check } from "lucide-react";

const DEFAULT_PROMPT =
  'Logo professionnel et mémorable pour "LiveFoot", application de scores de football en direct. Design minimaliste et moderne. Couleurs vert vif (#22c55e) et blanc sur fond sombre. Inclure un ballon de football stylisé ou un éclair représentant le "live". Design iconique propre adapté aux petites tailles (favicon/icône PWA). Pas de texte, juste le symbole.';

const LogoGenerator = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-logo", {
        body: { prompt },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setPreviewUrl(data.imageUrl);
        toast({ title: "Logo généré !", description: "Prévisualisez et appliquez-le ci-dessous." });
      } else {
        throw new Error("Aucune image reçue");
      }
    } catch (e: any) {
      console.error("Logo generation error:", e);
      toast({
        title: "Erreur",
        description: e.message || "Impossible de générer le logo.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!previewUrl) return;
    setApplying(true);

    try {
      // Convert base64 to blob
      const base64Data = previewUrl.split(",")[1];
      if (!base64Data) throw new Error("Format d'image invalide");

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload("logo.png", blob, { upsert: true, contentType: "image/png" });

      if (uploadError) throw uploadError;

      toast({
        title: "Logo appliqué ! ✅",
        description: "Le nouveau logo est maintenant visible dans toute l'application.",
      });

      // Force reload to show new logo
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      console.error("Logo upload error:", e);
      toast({
        title: "Erreur",
        description: e.message || "Impossible d'appliquer le logo.",
        variant: "destructive",
      });
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

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30 gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Générer un Logo IA
            </>
          )}
        </Button>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-4 animate-fade-in">
            <Label>Aperçu</Label>
            <div className="flex flex-col items-center gap-4">
              <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-muted/30 p-6 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Logo généré par IA"
                  className="max-w-[200px] max-h-[200px] object-contain rounded-xl"
                />
              </div>

              {/* Preview in context */}
              <div className="w-full rounded-xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">Aperçu dans l'en-tête</p>
                <div className="flex items-center justify-center gap-2 bg-card rounded-lg p-3 border border-border/50">
                  <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-foreground">LIVEFOOT</span>
                </div>
              </div>

              <Button
                onClick={handleApply}
                disabled={applying}
                variant="outline"
                className="w-full h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-semibold gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Application...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Appliquer comme logo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoGenerator;
