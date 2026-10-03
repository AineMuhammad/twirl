import type { Metadata } from 'next';

import { DemoApp } from '@/components/demo/DemoApp';

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Try the 3D product configurator: change colors, hide parts and switch lighting.',
};

export default function DemoPage() {
  return <DemoApp />;
}
