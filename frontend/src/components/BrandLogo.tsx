import { useState } from 'react';
import brandLogoAsset from '../assets/brand/soulvio-lila-logo.png';
import snakeSpiritAsset from '../assets/lila/snake-spirit.svg';

const BRAND_LOGO_SRC = brandLogoAsset;

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
