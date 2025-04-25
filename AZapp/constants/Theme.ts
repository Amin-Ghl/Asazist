export const lightTheme = {
  primary: '#0064FF',
  secondary: '#4A90E2',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: '#666666',
  border: '#E0E0E0',
  notification: '#FF3B30',
  tagBackground: '#E3F2FD',
  tagText: '#1976D2',
  modalOverlay: 'rgba(0, 0, 0, 0.4)',
  shadowColor: '#000',
  status: {
    active: '#4CAF50',
    triggered: '#F44336',
    inactive: '#9E9E9E'
  },
  tabBar: {
    background: '#FFFFFF',
    activeTint: '#0064FF',
    inactiveTint: '#666666',
  },
};

export const darkTheme = {
  primary: '#0064FF',
  secondary: '#4A90E2',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  secondaryText: '#B0B0B0',
  border: '#2A2A2A',
  notification: '#FF3B30',
  tagBackground: '#0D47A1',
  tagText: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  shadowColor: '#000',
  status: {
    active: '#81C784',
    triggered: '#E57373',
    inactive: '#757575'
  },
  tabBar: {
    background: '#1E1E1E',
    activeTint: '#0064FF',
    inactiveTint: '#B0B0B0',
  },
};

export type Theme = typeof lightTheme; 