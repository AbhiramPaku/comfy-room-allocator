import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-6 rounded-full bg-primary/10 animate-pulse">
            <Construction className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">Coming Soon!</h1>
        <p className="text-lg text-muted-foreground">
          We're working hard to bring you this feature. Check back soon!
        </p>
        <Button onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
