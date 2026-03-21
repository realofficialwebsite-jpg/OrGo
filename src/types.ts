export interface ServiceItem {
  id: string;
  title: string;
  rating: number;
  reviews: string;
  price: number;
  descriptionPoints: string[];
  image: string;
}

export interface SubCategory {
  id: string;
  title: string;
  icon: string;
  image?: string;
  items: ServiceItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  priceStart: number;
  image: string;
  tag?: string;
  category: string;
  subCategories: SubCategory[];
  color?: string;
}

export interface CartItem extends ServiceItem {
  quantity: number;
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

export interface InterestedWorker {
  workerId: string;
  name: string;
  photo: string;
  experience: string;
}

export interface Booking {
  id: string;
  userId: string;
  cartItems: CartItem[];
  grandTotal: number;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  isInstant: boolean;
  instructions: string;
  imageUrl?: string;
  status: 'searching' | 'assigned' | 'completed' | 'cancelled';
  interestedWorkers: InterestedWorker[];
  assignedWorkerId?: string;
  workerName?: string;
  workerPhoto?: string;
  createdAt: any;
}

export enum AppView {
  AUTH = 'AUTH',
  HOME = 'HOME',
  ORDERS = 'ORDERS',
  TRACKING = 'TRACKING',
  ACCOUNT = 'ACCOUNT',
  BOOKING = 'BOOKING',
  SUB_CATEGORY = 'SUB_CATEGORY',
  SERVICE_DETAILS = 'SERVICE_DETAILS',
  CART = 'CART',
  CHECKOUT = 'CHECKOUT',
  WORKER_REGISTRATION = 'WORKER_REGISTRATION',
  WORKER_APP = 'WORKER_APP',
  CUSTOMER_APP = 'CUSTOMER_APP'
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  flatNo: string;
  street: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  type: 'Home' | 'Work' | 'Other';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  phone?: string;
  createdAt?: string;
  addresses?: Address[];
  role?: 'customer' | 'professional';
  providedServices?: string[];
  skills?: string[];
  isOnline?: boolean;
  age?: string;
  experience?: string;
}
