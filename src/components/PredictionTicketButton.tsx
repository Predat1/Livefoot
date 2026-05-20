import { Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePredictionTicket } from "@/contexts/PredictionTicketContext";
import { cn } from "@/lib/utils";

interface PredictionTicketButtonProps {
  className?: string;
}

/**
 * Floating Action Button — affiche le nombre de sélections dans le ticket.
 * Visible globalement. Au clic : ouvre le drawer du ticket.
 */
const PredictionTicketButton = ({ className }: PredictionTicketButtonProps) => {
  const { count, setOpen } = usePredictionTicket();

  return (
    <button
      id="prediction-ticket-fab"
      onClick={() => setOpen(true)}
      className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-full",
        "bg-gradient-to-br from-emerald-500 to-emerald-600",
        "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50",
        "hover:scale-110 active:scale-95 transition-all duration-200",
        className,
      )}
      aria-label={`Mon ticket (${count} sélections)`}
      title="Mon ticket de prédictions"
    >
      <Ticket className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center px-1 shadow-md"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default PredictionTicketButton;
