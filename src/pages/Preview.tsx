import { useSearchParams } from "react-router-dom";
import GeneratedPreview from "@/components/GeneratedPreview";

const PreviewPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  return <GeneratedPreview projectId={projectId ?? null} />;
};

export default PreviewPage;