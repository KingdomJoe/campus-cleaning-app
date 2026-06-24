import React from 'react';
import { StyleSheet, View, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: number;
  style?: ImageStyle;
}

const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <!-- Outer glowing path showing motion / dynamic swish -->
  <path d="M15 90 C 30 108, 75 108, 98 82 C 118 60, 115 35, 90 20 C 72 8, 48 15, 35 30 C 20 45, 15 70, 30 85 C 40 95, 60 98, 75 90" 
        stroke="url(#swishGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Sparkles showing clean/shine effect -->
  <path d="M85 35 L87.5 37.5 L91.5 37.5 L88.5 40 L89.5 44 L85 41.5 L80.5 44 L81.5 40 L78.5 37.5 L82.5 37.5 Z" fill="#33D4AB" />
  <path d="M25 45 L26.5 46.5 L29 46.5 L27 48 L27.5 51 L25 49.5 L22.5 51 L23 48 L21 46.5 L23.5 46.5 Z" fill="#00C896" opacity="0.8" />
  
  <!-- Sleek broom handle (diagonal) -->
  <rect x="35" y="25" width="4.5" height="42" rx="2" transform="rotate(-45 35 25)" fill="#FFFFFF" />
  
  <!-- Stylized broom bristles / head -->
  <path d="M60 60 L78 78 L68 88 L50 70 Z" fill="url(#broomGrad)" />
  
  <!-- Inner bristle split separator -->
  <path d="M50 70 L68 88" stroke="#111118" stroke-width="2" stroke-linecap="round" />
  
  <!-- Bristle texture lines -->
  <line x1="56" y1="67" x2="68" y2="79" stroke="#00C896" stroke-width="2" stroke-linecap="round" />
  <line x1="61" y1="72" x2="73" y2="84" stroke="#009B75" stroke-width="2" stroke-linecap="round" />

  <defs>
    <!-- Gradient for swish motion line -->
    <linearGradient id="swishGrad" x1="15" y1="90" x2="98" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#009B75" stop-opacity="0.1" />
      <stop offset="50%" stop-color="#00C896" />
      <stop offset="100%" stop-color="#33D4AB" />
    </linearGradient>
    
    <!-- Gradient for broom bristles -->
    <linearGradient id="broomGrad" x1="60" y1="60" x2="68" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#33D4AB" />
      <stop offset="100%" stop-color="#00C896" />
    </linearGradient>
  </defs>
</svg>
`;

export default function Logo({ size = 80, style }: LogoProps) {
  // Convert raw SVG string to UTF-8 data URI for safe cross-platform rendering
  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG.trim())}`;

  return (
    <Image
      source={{ uri: svgDataUri }}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={150}
    />
  );
}
