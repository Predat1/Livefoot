import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <Layout>
      <SEOHead
        title="Contact Us"
        description="Get in touch with the LiveFoot team. We'd love to hear from you."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Contact Us</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Send us a message
            </h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <Input placeholder="Your name" className="rounded-xl border-border/50 bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input type="email" placeholder="you@example.com" className="rounded-xl border-border/50 bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                <Input placeholder="What's this about?" className="rounded-xl border-border/50 bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <Textarea placeholder="Your message..." rows={5} className="rounded-xl border-border/50 bg-muted/30 resize-none" />
              </div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground font-bold">
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email", value: "support@livefoot.app", description: "We aim to reply within 24 hours" },
              { icon: MapPin, title: "Location", value: "London, United Kingdom", description: "Our headquarters" },
              { icon: Clock, title: "Support Hours", value: "Mon-Fri 9AM - 6PM GMT", description: "Weekend support via email" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-card border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm font-medium text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl gradient-primary p-6 text-primary-foreground">
              <h3 className="font-bold mb-2">Follow us on social media</h3>
              <p className="text-sm opacity-80 mb-4">Stay updated with the latest from LiveFoot</p>
              <div className="flex gap-3">
                {["Twitter", "Instagram", "Facebook"].map((social) => (
                  <span key={social} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium">
                    {social}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
