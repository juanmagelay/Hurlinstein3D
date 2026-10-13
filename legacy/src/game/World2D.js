import { Obstacle } from './Obstacle2D.js';

export class World {
  obstacles = [
    new Obstacle(1, 110, 100, 180, 34),
    new Obstacle(2, 520, 90, 46, 190),
    new Obstacle(3, 235, 420, 230, 42),
    new Obstacle(4, 650, 360, 130, 120),
    new Obstacle(5, 80, 570, 170, 32),
  ];
}
