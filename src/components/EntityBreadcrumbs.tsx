import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbStep {
  label: string;
  href?: string;
}

interface EntityBreadcrumbsProps {
  steps: BreadcrumbStep[];
}

const EntityBreadcrumbs = ({ steps }: EntityBreadcrumbsProps) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/">Accueil</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      {steps.map((step, i) => (
        <span key={i} className="contents">
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {step.href ? (
              <BreadcrumbLink asChild>
                <Link to={step.href}>{step.label}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{step.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </span>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

export default EntityBreadcrumbs;
