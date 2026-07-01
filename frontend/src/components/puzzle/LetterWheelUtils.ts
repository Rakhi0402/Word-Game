export interface LetterNode {
  id: number;
  letter: string;
  x: number;
  y: number;
  r: number;
  isCenter: boolean;
}

export const CANVAS_SIZE = 320;
export const CENTER = CANVAS_SIZE / 2;
export const CENTER_RADIUS = 38;
export const OUTER_RADIUS = 30;
export const ORBIT_RADIUS = 95;

export const getLetterNodes = (
  centerLetter: string,
  outerLetters: string[]
): LetterNode[] => {
  const nodes: LetterNode[] = [
    {
      id: 0,
      letter: centerLetter,
      x: CENTER,
      y: CENTER,
      r: CENTER_RADIUS,
      isCenter: true,
    },
  ];

  outerLetters.forEach((letter, index) => {
    const angle = ((index * 60) - 90) * (Math.PI / 180);

    nodes.push({
      id: index + 1,
      letter,
      x: CENTER + ORBIT_RADIUS * Math.cos(angle),
      y: CENTER + ORBIT_RADIUS * Math.sin(angle),
      r: OUTER_RADIUS,
      isCenter: false,
    });
  });

  return nodes;
};

export const hitTest = (
  x: number,
  y: number,
  nodes: LetterNode[]
): LetterNode | null => {
  for (const node of nodes) {
    const dx = x - node.x;
    const dy = y - node.y;

    if (Math.sqrt(dx * dx + dy * dy) <= node.r) {
      return node;
    }
  }

  return null;
};

export const getScaledPosition = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (clientX - rect.left) * (CANVAS_SIZE / rect.width),
    y: (clientY - rect.top) * (CANVAS_SIZE / rect.height),
  };
};