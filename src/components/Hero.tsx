import { Button } from "@/components/ui/button";
import { Github, Figma, Camera, Upload, Cpu, ArrowUp, File, X } from "lucide-react";
import { useRef, useState } from "react";
import ModelsPopover from "./ModelsPopover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Hero = () => {
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const screenshotFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState("OpenAI - GPT-5");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadProjectClick = () => {
    projectFileInputRef.current?.click();
  };

  const handleAttachImageClick = () => {
    imageFileInputRef.current?.click();
  };
  
  const handleCloneScreenshotClick = () => {
    screenshotFileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      setSelectedFile(file);
    }
    event.target.value = "";
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  return (
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
            {selectedFile && (
              <div className="absolute top-4 left-4 right-4 z-10 animate-fade-in-down">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background border border-border rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full flex-shrink-0" onClick={handleClearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <textarea
              placeholder="Ask Fusion to build a multi-step us"
              className={`w-full h-64 pl-6 pr-16 pb-16 bg-secondary border border-border text-base rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 ease-in-out hover:shadow-lg ${selectedFile ? 'pt-20' : 'pt-4'}`}
            />
            <div className="absolute left-4 bottom-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleAttachImageClick}
              >
                Attach
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Cpu className="h-4 w-4 mr-2" />
                    {selectedModel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ModelsPopover
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="absolute right-4 bottom-4">
              <Button size="icon" className="rounded-full transition-transform hover:scale-105 active:scale-95">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <input
              type="file"
              ref={projectFileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={imageFileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <input
              type="file"
              ref={screenshotFileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary border-border hover:bg-muted"
              onClick={handleUploadProjectClick}
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
              onClick={handleCloneScreenshotClick}
            >
              <Camera className="h-4 w-4 mr-2" />
              Clone a Screenshot
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;