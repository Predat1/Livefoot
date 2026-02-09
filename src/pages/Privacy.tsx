import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly, such as when you create an account, set preferences, or contact us. We also automatically collect certain information when you use our services, including your IP address, browser type, device information, and usage patterns through cookies and similar technologies.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use the information we collect to provide, maintain, and improve our services, personalize your experience, send you notifications about matches and teams you follow, communicate with you about updates and promotions, and ensure the security of our platform.",
  },
  {
    title: "3. Information Sharing",
    content:
      "We do not sell your personal information to third parties. We may share your information with service providers who assist us in operating our platform, when required by law, or to protect our rights and safety. Any third-party service providers are contractually obligated to maintain the confidentiality of your information.",
  },
  {
    title: "4. Data Security",
    content:
      "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "5. Cookies and Tracking",
    content:
      "We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand usage patterns. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our services.",
  },
  {
    title: "6. Your Rights",
    content:
      "You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing activities. To exercise these rights, please contact us using the information provided on our Contact page.",
  },
  {
    title: "7. Children's Privacy",
    content:
      "Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.",
  },
  {
    title: "8. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website. Your continued use of our services after any changes constitutes your acceptance of the updated policy.",
  },
];

const Privacy = () => {
  return (
    <Layout>
      <SEOHead
        title="Privacy Policy"
        description="LiveFoot Privacy Policy - Learn how we collect, use, and protect your personal information."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <p className="text-muted-foreground leading-relaxed mb-6">
            At LiveFoot, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our website and use our
            services. Please read this policy carefully.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl bg-card border border-border/50 p-6">
              <h2 className="font-bold text-foreground mb-3">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
