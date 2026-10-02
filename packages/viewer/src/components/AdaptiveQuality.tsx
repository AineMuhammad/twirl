import { PerformanceMonitor } from '@react-three/drei';

export interface AdaptiveQualityProps {
  /** 0 (lowest) … 1 (highest). Called as the measured frame rate changes. */
  onChange: (factor: number) => void;
}

/**
 * Watches the frame rate and asks the host to scale quality (pixel ratio, shadow resolution)
 * down when the device struggles and back up when it recovers. After repeated flip-flops it
 * settles on the lower setting.
 */
export function AdaptiveQuality({ onChange }: AdaptiveQualityProps) {
  return (
    <PerformanceMonitor
      flipflops={3}
      onChange={({ factor }) => onChange(factor)}
      onFallback={() => onChange(0)}
    />
  );
}
