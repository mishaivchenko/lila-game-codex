import { useState } from 'react';
import snakeSpiritAsset from '../assets/lila/snake-spirit.svg';

const BRAND_LOGO_SRC = '/assets/brand/soulvio-lila-logo.png';

interface BrandLogoProps {
  alt?: string;
  className?: string;
}

export const BrandLogo = ({ alt = 'Soulvio Lila', className }: BrandLogoProps) => {
  const [fallback, setFallback] = useState(false);

  return (
    <img
      src={fallback ? snakeSpiritAsset : BRAND_LOGO_SRC}
      alt={alt}
      onError={() => setFallback(true)}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
};

