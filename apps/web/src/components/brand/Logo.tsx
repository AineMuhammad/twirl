import { LogoMark } from '@twirl/viewer/ui';

import { APP_NAME } from '@/config/app';

/** The mark plus the lowercase wordmark. `size` scales both together. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const mark = { sm: 24, md: 28, lg: 34 }[size];
  const text = { sm: 'text-[22px]', md: 'text-[27px]', lg: 'text-[33px]' }[size];
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <LogoMark width={mark} height={mark} />
      <span className={`font-display leading-none tracking-tight ${text}`}>
        {APP_NAME.toLowerCase()}
      </span>
    </span>
  );
}
