import { useEffect, useRef } from "react";

const profileMatrix = `
01011011001010000100010000100011111001100011011100
10110011111110101101011101101010000000000000110010
01101010011000011100101011110110010001111011011011
10011010010001101101110101111011100111100000011101
00000011011111011110100110111000010011010011001100
01011101010010010110111001110010010110101000110111
01001000001011100100110010010010001010101011000010
10000100010011010111011001000111010110101111110010
01101110101001100101110100001111110100010011000010
01011010010101000000100110101111001101011010010000
00010011100000101100001111000110010001011000110111
10110010010011000000101010001110001000110001010010
01101101010010111011010011101111001110100111110100
00001001000000010010101101110010010000101101011010
01001011001110110011110001100011101001000111010010
11001100100111100011000001011101010110101110110101
00101101101001100110011010101000010110111000100101
01101110100001010100110010100110110001000011110011
01010001001001011110011001010000110001010100000101
1100100111101011001001110111000110101010001010011
`.trim().split("\n").map((row) => row.trim());

export function BinaryProfileCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let animationFrame = 0;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      const columns = 50;
      const cellWidth = bounds.width / columns;
      const cellHeight = bounds.height / profileMatrix.length;
      const scanColumn = Math.floor(frame / 2) % columns;

      context.font = `${Math.max(8, Math.min(12, cellHeight * 0.58))}px "JetBrains Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      profileMatrix.forEach((row, rowIndex) => {
        [...row].forEach((bit, columnIndex) => {
          const distance = Math.abs(columnIndex - scanColumn);
          const active = distance < 3;
          const alpha = bit === "1" ? (active ? 0.82 : 0.28) : (active ? 0.3 : 0.08);
          context.fillStyle = `rgba(96, 165, 250, ${alpha})`;
          context.fillText(
            bit,
            columnIndex * cellWidth + cellWidth / 2,
            rowIndex * cellHeight + cellHeight / 2,
          );
        });
      });

      if (!reduceMotion) {
        frame += 1;
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden="true"
      data-testid="binary-profile-canvas"
    />
  );
}
