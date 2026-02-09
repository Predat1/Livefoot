import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Home, Search, Trophy, Newspaper, Users } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const quickLinks = [
    { icon: Home, label: "Home", href: "/", description: "Back to live scores" },
    { icon: Trophy, label: "Competitions", href: "/competitions", description: "Leagues & tables" },
    { icon: Users, label: "Teams", href: "/teams", description: "Explore clubs" },
    { icon: Newspaper, label: "News", href: "/news", description: "Latest articles" },
    { icon: Search, label: "Search", href: "/search", description: "Find anything" },
  ];

  return (
    <Layout>
      <SEOHead title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="container py-16 sm:py-24 text-center">
        <div className="max-w-lg mx-auto">
          {/* 404 Number */}
          <div className="relative mb-6">
            <span className="text-[120px] sm:text-[180px] font-black text-primary/10 leading-none select-none">
              404
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">
            Looks like this page got a red card! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover-lift transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <link.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm text-foreground">{link.label}</span>
                <span className="text-[10px] text-muted-foreground">{link.description}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
