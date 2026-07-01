import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../utils/audio";
import { useAppSelector } from "../../store";

import {
  CANVAS_SIZE,
  CENTER,
  ORBIT_RADIUS,
  getLetterNodes,
  getScaledPosition,
  hitTest,
} from "./LetterWheelUtils";

interface Props {
  centerLetter: string;
  outerLetters: string[];
  disabled?: boolean;
  onLetterSelect: (letter: string) => void;
}

export const LetterWheelCanvas: React.FC<Props> = ({
  centerLetter,
  outerLetters,
  disabled = false,
  onLetterSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundEnabled = useAppSelector((s) => s.settings.sound);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dark = document.documentElement.classList.contains("dark");
    const nodes = getLetterNodes(centerLetter, outerLetters);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = dark ? "rgba(212,175,55,.2)" : "rgba(13,59,46,.15)";
    ctx.lineWidth = 4;

    nodes.slice(1).forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = dark ? "rgba(212,175,55,.15)" : "rgba(13,59,46,.08)";
    ctx.stroke();
    ctx.setLineDash([]);

    nodes.forEach((node) => {
      const active = !disabled && activeNode === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + (active ? 3 : 0), 0, Math.PI * 2);

      if (disabled) {
        ctx.fillStyle = dark ? "#333" : "#ddd";
      } else if (node.isCenter) {
        const g = ctx.createRadialGradient(
          node.x,
          node.y,
          5,
          node.x,
          node.y,
          node.r
        );
        g.addColorStop(0, "#f3c63f");
        g.addColorStop(1, "#d4af37");
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = active
          ? "#e8e2d5"
          : dark
          ? "#124c3e"
          : "#faf8f5";
      }

      ctx.fill();

      ctx.strokeStyle = node.isCenter
        ? "#0d3b2e"
        : dark
        ? "#d4af37"
        : "#0d3b2e";

      ctx.lineWidth = node.isCenter ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = disabled
        ? "#999"
        : node.isCenter
        ? "#0d3b2e"
        : dark
        ? "#faf8f5"
        : "#0d3b2e";

      ctx.font = node.isCenter
        ? "bold 28px Outfit"
        : "700 22px Outfit";

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.letter, node.x, node.y + 1);
    });
  };

  useEffect(draw, [centerLetter, outerLetters, activeNode, disabled]);

  useEffect(() => {
    const observer = new MutationObserver(draw);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [centerLetter, outerLetters, disabled]);

  const interact = (clientX: number, clientY: number) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getScaledPosition(clientX, clientY, canvas);
    const node = hitTest(
      pos.x,
      pos.y,
      getLetterNodes(centerLetter, outerLetters)
    );

    if (!node) return;

    playSound.click(soundEnabled);

    setActiveNode(node.id);
    onLetterSelect(node.letter);

    setTimeout(() => setActiveNode(null), 120);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      role="button"
      aria-label="Letter Wheel"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onMouseDown={(e) => interact(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length)
          interact(e.touches[0].clientX, e.touches[0].clientY);
      }}
      className={`select-none touch-none transition-all
      ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer active:scale-95 hover:scale-[1.02]"
      }`}
    />
  );
};