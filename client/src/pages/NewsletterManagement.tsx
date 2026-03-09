import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function NewsletterManagement() {
  useEffect(() => {
    document.title = "NEWSLETTER_MANAGEMENT | Chrispine Mndala";
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 mb-16"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black text-white tracking-tighter uppercase">
              <span className="text-primary mr-4">{"//"}</span>
              NEWSLETTER_HUB
            </h1>
            <p className="text-xl text-muted-foreground font-mono">
              EMAIL_CAMPAIGN_CONTROL: Manage subscribers and distribution templates
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Active Subscribers", value: stats?.totalSubscribers || 0 },
              { icon: Mail, label: "Email Templates", value: "4" },
              { icon: TrendingUp, label: "Weekly Opens", value: "67%" },
              { icon: Calendar, label: "Next Send", value: "Friday" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="tech-card border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                        <stat.icon className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-mono uppercase">{stat.label}</p>
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="tech-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-mono text-primary">WEEKLY_TEMPLATE_01</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-card/50 rounded-none flex items-center justify-center border border-primary/20">
                  <p className="text-muted-foreground font-mono text-sm">[TEMPLATE_PREVIEW_01.png]</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-mono text-muted-foreground">
                    Subject: "Weekly ICT & MEL Insights - Your Learning Path"
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    Professional development newsletter featuring curated insights on Infrastructure Management, MEL frameworks, and Data Analytics with practical implementation tips.
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/50 text-primary">SCHEDULED_FRIDAY_6PM</Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="tech-card border-primary/20 h-full">
              <CardHeader>
                <CardTitle className="font-mono text-primary text-sm">MARKETING_TIPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-primary">/&gt; Tip #1: Personalization</p>
                  <p className="text-muted-foreground text-xs">Use subscriber names and topics</p>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-primary">/&gt; Tip #2: Clear CTA</p>
                  <p className="text-muted-foreground text-xs">Drive to premium content</p>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-primary">/&gt; Tip #3: A/B Testing</p>
                  <p className="text-muted-foreground text-xs">Test subject lines weekly</p>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-primary">/&gt; Tip #4: Timing</p>
                  <p className="text-muted-foreground text-xs">Friday 6PM UTC optimal</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
