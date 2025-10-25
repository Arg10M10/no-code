import { Button } from "@/components/ui/button";
import { Github, Figma, Camera, Upload, Cpu, ArrowUp, File, X, ClipboardPaste } from "lucide-react";
import { useRef, useState, ClipboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
  const [pastedTextInfo, setPastedTextInfo] = useState<{ wordCount: number; content: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

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
      setSelectedFile(file);
    }
    event.target.value = "";
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleClearPastedText = () => {
    setPastedTextInfo(null);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text');
    const wordCount = pastedText.split(/\s+/).filter(Boolean).length;

    if (wordCount > 20000) {
      event.preventDefault();
      toast.error("Word limit exceeded", {
        description: "Upgrade to Pro for unlimited context.",
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    if (wordCount > 500) {
      event.preventDefault();
      setPastedTextInfo({ wordCount, content: pastedText });
    }
  };

  const attachmentCount = [selectedFile, pastedTextInfo].filter(Boolean).length;
  const paddingTopClass =
    attachmentCount === 2
      ? 'pt-24'
      : attachmentCount === 1
      ? 'pt-14'
      : 'pt-4';

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
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2">
              {selectedFile && (
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-background border border-border rounded-lg shadow-sm animate-fade-in-down">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full flex-shrink-0" onClick={handleClearFile}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {pastedTextInfo && (
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-background border border-border rounded-lg shadow-sm animate-fade-in-down">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardPaste className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate">
                      Pasted Text ({pastedTextInfo.wordCount} words)
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full flex-shrink-0" onClick={handleClearPastedText}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onPaste={handlePaste}
              placeholder="Ask Fusion to build a multi-step us"
              className={`w-full h-64 pl-6 pr-16 pb-16 bg-secondary border border-border text-base rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 ease-in-out hover:shadow-lg ${paddingTopClass}`}
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