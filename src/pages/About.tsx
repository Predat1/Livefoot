import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Trophy, Users, Globe, Zap, Heart, Shield } from "lucide-react";
import livefootLogo from "@/assets/livefoot-logo.png";

const About = () => {
  const values = [
    { icon: Zap, title: "Real-Time Updates", description: "Live scores and match events delivered instantly as they happen on the pitch." },
    { icon: Globe, title: "Global Coverage", description: "From the Premier League to Serie A, we cover all major leagues and tournaments worldwide." },
    { icon: Shield, title: "Reliable Data", description: "Accurate, verified data from trusted sources ensuring you never miss a moment." },
    { icon: Heart, title: "Fan First", description: "Built by football fans, for football fans. Your passion drives everything we do." },
  ];

  return (
    <Layout>
      <SEOHead
        title="About LiveFoot"
        description="Learn about LiveFoot - your ultimate destination for live football scores, results, fixtures, tables, statistics and news."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img src={livefootLogo} alt="LiveFoot" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">About LiveFoot</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your ultimate destination for live football scores, results, fixtures, standings, statistics, and football news from around the world.
          </p>
        </div>

        {/* Mission */}
        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            At LiveFoot, we believe every football fan deserves instant access to accurate, comprehensive match data. Our mission is to provide the most reliable and user-friendly platform for following live football across all major leagues and competitions. Whether you're tracking your favorite team's progress or keeping an eye on transfer rumours, LiveFoot has you covered.
          </p>
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {values.map((value) => (
            <div key={value.title} className="rounded-2xl bg-card border border-border/50 p-6">
              <value.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="rounded-2xl gradient-primary p-6 sm:p-10 text-primary-foreground">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">LiveFoot in Numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "Leagues Covered" },
              { value: "1000+", label: "Teams Tracked" },
              { value: "10K+", label: "Matches/Season" },
              { value: "24/7", label: "Live Coverage" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black">{stat.value}</p>
                <p className="text-xs sm:text-sm opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
