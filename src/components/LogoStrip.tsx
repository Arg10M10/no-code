const LogoStrip = () => {
  const logos = [
    "LANE",
    "zapier",
    "J.CREW",
    "HARRY'S",
    "Living Expedition",
    "FAIRE",
    "Vistaprint",
    "aloyoga",
    "afterpay",
    "FARFETCH"
  ];

  return (
    <section
      className="py-12 border-t border-border/40 opacity-0 animate-fade-in-up"
      style={{ animationDelay: "0.5s" }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-40">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="text-muted-foreground font-medium text-sm md:text-base tracking-wide hover:opacity-100 transition-opacity"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoStrip;