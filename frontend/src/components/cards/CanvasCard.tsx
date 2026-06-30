import React, { useRef, useEffect } from 'react';
import type { CharacterCard } from '../../types';
import { assetPreloader } from '../../utils/preloader';

interface CanvasCardProps {
  card: CharacterCard;
  width?: number;
  height?: number;
  interactive?: boolean;
}

export const CanvasCard: React.FC<CanvasCardProps> = ({
  card,
  width = 300,
  height = 420,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, width, height);

    const cornerRadius = 22;
    //const borderThickness = 6;
    //const innerPadding = 12;

    /*// Card background
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
    backgroundGradient.addColorStop(0, '#111827');
    backgroundGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = backgroundGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, cornerRadius);
    ctx.fill();
    
    // Outer border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = borderThickness;
    ctx.beginPath();
    ctx.roundRect(borderThickness / 2, borderThickness / 2, width - borderThickness, height - borderThickness, cornerRadius);
    ctx.stroke();
*/
    // Character illustration area
    const imagePadding =  2;
    const imageX = imagePadding;
    const imageY = imagePadding;
    const imageW = width - imagePadding;
    const imageH = height - imagePadding;

    const charImg = assetPreloader.getCachedImage(card.image);
    if (charImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageX, imageY, imageW, imageH, cornerRadius - 10);
      ctx.clip();
      ctx.drawImage(charImg, imageX, imageY, imageW, imageH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(imageX, imageY, imageW, imageH, cornerRadius - 10);
      ctx.fill();
    }
  };

  useEffect(() => { drawCard(); }, [card, width, height]);

  useEffect(() => {
    const obs = new MutationObserver(() => drawCard());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [card]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${card.id}_scroll.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className={`relative inline-block ${interactive ? 'hover:scale-105 hover:shadow-xl hover:rotate-1' : ''} transition-all duration-300 group`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={interactive ? handleDownload : undefined}
        className="rounded-2xl cursor-pointer shadow-lg select-none"
      />
      {interactive && (
        <span className="absolute bottom-4 right-4 bg-gold/90 text-jade-dark text-[8px] font-black uppercase px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Save 💾
        </span>
      )}
    </div>
  );
};

export default CanvasCard;
