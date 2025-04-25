const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const COLORS = {
  primary: '#007AFF',
  secondary: '#8E8E93',
  background: '#F2F2F7',
  white: '#FFFFFF',
  text: '#000000',
  danger: '#FF3B30',
  lightGray: '#E5E5EA',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
