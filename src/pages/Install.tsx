import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Smartphone, Zap, Globe, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppLogo } from "@/hooks/useAppLogo";

const Install = () => {
  const livefootLogo = useAppLogo();

  return (
    <Layout>
      <SEOHead
        title="Application LiveFoot"
        description="Accédez à LiveFoot depuis votre navigateur pour des scores en direct, pronostics IA et statistiques de football."
      />
      <div className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          {/* Hero */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-3xl overflow-hidden shadow-2xl shadow-primary/40">
              <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl sm:text-4xl font-black text-foreground">
            LiveFoot
          </h1>
          
          <p className="mb-8 text-base sm:text-lg text-muted-foreground">
            Accédez à tous les scores en direct, pronostics IA et statistiques directement
            depuis votre navigateur — aucune installation requise !
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
          >
            Accéder à LiveFoot <ArrowRight className="h-5 w-5" />
          </Link>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-12">
            {[
              { icon: Zap, title: "Ultra Rapide", desc: "Chargement instantané, données en temps réel" },
              { icon: Globe, title: "Toujours à Jour", desc: "Dernière version automatiquement" },
              { icon: Bell, title: "Notifications", desc: "Alertes en temps réel sur les matchs" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mx-auto mb-3 shadow-md shadow-primary/20">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile tip */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Astuce Mobile</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez un raccourci vers <span className="font-semibold text-primary">livefoot.app</span> sur
                  votre écran d'accueil pour y accéder en un tap, comme une application native.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Install;
