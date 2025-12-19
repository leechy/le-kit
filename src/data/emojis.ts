export type LeEmojiCategory =
  | 'Smileys'
  | 'People'
  | 'Animals'
  | 'Food'
  | 'Travel'
  | 'Activities'
  | 'Objects'
  | 'Symbols'
  | 'Flags';

export interface LeEmojiItem {
  emoji: string;
  label: string;
  keywords: string[];
  category: LeEmojiCategory;
}

export const LE_EMOJI_CATEGORIES: LeEmojiCategory[] = [
  'Smileys',
  'People',
  'Animals',
  'Food',
  'Travel',
  'Activities',
  'Objects',
  'Symbols',
  'Flags',
];

// Curated starter dataset (~200). Easy to extend without changing the picker.
// Labels/keywords are intentionally simple; search matches label + keywords.
export const EMOJIS: LeEmojiItem[] = [
  // Smileys
  {
    emoji: '😀',
    label: 'Grinning face',
    keywords: ['grin', 'smile', 'happy'],
    category: 'Smileys',
  },
  {
    emoji: '😃',
    label: 'Grinning face with big eyes',
    keywords: ['smile', 'happy'],
    category: 'Smileys',
  },
  {
    emoji: '😄',
    label: 'Grinning face with smiling eyes',
    keywords: ['smile', 'happy', 'laugh'],
    category: 'Smileys',
  },
  { emoji: '😁', label: 'Beaming face', keywords: ['grin', 'teeth'], category: 'Smileys' },
  {
    emoji: '😆',
    label: 'Grinning squinting face',
    keywords: ['laugh', 'haha'],
    category: 'Smileys',
  },
  {
    emoji: '😅',
    label: 'Grinning face with sweat',
    keywords: ['relief', 'nervous'],
    category: 'Smileys',
  },
  {
    emoji: '🤣',
    label: 'Rolling on the floor laughing',
    keywords: ['rofl', 'lol'],
    category: 'Smileys',
  },
  { emoji: '😂', label: 'Face with tears of joy', keywords: ['lol', 'joy'], category: 'Smileys' },
  { emoji: '🙂', label: 'Slightly smiling face', keywords: ['smile'], category: 'Smileys' },
  { emoji: '😉', label: 'Winking face', keywords: ['wink'], category: 'Smileys' },
  {
    emoji: '😊',
    label: 'Smiling face with smiling eyes',
    keywords: ['blush', 'smile'],
    category: 'Smileys',
  },
  {
    emoji: '😍',
    label: 'Smiling face with heart-eyes',
    keywords: ['love', 'heart'],
    category: 'Smileys',
  },
  { emoji: '😘', label: 'Face blowing a kiss', keywords: ['kiss', 'love'], category: 'Smileys' },
  { emoji: '😎', label: 'Smiling face with sunglasses', keywords: ['cool'], category: 'Smileys' },
  { emoji: '🤩', label: 'Star-struck', keywords: ['wow', 'star'], category: 'Smileys' },
  { emoji: '🤔', label: 'Thinking face', keywords: ['think', 'hmm'], category: 'Smileys' },
  { emoji: '🙃', label: 'Upside-down face', keywords: ['silly'], category: 'Smileys' },
  { emoji: '😴', label: 'Sleeping face', keywords: ['sleep', 'tired'], category: 'Smileys' },
  { emoji: '😤', label: 'Face with steam', keywords: ['angry', 'frustrated'], category: 'Smileys' },
  { emoji: '😭', label: 'Loudly crying face', keywords: ['sad', 'cry'], category: 'Smileys' },
  { emoji: '😡', label: 'Pouting face', keywords: ['angry', 'mad'], category: 'Smileys' },
  { emoji: '🤯', label: 'Exploding head', keywords: ['mind blown'], category: 'Smileys' },

  // People
  { emoji: '👍', label: 'Thumbs up', keywords: ['like', 'approve', 'ok'], category: 'People' },
  { emoji: '👎', label: 'Thumbs down', keywords: ['dislike', 'no'], category: 'People' },
  { emoji: '👏', label: 'Clapping hands', keywords: ['clap', 'praise'], category: 'People' },
  {
    emoji: '🙏',
    label: 'Folded hands',
    keywords: ['please', 'thanks', 'pray'],
    category: 'People',
  },
  { emoji: '🤝', label: 'Handshake', keywords: ['deal', 'agreement'], category: 'People' },
  { emoji: '💪', label: 'Flexed biceps', keywords: ['strong', 'workout'], category: 'People' },
  { emoji: '🫶', label: 'Heart hands', keywords: ['love', 'heart'], category: 'People' },
  { emoji: '🙌', label: 'Raising hands', keywords: ['hooray', 'celebrate'], category: 'People' },
  { emoji: '🫡', label: 'Saluting face', keywords: ['salute', 'respect'], category: 'People' },
  { emoji: '👀', label: 'Eyes', keywords: ['look', 'see'], category: 'People' },
  { emoji: '🧠', label: 'Brain', keywords: ['mind', 'think'], category: 'People' },
  { emoji: '🫀', label: 'Anatomical heart', keywords: ['heart'], category: 'People' },

  // Animals
  { emoji: '🐶', label: 'Dog', keywords: ['pet', 'dog'], category: 'Animals' },
  { emoji: '🐱', label: 'Cat', keywords: ['pet', 'cat'], category: 'Animals' },
  { emoji: '🐭', label: 'Mouse', keywords: ['mouse'], category: 'Animals' },
  { emoji: '🐹', label: 'Hamster', keywords: ['hamster'], category: 'Animals' },
  { emoji: '🐰', label: 'Rabbit', keywords: ['bunny', 'rabbit'], category: 'Animals' },
  { emoji: '🦊', label: 'Fox', keywords: ['fox'], category: 'Animals' },
  { emoji: '🐻', label: 'Bear', keywords: ['bear'], category: 'Animals' },
  { emoji: '🐼', label: 'Panda', keywords: ['panda'], category: 'Animals' },
  { emoji: '🐨', label: 'Koala', keywords: ['koala'], category: 'Animals' },
  { emoji: '🐯', label: 'Tiger', keywords: ['tiger'], category: 'Animals' },
  { emoji: '🦁', label: 'Lion', keywords: ['lion'], category: 'Animals' },
  { emoji: '🐮', label: 'Cow', keywords: ['cow'], category: 'Animals' },
  { emoji: '🐷', label: 'Pig', keywords: ['pig'], category: 'Animals' },
  { emoji: '🐸', label: 'Frog', keywords: ['frog'], category: 'Animals' },
  { emoji: '🐵', label: 'Monkey', keywords: ['monkey'], category: 'Animals' },
  { emoji: '🐔', label: 'Chicken', keywords: ['chicken'], category: 'Animals' },
  { emoji: '🐧', label: 'Penguin', keywords: ['penguin'], category: 'Animals' },
  { emoji: '🐦', label: 'Bird', keywords: ['bird'], category: 'Animals' },
  { emoji: '🐤', label: 'Chick', keywords: ['chick'], category: 'Animals' },
  { emoji: '🦄', label: 'Unicorn', keywords: ['unicorn'], category: 'Animals' },
  { emoji: '🐝', label: 'Honeybee', keywords: ['bee'], category: 'Animals' },
  { emoji: '🦋', label: 'Butterfly', keywords: ['butterfly'], category: 'Animals' },
  { emoji: '🐢', label: 'Turtle', keywords: ['turtle'], category: 'Animals' },
  { emoji: '🐙', label: 'Octopus', keywords: ['octopus'], category: 'Animals' },
  { emoji: '🐳', label: 'Whale', keywords: ['whale'], category: 'Animals' },

  // Food
  { emoji: '🍎', label: 'Apple', keywords: ['fruit', 'apple'], category: 'Food' },
  { emoji: '🍌', label: 'Banana', keywords: ['fruit', 'banana'], category: 'Food' },
  { emoji: '🍓', label: 'Strawberry', keywords: ['fruit', 'berry'], category: 'Food' },
  { emoji: '🍒', label: 'Cherries', keywords: ['fruit', 'cherry'], category: 'Food' },
  { emoji: '🍍', label: 'Pineapple', keywords: ['fruit', 'pineapple'], category: 'Food' },
  { emoji: '🍇', label: 'Grapes', keywords: ['fruit', 'grape'], category: 'Food' },
  { emoji: '🍉', label: 'Watermelon', keywords: ['fruit', 'melon'], category: 'Food' },
  { emoji: '🥑', label: 'Avocado', keywords: ['avocado'], category: 'Food' },
  { emoji: '🍞', label: 'Bread', keywords: ['bread'], category: 'Food' },
  { emoji: '🥐', label: 'Croissant', keywords: ['pastry'], category: 'Food' },
  { emoji: '🧀', label: 'Cheese', keywords: ['cheese'], category: 'Food' },
  { emoji: '🍕', label: 'Pizza', keywords: ['pizza'], category: 'Food' },
  { emoji: '🍔', label: 'Hamburger', keywords: ['burger'], category: 'Food' },
  { emoji: '🌮', label: 'Taco', keywords: ['taco'], category: 'Food' },
  { emoji: '🍣', label: 'Sushi', keywords: ['sushi'], category: 'Food' },
  { emoji: '🍜', label: 'Noodles', keywords: ['ramen', 'noodles'], category: 'Food' },
  { emoji: '🍪', label: 'Cookie', keywords: ['cookie'], category: 'Food' },
  { emoji: '🍩', label: 'Doughnut', keywords: ['donut'], category: 'Food' },
  { emoji: '🍰', label: 'Cake', keywords: ['cake'], category: 'Food' },
  { emoji: '☕️', label: 'Coffee', keywords: ['coffee', 'drink'], category: 'Food' },

  // Travel
  { emoji: '🚗', label: 'Car', keywords: ['car', 'drive'], category: 'Travel' },
  { emoji: '🚕', label: 'Taxi', keywords: ['taxi'], category: 'Travel' },
  { emoji: '🚌', label: 'Bus', keywords: ['bus'], category: 'Travel' },
  { emoji: '🚲', label: 'Bicycle', keywords: ['bike'], category: 'Travel' },
  { emoji: '✈️', label: 'Airplane', keywords: ['flight', 'plane'], category: 'Travel' },
  { emoji: '🚀', label: 'Rocket', keywords: ['rocket', 'space'], category: 'Travel' },
  { emoji: '🛸', label: 'UFO', keywords: ['ufo'], category: 'Travel' },
  { emoji: '🚉', label: 'Station', keywords: ['train', 'station'], category: 'Travel' },
  { emoji: '⛵️', label: 'Sailboat', keywords: ['boat'], category: 'Travel' },
  { emoji: '🗺️', label: 'World map', keywords: ['map'], category: 'Travel' },
  { emoji: '🧭', label: 'Compass', keywords: ['compass', 'direction'], category: 'Travel' },
  { emoji: '🏝️', label: 'Desert island', keywords: ['island', 'beach'], category: 'Travel' },
  { emoji: '🏔️', label: 'Mountain', keywords: ['mountain'], category: 'Travel' },

  // Activities
  { emoji: '⚽️', label: 'Soccer ball', keywords: ['sport', 'soccer'], category: 'Activities' },
  { emoji: '🏀', label: 'Basketball', keywords: ['sport', 'basketball'], category: 'Activities' },
  { emoji: '🏈', label: 'Football', keywords: ['sport', 'football'], category: 'Activities' },
  { emoji: '🎾', label: 'Tennis', keywords: ['sport', 'tennis'], category: 'Activities' },
  { emoji: '🎮', label: 'Video game', keywords: ['game'], category: 'Activities' },
  { emoji: '🎲', label: 'Game die', keywords: ['dice'], category: 'Activities' },
  { emoji: '🎨', label: 'Palette', keywords: ['art', 'paint'], category: 'Activities' },
  { emoji: '🎵', label: 'Musical note', keywords: ['music'], category: 'Activities' },
  { emoji: '🎸', label: 'Guitar', keywords: ['music', 'guitar'], category: 'Activities' },
  { emoji: '📚', label: 'Books', keywords: ['read', 'book'], category: 'Activities' },

  // Objects
  { emoji: '⌚️', label: 'Watch', keywords: ['time', 'watch'], category: 'Objects' },
  { emoji: '📱', label: 'Mobile phone', keywords: ['phone'], category: 'Objects' },
  { emoji: '💻', label: 'Laptop', keywords: ['computer', 'laptop'], category: 'Objects' },
  { emoji: '🖥️', label: 'Desktop computer', keywords: ['computer'], category: 'Objects' },
  { emoji: '🖱️', label: 'Computer mouse', keywords: ['mouse'], category: 'Objects' },
  { emoji: '⌨️', label: 'Keyboard', keywords: ['keyboard'], category: 'Objects' },
  { emoji: '🧰', label: 'Toolbox', keywords: ['tools'], category: 'Objects' },
  { emoji: '🔧', label: 'Wrench', keywords: ['tool', 'wrench'], category: 'Objects' },
  { emoji: '🪛', label: 'Screwdriver', keywords: ['tool', 'screwdriver'], category: 'Objects' },
  { emoji: '🧪', label: 'Test tube', keywords: ['science'], category: 'Objects' },
  { emoji: '🧫', label: 'Petri dish', keywords: ['science'], category: 'Objects' },
  { emoji: '🧯', label: 'Fire extinguisher', keywords: ['safety'], category: 'Objects' },
  { emoji: '🗝️', label: 'Key', keywords: ['key'], category: 'Objects' },
  { emoji: '🔒', label: 'Lock', keywords: ['lock', 'security'], category: 'Objects' },
  { emoji: '🔑', label: 'Key', keywords: ['key', 'password'], category: 'Objects' },
  { emoji: '🧾', label: 'Receipt', keywords: ['receipt', 'bill'], category: 'Objects' },
  { emoji: '📦', label: 'Package', keywords: ['box', 'package'], category: 'Objects' },
  { emoji: '📌', label: 'Pin', keywords: ['pin'], category: 'Objects' },
  { emoji: '✏️', label: 'Pencil', keywords: ['pencil', 'edit'], category: 'Objects' },
  { emoji: '🖊️', label: 'Pen', keywords: ['pen'], category: 'Objects' },
  { emoji: '🧹', label: 'Broom', keywords: ['clean'], category: 'Objects' },
  { emoji: '🧺', label: 'Basket', keywords: ['basket'], category: 'Objects' },

  // Symbols
  { emoji: '❤️', label: 'Red heart', keywords: ['heart', 'love'], category: 'Symbols' },
  { emoji: '💔', label: 'Broken heart', keywords: ['heart', 'sad'], category: 'Symbols' },
  { emoji: '✨', label: 'Sparkles', keywords: ['sparkle'], category: 'Symbols' },
  { emoji: '⭐️', label: 'Star', keywords: ['star'], category: 'Symbols' },
  { emoji: '🔥', label: 'Fire', keywords: ['fire', 'lit'], category: 'Symbols' },
  { emoji: '💡', label: 'Light bulb', keywords: ['idea', 'light'], category: 'Symbols' },
  { emoji: '✅', label: 'Check mark', keywords: ['check', 'done'], category: 'Symbols' },
  { emoji: '❌', label: 'Cross mark', keywords: ['x', 'no'], category: 'Symbols' },
  { emoji: '⚠️', label: 'Warning', keywords: ['warning', 'alert'], category: 'Symbols' },
  { emoji: 'ℹ️', label: 'Information', keywords: ['info'], category: 'Symbols' },
  { emoji: '➕', label: 'Plus', keywords: ['add', 'plus'], category: 'Symbols' },
  { emoji: '➖', label: 'Minus', keywords: ['minus'], category: 'Symbols' },
  { emoji: '🔄', label: 'Repeat', keywords: ['refresh'], category: 'Symbols' },
  { emoji: '🔍', label: 'Magnifying glass', keywords: ['search', 'find'], category: 'Symbols' },
  { emoji: '🧩', label: 'Puzzle piece', keywords: ['puzzle'], category: 'Symbols' },

  // Flags
  { emoji: '🏳️', label: 'White flag', keywords: ['flag'], category: 'Flags' },
  { emoji: '🏴', label: 'Black flag', keywords: ['flag'], category: 'Flags' },
  { emoji: '🏁', label: 'Chequered flag', keywords: ['flag', 'finish'], category: 'Flags' },
  { emoji: '🏳️‍🌈', label: 'Rainbow flag', keywords: ['pride'], category: 'Flags' },
  { emoji: '🇺🇸', label: 'United States', keywords: ['usa', 'flag'], category: 'Flags' },
  { emoji: '🇬🇧', label: 'United Kingdom', keywords: ['uk', 'flag'], category: 'Flags' },
  { emoji: '🇫🇷', label: 'France', keywords: ['france', 'flag'], category: 'Flags' },
  { emoji: '🇩🇪', label: 'Germany', keywords: ['germany', 'flag'], category: 'Flags' },
  { emoji: '🇪🇸', label: 'Spain', keywords: ['spain', 'flag'], category: 'Flags' },
  { emoji: '🇮🇹', label: 'Italy', keywords: ['italy', 'flag'], category: 'Flags' },
  { emoji: '🇯🇵', label: 'Japan', keywords: ['japan', 'flag'], category: 'Flags' },
  { emoji: '🇨🇦', label: 'Canada', keywords: ['canada', 'flag'], category: 'Flags' },
  { emoji: '🇧🇷', label: 'Brazil', keywords: ['brazil', 'flag'], category: 'Flags' },
  { emoji: '🇦🇺', label: 'Australia', keywords: ['australia', 'flag'], category: 'Flags' },
];
