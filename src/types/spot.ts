export interface Spot {
  _id: string;
  name: string;
  description: string;
  type: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
} 