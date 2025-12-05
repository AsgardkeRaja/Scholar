'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js component with no SSR
const SilkBackgroundCanvas = dynamic(
  () => import('./silk-background-canvas'),
  {
    ssr: false
  }
);

interface SilkBackgroundProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const SilkBackground: React.FC<SilkBackgroundProps> = (props) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <SilkBackgroundCanvas {...props} />;
};

export default SilkBackground;