import { Activity } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
        <div className={`relative ${sizeClasses[size]} bg-nexa-gradient rounded-lg flex items-center justify-center shadow-nexa-glow`}>
          <Activity className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"} text-primary-foreground`} />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} tracking-tight`}>
          <span className="text-foreground">Nexa</span>
          <span className="text-gradient">Score</span>
        </span>
      )}
    </div>
  );
}
