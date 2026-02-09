import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using LiveFoot's website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services. We reserve the right to modify these terms at any time.",
  },
  {
    title: "2. Use of Services",
    content:
      "LiveFoot provides live football scores, statistics, news, and related content. You agree to use our services only for lawful purposes and in accordance with these Terms. You must not use our services in any way that could damage, disable, or impair our servers or networks.",
  },
  {
    title: "3. Account Responsibilities",
    content:
      "If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.",
  },
  {
    title: "4. Intellectual Property",
    content:
      "All content on LiveFoot, including text, graphics, logos, images, and software, is the property of LiveFoot or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.",
  },
  {
    title: "5. Content Accuracy",
    content:
      "While we strive to provide accurate and up-to-date information, LiveFoot does not guarantee the accuracy, completeness, or reliability of any content. Match scores, statistics, and news are provided for informational purposes only and should not be relied upon for gambling or financial decisions.",
  },
  {
    title: "6. Third-Party Links",
    content:
      "Our services may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party sites. Accessing such links is at your own risk.",
  },
  {
    title: "7. Limitation of Liability",
    content:
      "To the fullest extent permitted by law, LiveFoot shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount you have paid us in the preceding twelve months.",
  },
  {
    title: "8. Governing Law",
    content:
      "These Terms shall be governed by and construed in accordance with the laws of the United Kingdom. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
  },
];

const Terms = () => {
  return (
    <Layout>
      <SEOHead
        title="Terms of Service"
        description="LiveFoot Terms of Service - Read the terms and conditions governing your use of LiveFoot."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
              <FileText className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to LiveFoot. These Terms of Service govern your access to and use of our website,
            applications, and services. By using LiveFoot, you agree to comply with and be bound by
            these terms.
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

export default Terms;
