import React from "react";
import { LayoutTemplate, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LavaLamp from "@/components/LavaLamp";
import { useNavigate } from "react-router-dom";
import { createProjectFromPrompt, addMessage } from "@/lib/projects";

const Resources = () => {
  const navigate = useNavigate();

  const handleUseTemplate = (templatePrompt: string) => {
    const proj = createProjectFromPrompt(templatePrompt);
    addMessage(proj.id, { role: "user", content: templatePrompt });
    navigate(`/editor?id=${encodeURIComponent(proj.id)}`);
  };

  const templates = [
    { 
        title: "SaaS Landing Page", 
        desc: "High-converting landing page with hero, features, pricing, and testimonials.", 
        tag: "Marketing",
        prompt: "Create a modern SaaS landing page with a hero section, feature grid, pricing table, and footer using Tailwind CSS."
    },
    { 
        title: "Admin Dashboard", 
        desc: "Clean dashboard layout with sidebar, charts, data tables, and stats cards.", 
        tag: "App",
        prompt: "Build a responsive admin dashboard layout with a sidebar navigation, header, summary cards, and a data table."
    },
    { 
        title: "Portfolio Website", 
        desc: "Minimalist personal portfolio to showcase work and experience.", 
        tag: "Personal",
        prompt: "Create a minimalist personal portfolio website with an about section, project gallery, skills list, and contact form."
    },
    { 
        title: "E-commerce Store", 
        desc: "Product listing page with filters, cart drawer, and product details.", 
        tag: "Store",
        prompt: "Design an e-commerce product listing page with a grid of products, category filters, and a shopping cart interface."
    },
    { 
        title: "Blog Template", 
        desc: "Content-focused blog layout with article list and reading view.", 
        tag: "Content",
        prompt: "Create a clean blog layout with a featured article, a list of recent posts, and a newsletter subscription form."
    },
    { 
        title: "Login & Auth", 
        desc: "Secure authentication screens for login, signup, and password recovery.", 
        tag: "Auth",
        prompt: "Build a set of authentication screens including login, sign up, and forgot password with modern form styling."
    },
  ];

  return (
    <div className="min-h-full bg-background relative animate-fade-in">
        <LavaLamp />
        <div className="relative z-10 container mx-auto px-6 py-12 md:py-20">
            <div className="mb-16 space-y-6 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Start Faster</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Resources & Templates</h1>
                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                    Jumpstart your next project with these pre-built templates. 
                    Select a template to have the AI scaffold the initial code for you.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {templates.map((t, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleUseTemplate(t.prompt)}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm hover:border-primary/50 transition-all p-0 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col h-full"
                    >
                        <div className="h-40 w-full bg-gradient-to-br from-secondary/50 to-secondary/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <LayoutTemplate className="w-12 h-12 text-muted-foreground/30 group-hover:text-primary/80 transition-colors" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                             <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 uppercase tracking-wide">{t.tag}</span>
                             </div>
                             <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{t.title}</h3>
                             <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.desc}</p>
                             
                             <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                                <span className="text-sm font-medium flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    Use Template <ArrowRight className="w-4 h-4" />
                                </span>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Resources;