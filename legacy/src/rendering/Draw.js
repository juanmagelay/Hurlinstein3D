  // Helpers sobre la API nativa Canvas 2D. Reemplazan a PIXI.Graphics / PIXI.Text.
  // Los colores se siguen expresando como 0xRRGGBB para no cambiar la paleta.
  //   fill:   número (color) u objeto { color, alpha }
  //   stroke: objeto { color, width, alpha, cap }

  function css(color, alpha = 1) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function fillPath(ctx, fill) {
    if (fill == null) return;
    const style = typeof fill === 'number' ? { color: fill } : fill;
    ctx.fillStyle = css(style.color, style.alpha ?? 1);
    ctx.fill();
  }

  function strokePath(ctx, stroke) {
    if (stroke == null) return;
    ctx.strokeStyle = css(stroke.color ?? 0xffffff, stroke.alpha ?? 1);
    ctx.lineWidth = stroke.width ?? 1;
    ctx.lineCap = stroke.cap ?? 'butt';
    ctx.stroke();
  }

export const Draw = {
    css,

    fillRect(ctx, x, y, width, height, color, alpha = 1) {
      ctx.fillStyle = css(color, alpha);
      ctx.fillRect(x, y, width, height);
    },

    rect(ctx, x, y, width, height, fill, stroke) {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      fillPath(ctx, fill);
      strokePath(ctx, stroke);
    },

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      const r = Math.max(0, Math.min(radius, width / 2, height / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
      fillPath(ctx, fill);
      strokePath(ctx, stroke);
    },

    circle(ctx, x, y, radius, fill, stroke) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      fillPath(ctx, fill);
      strokePath(ctx, stroke);
    },

    line(ctx, x1, y1, x2, y2, stroke) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      strokePath(ctx, stroke);
    },

    // Varias líneas en un único trazo: [[x1, y1, x2, y2], ...]
    lines(ctx, segments, stroke) {
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of segments) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      strokePath(ctx, stroke);
    },

    // style: { fill, fontFamily, fontSize, fontWeight, letterSpacing }
    text(ctx, value, x, y, style) {
      ctx.save();
      ctx.font = `${style.fontWeight ?? 'normal'} ${style.fontSize ?? 12}px ${style.fontFamily ?? 'Arial'}`;
      ctx.fillStyle = css(style.fill ?? 0xffffff);
      ctx.textBaseline = 'top';
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${style.letterSpacing ?? 0}px`;
      ctx.fillText(value, x, y);
      ctx.restore();
    },
};
