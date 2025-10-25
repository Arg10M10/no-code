import Navigation from "@/components/Navigation";
import PricingCard from "@/components/PricingCard";
import LavaLamp from "@/components/LavaLamp";
import { useState } from "react";

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const fusionPlans = [
    {
      title: "Free",
      description: "For individuals looking to explore",
      price: "$0",
      priceLabel: "per user/mo",
      ctaText: "Get started",
      ctaVariant: "outline" as const,
      features: [
        "Up to 10 users",
        "75 monthly Agent Credits (25 daily limit)",
        "1 space",
        "Connect with GitHub, GitLab, and Bitbucket, Figma plugin, VS Code extension, Built-in MCP Servers",
        "Public previews",
      ],
    },
    {
      title: "Pro",
      description: "For teams building and iterating on projects",
      price: billingPeriod === "monthly" ? "$24" : "$20",
      priceLabel: "per user/mo",
      ctaText: "Get started",
      ctaVariant: "default" as const,
      features: [
        "Up to 20 users",
        `${billingPeriod === "monthly" ? "500" : "600"} monthly Agent Credits`,
        "Everything in Free, plus:",
        "Pay-as-you-go for more usage",
        "30-day Activity History",
        "Password-protected previews",
        "Standard Support",
      ],
    },
    {
      title: "Enterprise",
      description: "For organizations needing more scale, control, and support",
      price: "Custom",
      priceLabel: "per user/mo",
      ctaText: "Contact sales",
      ctaVariant: "default" as const,
      features: [
        "Custom user seats",
        "Custom Agent Credits",
        "Everything in Pro, plus:",
        "Connect with GitHub Enterprise, GitLab Enterprise, Azure DevOps",
        "Custom spaces",
        "Faster machines",
        "Custom roles & permissions",
        "Remote workspaces",
        "Custom MCP servers",
        "Component mapping",
        "Privacy mode",
        "SSO",
        "Uptime and Premium Support SLAs",
        "Assigned Customer Success Manager",
        "Add-ons:",
        "Private Slack Channel",
      ],
    },
  ];

  const currentPlans = fusionPlans;

  return (
    <div className="min-h-screen bg-background relative">
      <LavaLamp />
      <div className="relative z-10">
        <Navigation />
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div
              className="text-center space-y-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <h1 className="text-5xl md:text-6xl font-bold">
                Select a plan for your team
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose the plan that's right for your team and start building.
              </p>
            </div>

            {/* Billing Toggle */}
            <div
              className="flex items-center justify-center gap-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <span className={billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  billingPeriod === "annual" ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-background rounded-full transition-transform ${
                    billingPeriod === "annual" ? "translate-x-7" : ""
                  }`}
                />
              </button>
              <span className={billingPeriod === "annual" ? "text-foreground" : "text-muted-foreground"}>
                Annual
              </span>
            </div>

            {/* Pricing Cards */}
            <div
              className="grid md:grid-cols-3 gap-8 pt-8 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {currentPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  {...plan}
                  highlighted={index === 1}
                />
              ))}
            </div>

            {/* Footer Note */}
            <div
              className="text-center text-sm text-muted-foreground pt-8 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <p>
                Plan features, pricing, and limits are subject to change. See{" "}
                <a href="#" className="text-primary hover:underline">
                  FAQ below
                </a>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Pricing;