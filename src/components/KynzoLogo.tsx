import { Cpu } from 'lucide-react';

interface KynzoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'default' | 'inverted';
}

export function KynzoLogo({
  className = '',
  size = 'md',
  showTagline = true,
  variant = 'default',
}: KynzoLogoProps) {
  const emblemSizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
  };

  const iconSizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const titleSizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const isInverted = variant === 'inverted';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${emblemSizes[size]} overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
          isInverted
            ? 'bg-[#1E293B] border border-[#38BDF8]/35 text-[#38BDF8]'
            : 'bg-[#0B1120] border border-[#2563EB]/35 text-[#38BDF8] shadow-xs'
        }`}
      >
        <Cpu className={iconSizes[size]} />
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight font-display ${titleSizes[size]} flex items-center ${
            isInverted ? 'text-white' : 'text-[#0B1120]'
          }`}
        >
          <span>KYNZO</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ml-1 inline-block ${
              isInverted ? 'bg-[#38BDF8]' : 'bg-[#2563EB]'
            }`}
          />
        </span>

        {showTagline && (
          <span
            className={`text-[9px] font-bold tracking-[0.18em] uppercase mt-0.5 font-sans ${
              isInverted ? 'text-[#93C5FD]' : 'text-[#2563EB]'
            }`}
          >
            SMART · AUTHENTIC · TECH
          </span>
        )}
      </div>
    </div>
  );
}
