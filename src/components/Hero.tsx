import { Button } from "@/components/ui/button";
import { Github, Figma, Camera, Upload, Cpu } from "lucide-react";
import { useRef, useState } from "react";
import ModelsModal from "./ModelsModal";

const Hero = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("OpenAI - GPT-4o");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      // Aquí puedes añadir la lógica para manejar el archivo subido
    }
  };

  return (
    <>
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              What should we build?
            </h1>
            <p
              className="text-lg text-muted-foreground opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              Start building with a single prompt. No coding needed.
            </p>
          </div>

          <div
            className="max-w-2xl mx-auto space-y-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative">
              <textarea
                placeholder="Ask Fusion to build a multi-step us"
                className="w-full h-64 px-6 py-4 bg-secondary border border-border text-base rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-300 ease-in-out hover:shadow-lg"
              />
              <div className="absolute left-4 bottom-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Attach
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  {selectedModel}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary border-border hover:bg-muted"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload a Project
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary border-border hover:bg-muted"
              >
                <Github className="h-4 w-4 mr-2" />
                Connect a repo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary border-border hover:bg-muted"
                asChild
              >
                <a
                  href="https://www.figma.com/community/plugin/747985167520967365/builder-io-figma-to-code-ai-apps-react-vue-tailwind-etc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Figma className="h-4 w-4 mr-2" />
                  Figma Import
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary border-border hover:bg-muted"
              >
                <Camera className="h-4 w-4 mr-2" />
                Clone a Screenshot
              </Button>
            </div>
          </div>
        </div>
      </section>
      <ModelsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(model) => {
          setSelectedModel(model);
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default Hero;