export function resolveCircleAgainstWorld(position, velocity, radius, obstacles, bounds) {
  const resolvedPosition = { ...position };
  const resolvedVelocity = { ...velocity };
  let grounded = false;

  for (const obstacle of obstacles) {
    const minX = obstacle.position.x;
    const minY = obstacle.position.y;
    const maxX = minX + obstacle.width;
    const maxY = minY + obstacle.height;
    const closest = {
      x: Math.max(minX, Math.min(resolvedPosition.x, maxX)),
      y: Math.max(minY, Math.min(resolvedPosition.y, maxY)),
    };
    const dx = resolvedPosition.x - closest.x;
    const dy = resolvedPosition.y - closest.y;
    const distance = Math.hypot(dx, dy);
    let normal;
    let penetration;

    if (distance > 0 && distance < radius) {
      normal = { x: dx / distance, y: dy / distance };
      penetration = radius - distance;
    } else if (distance === 0
      && resolvedPosition.x > minX && resolvedPosition.x < maxX
      && resolvedPosition.y > minY && resolvedPosition.y < maxY) {
      const sides = [
        { value: resolvedPosition.x - minX, normal: { x: -1, y: 0 } },
        { value: maxX - resolvedPosition.x, normal: { x: 1, y: 0 } },
        { value: resolvedPosition.y - minY, normal: { x: 0, y: -1 } },
        { value: maxY - resolvedPosition.y, normal: { x: 0, y: 1 } },
      ];
      const nearest = sides.reduce((a, b) => a.value < b.value ? a : b);
      normal = nearest.normal;
      penetration = radius + nearest.value;
    } else {
      continue;
    }

    resolvedPosition.x += normal.x * penetration;
    resolvedPosition.y += normal.y * penetration;
    const inwardVelocity = resolvedVelocity.x * normal.x + resolvedVelocity.y * normal.y;
    if (inwardVelocity < 0) {
      resolvedVelocity.x -= normal.x * inwardVelocity;
      resolvedVelocity.y -= normal.y * inwardVelocity;
    }
    grounded = true;
  }

  if (resolvedPosition.x < radius) {
    resolvedPosition.x = radius;
    resolvedVelocity.x = Math.max(0, resolvedVelocity.x);
    grounded = true;
  }
  if (resolvedPosition.x > bounds.width - radius) {
    resolvedPosition.x = bounds.width - radius;
    resolvedVelocity.x = Math.min(0, resolvedVelocity.x);
    grounded = true;
  }
  if (resolvedPosition.y < radius) {
    resolvedPosition.y = radius;
    resolvedVelocity.y = Math.max(0, resolvedVelocity.y);
    grounded = true;
  }
  if (resolvedPosition.y > bounds.height - radius) {
    resolvedPosition.y = bounds.height - radius;
    resolvedVelocity.y = 0;
    grounded = true;
  }

  return { position: resolvedPosition, velocity: resolvedVelocity, grounded };
}

export function circleCollidesWithWorld(position, radius, obstacles, width, height) {
  for (const obstacle of obstacles) {
    const minX = obstacle.position.x;
    const minY = obstacle.position.y;
    const maxX = minX + obstacle.width;
    const maxY = minY + obstacle.height;
    const closestX = Math.max(minX, Math.min(position.x, maxX));
    const closestY = Math.max(minY, Math.min(position.y, maxY));
    if (Math.hypot(position.x - closestX, position.y - closestY) < radius) return true;
  }
  return position.x < radius || position.x > width - radius
    || position.y < radius || position.y > height - radius;
}
