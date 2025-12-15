export interface Service {
  id: string;
  name: string;
  icon: string;
  priceStart: number;
}

export interface Professional {
  id: string;
  name: string;
  rating: number;
  jobs: number;
  distance: string;
  eta: string;
  image: string;
}

export interface Booking {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  price: number;
  professionalName: string;
  address: string;
}

export enum AppView {
  AUTH = 'AUTH',
  HOME = 'HOME',
  ORDERS = 'ORDERS',
  OFFERS = 'OFFERS',
  TRACKING = 'TRACKING',
  ACCOUNT = 'ACCOUNT',
  BOOKING = 'BOOKING'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  phone?: string;
  createdAt?: string;
}