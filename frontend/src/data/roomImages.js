export const ROOM_IMAGES = {
  'Garden Room': '/rooms/garden.jpg',
  'Courtyard Suite': '/rooms/courtyard.jpg',
  'Rooftop Loft': '/rooms/rooftop.jpg',
};

export const getRoomImage = (name) => ROOM_IMAGES[name] || '/rooms/garden.jpg';
