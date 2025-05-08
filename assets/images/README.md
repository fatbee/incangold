# Incangold Game Images

This directory contains all the images used in the Incangold game.

## Image Requirements

1. Place your game images in this directory with the following naming convention:
   - Treasure images: `treasure_5.jpg`, `treasure_7.jpg`, etc. (matching the values in message.properties)
   - Danger images: `danger_snake.jpg`, `danger_spider.jpg`, etc.
   - Welcome image: `welcome.jpg`

2. Recommended image specifications:
   - Format: JPG or PNG
   - Size: 300-500px width, aspect ratio around 3:4
   - File size: Keep under 1MB for faster loading

## Image List

### Treasure Images
- `treasure_5.jpg` - 5 gold treasure
- `treasure_7.jpg` - 7 gold treasure
- `treasure_8.jpg` - 8 gold treasure
- `treasure_9.jpg` - 9 gold treasure
- `treasure_10.jpg` - 10 gold treasure
- `treasure_11.jpg` - 11 gold treasure
- `treasure_12.jpg` - 12 gold treasure
- `treasure_15.jpg` - 15 gold treasure
- `treasure_17.jpg` - 17 gold treasure

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
