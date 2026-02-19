import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  Search as SearchIcon,
  Trophy,
  Users,
  User,
  Newspaper,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch, LEAGUES, COUNTRIES, POSITIONS, DEFAULT_FILTERS } from "@/hooks/useSearch";
import type { SearchResult, SearchFilters } from "@/hooks/useSearch";
import TeamLogo from "@/components/TeamLogo";
import PlayerAvatar from "@/components/PlayerAvatar";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";

/* ─── Filter Pill ─── */
const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-full px-3 py-1.5 text-xs font-semibold transition-all border",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
    )}
  >
    {label}
  </button>
);

/* ─── Native Select wrapper ─── */
const FilterSelect = ({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-8 text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
        value ? "text-foreground font-medium" : "text-muted-foreground"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
  </div>
);

/* ─── Range slider ─── */
const RangeSlider = ({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>€{value[0]}M</span>
      <span>{value[1] >= max ? "∞" : `€${value[1]}M`}</span>
    </div>
    <div className="relative h-2">
      <div className="absolute inset-0 rounded-full bg-muted" />
      <div
        className="absolute h-full rounded-full bg-primary"
        style={{
          left: `${(value[0] / max) * 100}%`,
          right: `${100 - (value[1] / max) * 100}%`,
        }}
      />
      {/* Min handle */}
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value[0]}
        onChange={(e) => onChange([Math.min(Number(e.target.value), value[1] - 5), value[1]])}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      {/* Max handle */}
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value[1]}
        onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0] + 5)])}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  </div>
);

/* ─── Result card ─── */
const typeConfig = {
  team: {
    label: "Équipes",
    icon: <Users className="h-4 w-4 text-primary" />,
    color: "bg-primary/10 text-primary",
    tag: "Club",
  },
  player: {
    label: "Joueurs",
    icon: <User className="h-4 w-4 text-primary" />,
    color: "bg-primary/10 text-primary",
    tag: "Joueur",
  },
  competition: {
    label: "Compétitions",
    icon: <Trophy className="h-4 w-4 text-primary" />,
    color: "bg-primary/10 text-primary",
    tag: "Compétition",
  },
  news: {
    label: "Actualités",
    icon: <Newspaper className="h-4 w-4 text-primary" />,
    color: "bg-primary/10 text-primary",
    tag: "News",
  },
};

