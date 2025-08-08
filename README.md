# Neon Snake - Tempest 2000 Style

A retro-futuristic snake game inspired by Jeff Minter's Tempest 2000, featuring neon colors, particle effects, tracers, and synthesized sound effects.

## Features

- **Strong Color Palette**: Vibrant neon colors with glowing effects
- **Particle Effects**: Explosive particle systems when collecting food or game over
- **Tracers**: Snake leaves glowing trails as it moves
- **Scoring System**: Points increase with level progression
- **Progressive Difficulty**: Speed increases with each level
- **Sound Effects**: Synthesized audio using Web Audio API
- **Tempest 2000 Aesthetic**: Retro-futuristic visual style with neon borders and pulsing effects

## How to Play

1. Open `index.html` in a modern web browser
2. Press **SPACE** to start the game
3. Use **ARROW KEYS** to control the snake
4. Collect the colorful orbs to grow and score points
5. Avoid hitting yourself
6. The snake can wrap around the screen edges
7. Press **SPACE** to restart when game over

## Controls

- **SPACE**: Start game / Restart after game over
- **↑**: Move up
- **↓**: Move down
- **←**: Move left
- **→**: Move right

## Game Mechanics

- **Scoring**: 10 points × current level per food collected
- **Leveling**: Every 100 points increases the level
- **Speed**: Increases with each level (max 5x speed)
- **Snake Growth**: Snake grows longer with each food collected
- **Visual Effects**: 
  - Snake segments change color along the body
  - Food pulses and glows
  - Particle explosions on food collection
  - Tracer trails behind the snake head
  - Explosion effect on game over

## Technical Details

- Built with HTML5 Canvas and vanilla JavaScript
- Uses Web Audio API for synthesized sound effects
- Responsive design with neon styling
- Smooth 60fps gameplay with proper frame timing
- Particle system with physics-based movement
- Tracer system with fade-out effects

## Browser Compatibility

Works best in modern browsers that support:
- HTML5 Canvas
- Web Audio API
- ES6+ JavaScript features

## Running the Game

Simply open `index.html` in your web browser. No server or build process required!

Enjoy the neon-infused snake adventure! 🐍✨
