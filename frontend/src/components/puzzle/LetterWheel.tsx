import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '../../store';
import { playSound } from '../../utils/audio';

interface LetterWheelProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterSelect: (letter: string) => void;
}

export const LetterWheel: React.FC<LetterWheelProps> = ({
  centerLetter,
  outerLetters,
  onLetterSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundEnabled = useAppSelector((state) => state.settings.sound);
  const [activeNode, setActiveNode] = useState<number | null>(null); // null = none, 0 = center, 1..6 = outer

  const size = 320;
  const center = size / 2;
  const centerRadius = 38;
  const outerRadius = 30;
  const orbitalDistance = 95;

  // Compute positions of all 7 letter nodes
  const getNodes = () => {
    const nodes = [
      { id: 0, letter: centerLetter, x: center, y: center, r: centerRadius, isCenter: true }
    ];

    outerLetters.forEach((letter, index) => {
      const angle = (index * 60 - 90) * (Math.PI / 180); // Start from top (-90 degrees)
      const x = center + orbitalDistance * Math.cos(angle);
      const y = center + orbitalDistance * Math.sin(angle);
      nodes.push({ id: index + 1, letter, x, y, r: outerRadius, isCenter: false });
    });

    return nodes;
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const isDark = document.documentElement.classList.contains('dark');
    const nodes = getNodes();

    // 1. Draw connecting lines between center and outer circles
    ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(13, 59, 46, 0.15)';
    ctx.lineWidth = 4;
    nodes.slice(1).forEach((node) => {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    });

    // 2. Draw outer orbital dashed circle
    ctx.beginPath();
    ctx.arc(center, center, orbitalDistance, 0, 2 * Math.PI);
    ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(13, 59, 46, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Draw each letter circle (Nodes)
    nodes.forEach((node) => {
      const isActive = activeNode === node.id;
      ctx.save();

      // Shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Circle Background & Border
      if (node.isCenter) {
        // Center Jade/Gold themed
        const grad = ctx.createRadialGradient(node.x, node.y, 5, node.x, node.y, node.r);
        grad.addColorStop(0, '#f3c63f'); // Gold light
        grad.addColorStop(1, '#d4af37'); // Gold

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + (isActive ? 4 : 0), 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = 'transparent'; // No shadow for border
        ctx.strokeStyle = '#0d3b2e'; // Dark Jade border
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Outer Parchment themed
        ctx.fillStyle = isActive 
          ? '#e8e2d5' // Darker parchment on active click
          : (isDark ? '#124c3e' : '#faf8f5'); // Matches dark mode

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + (isActive ? 3 : 0), 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = isDark ? '#d4af37' : '#0d3b2e'; // Gold/Jade border
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Letter Text
      ctx.fillStyle = node.isCenter 
        ? '#0d3b2e' // Center letter: Jade
        : (isDark ? '#faf8f5' : '#0d3b2e'); // Outer letters

      ctx.font = node.isCenter ? 'bold 28px Outfit, sans-serif' : '700 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.letter, node.x, node.y + 1);

      ctx.restore();
    });
  };

  useEffect(() => {
    drawWheel();
  }, [centerLetter, outerLetters, activeNode]);

  // Handle dark mode mutations
  useEffect(() => {
    const observer = new MutationObserver(() => drawWheel());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [centerLetter, outerLetters]);

  // Handle hit testing
  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    
    const clickX = x * scaleX;
    const clickY = y * scaleY;

    const nodes = getNodes();
    
    // Check collisions
    for (const node of nodes) {
      const dx = clickX - node.x;
      const dy = clickY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= node.r) {
        // Trigger select
        playSound.click(soundEnabled);
        setActiveNode(node.id);
        onLetterSelect(node.letter);

        // Reset active node style after click frame
        setTimeout(() => {
          setActiveNode(null);
        }, 120);
        
        break;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div className="relative flex items-center justify-center p-2 rounded-full bg-parchment/30 dark:bg-black/10 border border-gold/15 backdrop-blur-sm max-w-[340px] mx-auto">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="cursor-pointer active:scale-98 transition-transform select-none"
      />
    </div>
  );
};
