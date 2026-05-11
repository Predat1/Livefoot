import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Transition CSS pure : 0 JS, navigation perçue instantanée (~150ms)
// Remplace framer-motion qui infligeait 0.5s de lag à chaque clic
const PageTransition = ({ children }: PageTransitionProps) => (
  <div className="animate-page-in">{children}</div>
);

export default PageTransition;
