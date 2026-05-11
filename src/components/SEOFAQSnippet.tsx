import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  keywords?: string[];
  isFeatured?: boolean;
}

interface SEOFAQSnippetProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
  topic?: string;
  enableAccordion?: boolean;
}

/**
 * Composant SEO FAQ optimisé pour Google "People Also Ask" (PAA)
 * et Featured Snippets
 */
export function SEOFAQSnippet({
  faqs,
  title = "Questions fréquemment posées",
  className,
  topic,
  enableAccordion = true,
}: SEOFAQSnippetProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Marquer la première FAQ comme "featured" pour les snippets
  useEffect(() => {
    if (faqs.length > 0 && !hasInteracted) {
      // Logique pour marquer le featured snippet
      const firstFAQ = faqs[0];
      if (firstFAQ.isFeatured || firstFAQ.keywords?.length) {
        // Optimisation: la première question doit être concise (40-60 mots)
        // pour maximiser les chances de featured snippet
      }
    }
  }, [faqs, hasInteracted]);

  const handleToggle = (index: number) => {
    setHasInteracted(true);
    setOpenIndex(openIndex === index ? null : index);
  };

  // Générer le JSON-LD pour les FAQs
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof faq.answer === 'string' 
          ? faq.answer 
          : extractTextFromReactNode(faq.answer),
      },
    })),
  };

  return (
    <section 
      className={cn("py-8", className)}
      aria-labelledby="faq-heading"
    >
      {/* JSON-LD pour Google */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>

      <h2 
        id="faq-heading"
        className="text-2xl font-bold mb-6 text-foreground"
      >
        {title}
        {topic && <span className="text-primary"> {topic}</span>}
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <article
            key={index}
            className={cn(
              "border rounded-lg overflow-hidden transition-all duration-200",
              "hover:border-primary/30",
              openIndex === index ? "border-primary/50 shadow-sm" : "border-border"
            )}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button
              onClick={() => handleToggle(index)}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left",
                "bg-card hover:bg-accent/50 transition-colors",
                faq.isFeatured && "bg-primary/5"
              )}
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 
                className="font-semibold text-foreground pr-4"
                itemProp="name"
              >
                {faq.question}
              </h3>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                  openIndex === index && "rotate-180"
                )} 
              />
            </button>
            
            <div
              id={`faq-answer-${index}`}
              className={cn(
                "overflow-hidden transition-all duration-300",
                openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <div 
                className="p-4 pt-0 text-muted-foreground leading-relaxed"
                itemProp="text"
              >
                {typeof faq.answer === 'string' ? (
                  <p>{faq.answer}</p>
                ) : (
                  faq.answer
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Micro-données pour le crawl */}
      <div className="sr-only" aria-hidden="true">
        {faqs.map((faq, i) => (
          <div key={`microdata-${i}`}>
            <span itemScope itemType="https://schema.org/Question">
              <meta itemProp="name" content={faq.question} />
              <span itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <meta 
                  itemProp="text" 
                  content={typeof faq.answer === 'string' ? faq.answer : extractTextFromReactNode(faq.answer)} 
                />
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Helper pour extraire le texte d'un ReactNode
function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractTextFromReactNode(node.props.children);
  }
  return '';
}

// Hook personnalisé pour les FAQs optimisées SEO
export function useSEOfaq(
  baseQuestions: Array<{ q: string; a: string; keywords?: string[] }>,
  variables: Record<string, string>
) {
  return baseQuestions.map((item) => ({
    question: replaceVariables(item.q, variables),
    answer: replaceVariables(item.a, variables),
    keywords: item.keywords,
    // La première question devient le featured snippet
    isFeatured: true,
  }));
}

function replaceVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}

export default SEOFAQSnippet;
