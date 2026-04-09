interface AvatarCircleProps {
  src?: string | null;
  initials: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-8 h-8 text-[10px]",
  sm: "w-10 h-10 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 text-xl",
};

export function AvatarCircle({ src, initials, size = "sm", className = "" }: AvatarCircleProps) {
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary-lighter flex items-center justify-center shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary-darker">{initials}</span>
      )}
    </div>
  );
}