const ResultRow = ({ result }: { result: SearchResult }) => {
  const cfg = typeConfig[result.type];
  return (
    <Link
      to={result.href}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
    >
      <div className="flex-shrink-0">
        {result.type === "team" && <TeamLogo teamName={result.name} size="sm" />}
        {result.type === "player" && <PlayerAvatar name={result.name} size="sm" />}
        {result.type === "competition" && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <LeagueLogo leagueId={result.id} size="sm" />
          </div>
        )}
        {result.type === "news" && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {result.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
      </div>

      {/* Meta badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.type === "player" && result.meta?.rating && (
          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
            {result.meta.rating}
          </span>
        )}
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cfg.color)}>
          {cfg.tag}
        </span>
      </div>
    </Link>
  );
};

/* ─── Main page ─── */
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount,
  } = useSearch(200);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeOrder: (keyof typeof typeConfig)[] = ["player", "team", "competition", "news"];
  const hasQuery = debouncedQuery.length >= 1;
  const hasFilters = activeFilterCount > 0;
  const showResults = hasQuery || hasFilters;

  const TYPE_LABELS = [
    { key: "player" as const, label: "Joueurs" },
    { key: "team" as const, label: "Équipes" },
    { key: "competition" as const, label: "Compétitions" },
    { key: "news" as const, label: "News" },
  ];

  const toggleType = (type: SearchFilters["types"][number]) => {
    const cur = filters.types;
    if (cur.length === 1 && cur.includes(type)) return; // keep at least one
    updateFilter(
      "types",
      cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type]
    );
  };

  return (
    <Layout>
      <SEOHead
        title={query ? `Recherche : ${query}` : "Recherche avancée"}
        description="Recherchez des équipes, joueurs, compétitions et actualités football avec filtres avancés."
      />

      <div className="container py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Recherche</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-3">Équipes, joueurs, compétitions et actualités</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Rechercher... (ex : Mbappé, Arsenal, Ligue 1)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-12 h-12 sm:h-14 rounded-2xl border-border/60 bg-card text-sm sm:text-base focus-visible:ring-primary"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
              filtersOpen || activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors bg-card"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          )}

          {/* Results count */}
          {showResults && (
            <span className="ml-auto text-xs text-muted-foreground">
              {results.length} résultat{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="mb-5 rounded-2xl bg-card border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Filtres avancés</span>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Type pills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_LABELS.map(({ key, label }) => (
                    <FilterChip
                      key={key}
                      label={label}
                      active={filters.types.includes(key)}
                      onClick={() => toggleType(key)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* League filter */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Ligue</p>
                  <FilterSelect
                    value={filters.league}
                    onChange={(v) => updateFilter("league", v)}
                    placeholder="Toutes les ligues"
                    options={LEAGUES}
                  />
                </div>

                {/* Country filter */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Pays</p>
                  <FilterSelect
                    value={filters.country}
                    onChange={(v) => updateFilter("country", v)}
                    placeholder="Tous les pays"
                    options={COUNTRIES}
                  />
                </div>

                {/* Position filter */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Poste (joueurs)</p>
                  <FilterSelect
                    value={filters.position}
                    onChange={(v) => updateFilter("position", v)}
                    placeholder="Tous les postes"
                    options={POSITIONS}
                  />
                </div>
              </div>

              {/* Market value range */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Valeur marchande (joueurs)
                </p>
                <RangeSlider
                  min={0}
                  max={500}
                  value={[filters.marketValueMin, filters.marketValueMax]}
                  onChange={([min, max]) => {
                    updateFilter("marketValueMin", min);
                    updateFilter("marketValueMax", max);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {activeFilterCount > 0 && !filtersOpen && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.types.length < 4 &&
              TYPE_LABELS.filter(({ key }) => !filters.types.includes(key)).map(({ key, label }) => (
                <span key={key} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {label} exclu
                  <button onClick={() => toggleType(key)} className="ml-0.5 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            {filters.league && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                {filters.league}
                <button onClick={() => updateFilter("league", "")} className="ml-0.5 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.country && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                {filters.country}
                <button onClick={() => updateFilter("country", "")} className="ml-0.5 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.position && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                {filters.position}
                <button onClick={() => updateFilter("position", "")} className="ml-0.5 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.marketValueMin > 0 || filters.marketValueMax < 500) && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                €{filters.marketValueMin}M – {filters.marketValueMax >= 500 ? "∞" : `€${filters.marketValueMax}M`}
                <button
                  onClick={() => { updateFilter("marketValueMin", 0); updateFilter("marketValueMax", 500); }}
                  className="ml-0.5 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {showResults ? (
          results.length > 0 ? (
            <div className="space-y-4">
              {typeOrder
                .filter((t) => groupedResults[t]?.length)
                .map((type) => {
                  const items = groupedResults[type];
                  const cfg = typeConfig[type];
                  return (
                    <div key={type} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center gap-2">
                        {cfg.icon}
                        <h3 className="font-bold text-sm text-foreground">
                          {cfg.label}
                        </h3>
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {items.length}
                        </span>
                      </div>
                      <div className="divide-y divide-border/40">
                        {items.map((r) => (
                          <ResultRow key={`${r.type}-${r.id}`} result={r} />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <SearchIcon className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground">Aucun résultat</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {query ? `Aucun résultat pour "${query}"` : "Aucun résultat avec ces filtres."}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-1 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )
        ) : (
          /* Empty state with suggestions */
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Suggestions
            </p>
            {[
              { label: "Joueurs de Ligue 1", action: () => { updateFilter("types", ["player"]); updateFilter("league", "Ligue 1"); setFiltersOpen(false); } },
              { label: "Équipes d'Espagne", action: () => { updateFilter("types", ["team"]); updateFilter("country", "Spain"); setFiltersOpen(false); } },
              { label: "Attaquants > €100M", action: () => { updateFilter("types", ["player"]); updateFilter("position", "Forward"); updateFilter("marketValueMin", 100); setFiltersOpen(false); } },
              { label: "Compétitions européennes", action: () => { updateFilter("types", ["competition"]); setFiltersOpen(false); } },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex w-full items-center gap-3 rounded-xl bg-card border border-border/50 px-4 py-3 text-left hover:border-primary/40 hover:bg-muted/30 transition-colors group"
              >
                <SearchIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
