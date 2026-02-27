import { motion, type Transition } from "framer-motion";
import { useAppLogo } from "@/hooks/useAppLogo";
import { Skeleton } from "@/components/ui/skeleton";

interface BrandedLoaderProps {
  variant?: "page" | "section" | "match";
  message?: string;
}

const easeInOut = "easeInOut" as const;
const easeOut = "easeOut" as const;

const pulseRing = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.4, 0.8],
    opacity: [0.6, 0, 0.6],
    transition: { duration: 2, repeat: Infinity, ease: easeInOut },
  },
};

const logoBounce = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
};

const logoBreathTransition = {
  scale: [1, 1.06, 1],
  transition: { duration: 2, repeat: Infinity, ease: easeInOut },
};

const BrandedLoader = ({ variant = "page", message }: BrandedLoaderProps) => {
  const logoUrl = useAppLogo();

  if (variant === "match") {
    return <MatchSkeleton />;
  }

  return (
    <div
      className={
        variant === "page"
          ? "flex flex-col items-center justify-center min-h-[60vh] gap-5"
          : "flex flex-col items-center justify-center py-12 gap-4"
      }
    >
      {/* Pulsing ring behind logo */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute h-20 w-20 rounded-full border-2 border-primary/30"
          variants={pulseRing}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute h-16 w-16 rounded-full border border-primary/20"
          variants={pulseRing}
          initial="initial"
          animate="animate"
          style={{ animationDelay: "0.5s" }}
        />
        <motion.div
          variants={logoBounce}
          initial="initial"
          animate="animate"
        >
          <motion.div
            animate={logoBreathTransition}
            className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-xl shadow-primary/20 bg-card border border-border/50"
          >
            <img
              src={logoUrl}
              alt="LiveFoot"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Loading bar */}
      <div className="w-32 h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {message && (
        <motion.p
          className="text-xs text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

/** Rich skeleton for match lists on Index page */
const MatchSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.12, duration: 0.4, ease: "easeOut" }}
        className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden"
      >
        {/* League header skeleton */}
        <div className="px-4 py-3 bg-league-header flex items-center gap-3">
          <Skeleton className="h-5 w-7 rounded-sm" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* Match row skeletons */}
        {[0, 1].map((j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 + j * 0.06 + 0.2, duration: 0.3 }}
            className="flex items-center justify-between px-3 sm:px-5 py-4 sm:py-5 border-b border-border/50 last:border-b-0"
          >
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <Skeleton className="h-3.5 w-20 sm:w-24" />
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
            </div>
            <div className="mx-3 sm:mx-6">
              <Skeleton className="h-8 w-16 sm:w-20 rounded-lg" />
            </div>
            <div className="flex flex-1 items-center gap-2 sm:gap-3">
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
              <Skeleton className="h-3.5 w-20 sm:w-24" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    ))}
  </div>
);

/** Full-page skeleton for Match detail */
const MatchDetailSkeleton = () => {
  const logoUrl = useAppLogo();

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      {/* Back button */}
      <Skeleton className="h-8 w-24 rounded-lg" />

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-card border border-border/50 overflow-hidden"
      >
        {/* League bar */}
        <div className="px-4 py-2.5 bg-league-header flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Teams + score */}
        <div className="px-4 sm:px-8 py-6 sm:py-8 flex items-center justify-between">
          {/* Home */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl" />
            <Skeleton className="h-4 w-20 sm:w-28" />
          </div>

          {/* Score area with logo */}
          <div className="flex flex-col items-center gap-2 mx-4">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2 rounded-full bg-primary/5"
              />
              <img src={logoUrl} alt="" className="h-6 w-6 rounded-lg opacity-30" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <span className="text-xl font-bold text-muted-foreground/30">-</span>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl" />
            <Skeleton className="h-4 w-20 sm:w-28" />
          </div>
        </div>

        {/* Info bar */}
        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </motion.div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card border border-border/50 p-6"
      >
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2 flex-1 mx-4 rounded-full" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export { BrandedLoader, MatchSkeleton, MatchDetailSkeleton };
export default BrandedLoader;
