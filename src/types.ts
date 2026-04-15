export interface ServiceItem {
  id: string;
  title: string;
  rating: number;
  reviews: string;
  price: number;
  descriptionPoints: string[];
  imageUrl: string;
  isFavorite?: boolean;
}

export interface SubCategory {
  id: string;
  title: string;
  icon: string;
  imageUrl?: string;
  items: ServiceItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  priceStart: number;
  imageUrl: string;
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
  phone?: string;
  rating?: number;
  totalReviews?: number;
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
  status: 'searching' | 'assigned' | 'on_the_way' | 'in_progress' | 'billing' | 'payment_pending' | 'completed' | 'cancelled';
  interestedWorkers: InterestedWorker[];
  assignedWorkerId?: string;
  workerName?: string;
  workerPhoto?: string;
  startOtp?: string;
  endOtp?: string;
  billingItems?: { name: string; price: number }[];
  startedAt?: any;
  createdAt: any;
  rating?: number;
  reviewText?: string;
  isRated?: boolean;
  customerPhone?: string;
  customerName?: string;
  customerPhoto?: string;
  userPhotoUrl?: string;
  workerPhone?: string;
  customerLocation?: { lat: number; lng: number };
  workerLocation?: { lat: number; lng: number };
  cancelReason?: string;
  cancelledAt?: any;
  completedAt?: any;
  acceptedAt?: any;
  basePrice?: number;
  platformFee?: number;
  otp?: string;
  review?: string;
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
  DEVICE_SELECTION = 'DEVICE_SELECTION',
  CART = 'CART',
  CHECKOUT = 'CHECKOUT',
  ITEM_DETAILS = 'ITEM_DETAILS',
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
  createdAt?: string;
  updatedAt?: string;
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
  rating?: number;
  totalReviews?: number;
  category?: string;
  workingHours?: { start: string; end: string };
  availableDays?: string[];
  totalRatingPoints?: number;
  ratingCount?: number;
  platformDues?: number;
  paymentStatus?: 'pending' | 'under_review' | 'paid';
  lastFaceScanAt?: any;
  faceScanBase64?: string;
  profilePhotoBase64?: string;
}
