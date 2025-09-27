import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Zap, Calendar, Bot, Shield } from "lucide-react";

const Index = () => {



  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden px-6 py-24 text-center"
      >
        <div className="absolute inset-0 noise" />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto max-w-4xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            <span className="gradient-text">Social Media</span>
            <br />
            Management Reimagined
          </h1>
          
          <p className="mb-10 text-xl text-muted-foreground">
            Schedule posts, engage with AI assistance, and automate your social presence.
            Built for creators, marketers, and businesses.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="gradient" className="gap-2">
                <Zap className="h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="glass" className="gap-2">
                <Bot className="h-5 w-5" />
                Try as Guest
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-3"
        >
          {[
            {
              icon: <Calendar className="h-8 w-8" />,
              title: "Smart Scheduling",
              description: "Visual calendar for planning and auto-publishing your content",
            },
            {
              icon: <Bot className="h-8 w-8" />,
              title: "AI Assistant",
              description: "Generate engaging content with OpenAI GPT",
            },
            {
              icon: <Shield className="h-8 w-8" />,
              title: "Secure OAuth",
              description: "Enterprise-grade security with Instagram Business API",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8 text-center hover:scale-105 transition-transform"
            >
              <div className="mb-4 flex justify-center text-primary">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>


    </div>
  );
};

export default Index;
