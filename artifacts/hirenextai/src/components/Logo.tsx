interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const imgSizes = {
  xs: "h-8 w-8",
  sm: "h-10 w-10 md:h-[60px] md:w-[60px]",
  md: "h-10 w-10 md:h-16 md:w-16",
  lg: "h-14 w-14 md:h-20 md:w-20",
  xl: "h-20 w-20 md:h-24 md:w-24",
};

const textSizes = {
  xs: "text-base",
  sm: "text-xl md:text-2xl",
  md: "text-xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-4xl md:text-5xl",
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  return (
    <div
      className={`group inline-flex items-center gap-[10px] cursor-pointer transition-all duration-300 ease-out ${className}`}
    >
      <img
        src="/hirenext-logo-v2.png"
        alt="HirenextAI"
        className={`${imgSizes[size]} block flex-shrink-0 object-contain transition-transform duration-300 ease-out group-hover:scale-[1.08]`}
        style={{
          margin: 0,
          padding: 0,
          filter: "drop-shadow(0 0 14px rgba(168,85,247,0.65)) drop-shadow(0 0 5px rgba(99,102,241,0.4))",
        }}
      />
      {showText && (
        <span
          className={`font-display font-black ${textSizes[size]} bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300 ease-out group-hover:from-purple-200 group-hover:via-pink-300 group-hover:to-indigo-300`}
          style={{ lineHeight: 1, display: "block", margin: 0, padding: 0 }}
        >
          HirenextAI
        </span>
      )}
    </div>
  );
}
