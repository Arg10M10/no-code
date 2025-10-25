import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  priceLabel: string;
  ctaText: string;
  ctaVariant?: "default" | "outline";
  features: string[];
  highlighted?: boolean;
}

const PricingCard = ({
  title,
  description,
  price,
  priceLabel,
  ctaText,
  ctaVariant = "default",
  features,
  highlighted = false,
}: PricingCardProps) => {
  return (
    <div
      className={`rounded-2xl border p-8 space-y-6 transition-all hover:border-primary/50 ${
        highlighted ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <div className="text-5xl font-bold">{price}</div>
        <p className="text-sm text-muted-foreground">{priceLabel}</p>
      </div>

      <Button
        className={`w-full ${ctaVariant === "default" ? "bg-primary hover:bg-primary/90" : ""}`}
        variant={ctaVariant}
        size="lg"
      >
        {ctaText}
      </Button>

      <div className="pt-4 space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingCard;
