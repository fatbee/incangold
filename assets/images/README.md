# Incangold Game Images

This directory contains all the images used in the Incangold game.

## Image Requirements

1. Place your game images in this directory with the following naming convention:
   - Gold images: `gold_5.jpg`, `gold_7.jpg`, etc. (matching the values in message.properties)
   - Danger images: `danger_snake.jpg`, `danger_spider.jpg`, etc.
   - Welcome image: `welcome.jpg`

2. Recommended image specifications:
   - Format: JPG or PNG
   - Size: 300-500px width, aspect ratio around 3:4
   - File size: Keep under 1MB for faster loading

## Image List

### Gold Coin Images
- `gold_5.jpg` - 5 gold coins
- `gold_7.jpg` - 7 gold coins
- `gold_8.jpg` - 8 gold coins
- `gold_9.jpg` - 9 gold coins
- `gold_10.jpg` - 10 gold coins
- `gold_11.jpg` - 11 gold coins
- `gold_12.jpg` - 12 gold coins
- `gold_15.jpg` - 15 gold coins
- `gold_17.jpg` - 17 gold coins

### Danger Images
- `danger_snake.jpg` - Snake danger
- `danger_spider.jpg` - Spider danger
- `danger_mummy.jpg` - Mummy danger
- `danger_fire.jpg` - Fire danger
- `danger_rockfall.jpg` - Rockfall danger

### Other Images
- `welcome.jpg` - Welcome screen image

## Adding New Images

1. Add your image file to this directory
2. Update the `message.properties` file in `src/config/` to include the path to your new image
3. Restart the bot for changes to take effect
