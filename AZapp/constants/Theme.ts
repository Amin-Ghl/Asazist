export const lightTheme = {
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  text: '#1A1A1A',
  secondaryText: '#666666',
  border: '#E0E0E0',
  primary: '#1976D2',
  tagBackground: '#E3F2FD',
  tagText: '#1976D2',
  modalOverlay: 'rgba(0, 0, 0, 0.4)',
  shadowColor: '#000',
  status: {
    active: '#4CAF50',
    triggered: '#F44336',
    inactive: '#9E9E9E'
  }
};

export const darkTheme = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  secondaryText: '#B0B0B0',
  border: '#333333',
  primary: '#90CAF9',
  tagBackground: '#0D47A1',
  tagText: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  shadowColor: '#000',
  status: {
    active: '#81C784',
    triggered: '#E57373',
    inactive: '#757575'
  }
};

export type Theme = typeof lightTheme; 