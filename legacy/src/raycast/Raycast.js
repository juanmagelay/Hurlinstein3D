function intersectRectangle(origin, direction, maxDistance, obstacle) {
    const minX = obstacle.position.x;
    const minY = obstacle.position.y;
    const maxX = minX + obstacle.width;
    const maxY = minY + obstacle.height;
    let near = -Infinity;
    let far = Infinity;
    let nearNormal = { x: 0, y: 0 };

    const axes = [
      { origin: origin.x, direction: direction.x, min: minX, max: maxX, minNormal: { x: -1, y: 0 }, maxNormal: { x: 1, y: 0 } },
      { origin: origin.y, direction: direction.y, min: minY, max: maxY, minNormal: { x: 0, y: -1 }, maxNormal: { x: 0, y: 1 } },
    ];
    for (const axis of axes) {
      if (Math.abs(axis.direction) < 1e-9) {
        if (axis.origin < axis.min || axis.origin > axis.max) return null;
        continue;
      }
      const t1 = (axis.min - axis.origin) / axis.direction;
      const t2 = (axis.max - axis.origin) / axis.direction;
      const entryDistance = Math.min(t1, t2);
      const exitDistance = Math.max(t1, t2);
      const entryNormal = t1 < t2 ? axis.minNormal : axis.maxNormal;
      if (entryDistance > near) { near = entryDistance; nearNormal = entryNormal; }
      far = Math.min(far, exitDistance);
      if (near > far) return null;
    }
    const distance = near >= 0 ? near : far;
    if (distance < 0 || distance > maxDistance) return null;
    return { distance, normal: near >= 0 ? nearNormal : { x: -direction.x, y: direction.y === 0 ? 0 : -direction.y } };
}

export function raycast(origin, direction, maxDistance, obstacles) {
    let closest = null;
    for (const obstacle of obstacles) {
      const entry = intersectRectangle(origin, direction, maxDistance, obstacle);
      if (entry && (!closest || entry.distance < closest.distance)) {
        closest = { obstacle, distance: entry.distance, normal: entry.normal, point: { x: origin.x + direction.x * entry.distance, y: origin.y + direction.y * entry.distance } };
      }
    }
    return closest;
}
