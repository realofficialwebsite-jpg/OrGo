import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { Auth } from '../components/Auth';
import { Tracking } from '../components/Tracking';
import { Account } from '../components/Account';
import { ProviderDashboard } from '../components/ProviderDashboard';
import { Cart } from '../components/Cart';
import { Checkout } from '../components/Checkout';
import { NotificationHandler } from './components/NotificationHandler';
import { Category, SubCategory, ServiceItem, CartItem, AppView, Booking, UserProfile } from './types';
import { APP_CATEGORIES } from './constants';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  ClipboardList, 
  Wallet, 
  MapPin, 
  User as UserIcon, 
  Wrench, 
  Droplet, 
  Zap, 
  Wind,
  Search, 
  Menu,
  Copy,
  Star,
  RefreshCw,
  Bell,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  X,
  Trash2,
  Tv,
  Refrigerator,
  Laptop,
  Flame,
  Smartphone,
  Cpu,
  Flower,
  Bug,
  Hammer,
  Shield,
  Package,
  Construction,
  Car,
  Brush,
  Dog,
  Layout,
  Sun,
  Activity,
  Scissors,
  Settings,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  Microwave,
  Waves,
  Bike,
  Fan,
  Lightbulb,
  Lock,
  Truck,
  HardHat,
  Stethoscope,
  Scissors as ScissorsIcon,
  Bath,
  UtensilsCrossed,
  Smartphone as LaptopIcon
} from 'lucide-react';

const CATEGORIES: Category[] = [
  { 
    id: '1', 
    name: 'Plumbing', 
    icon: 'droplet', 
    priceStart: 199, 
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop',
    tag: 'Best Seller',
    category: 'Home',
    subCategories: [
      {
        id: 'p-general',
        title: 'Plumbing Services',
        icon: 'droplet',
        items: [
          { id: 'p1', title: 'Tap Repair', rating: 4.8, reviews: '12k', price: 199, descriptionPoints: ['Check-up & diagnosis', 'Professional repair'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p2', title: 'Tap Installation', rating: 4.7, reviews: '8k', price: 299, descriptionPoints: ['New tap installation', 'Leakage check'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p3', title: 'Leakage Repair', rating: 4.6, reviews: '5k', price: 499, descriptionPoints: ['Pipe inspection', 'Leakage sealing'], image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop' },
          { id: 'p4', title: 'Pipe Installation', rating: 4.7, reviews: '7k', price: 399, descriptionPoints: ['New pipe fitting', 'Quality check'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p5', title: 'Pipe Leakage Detection', rating: 4.9, reviews: '10k', price: 899, descriptionPoints: ['Advanced detection', 'No damage tech'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p6', title: 'Water Tank Cleaning', rating: 4.8, reviews: '15k', price: 999, descriptionPoints: ['Deep cleaning', 'Sediment removal'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p7', title: 'Motor Installation', rating: 4.7, reviews: '6k', price: 1499, descriptionPoints: ['Pump mounting', 'Wiring check'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p8', title: 'Motor Repair', rating: 4.6, reviews: '4k', price: 799, descriptionPoints: ['Motor check', 'Part replacement'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p9', title: 'Bathroom Fittings Installation', rating: 4.8, reviews: '9k', price: 599, descriptionPoints: ['Shower, tap, etc.', 'Professional setup'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p10', title: 'Flush Repair', rating: 4.7, reviews: '11k', price: 399, descriptionPoints: ['Tank repair', 'Leakage fix'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p11', title: 'Drain Blockage Removal', rating: 4.9, reviews: '20k', price: 499, descriptionPoints: ['Deep cleaning', 'Blockage clearing'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
          { id: 'p12', title: 'Shower Installation', rating: 4.8, reviews: '7k', price: 449, descriptionPoints: ['New shower setup', 'Leakage check'], image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'blue'
  },
  { 
    id: '2', 
    name: 'AC Repair', 
    icon: 'wind', 
    priceStart: 499, 
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    tag: 'Trending',
    category: 'Appliances',
    subCategories: [
      {
        id: 'ac-general',
        title: 'AC Services',
        icon: 'wind',
        items: [
          { id: 'ac1', title: 'AC General Service', rating: 4.9, reviews: '25k', price: 499, descriptionPoints: ['Filter cleaning', 'Cooling check'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac2', title: 'AC Gas Refill', rating: 4.8, reviews: '15k', price: 2499, descriptionPoints: ['Leakage check', 'Gas charging'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac3', title: 'AC Installation', rating: 4.7, reviews: '10k', price: 1499, descriptionPoints: ['Professional mounting', 'Testing'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac4', title: 'AC Uninstallation', rating: 4.6, reviews: '8k', price: 799, descriptionPoints: ['Safe removal', 'Gas collection'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac5', title: 'AC Cooling Issue Repair', rating: 4.8, reviews: '12k', price: 599, descriptionPoints: ['Cooling diagnosis', 'Part repair'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac6', title: 'AC Water Leakage Repair', rating: 4.7, reviews: '9k', price: 399, descriptionPoints: ['Drain pipe clearing', 'Leakage fix'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac7', title: 'AC PCB Repair', rating: 4.9, reviews: '5k', price: 1499, descriptionPoints: ['Electronic board repair', 'Testing'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac8', title: 'AC Fan Motor Repair', rating: 4.8, reviews: '7k', price: 999, descriptionPoints: ['Motor check', 'Part replacement'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac9', title: 'AC Deep Cleaning', rating: 4.9, reviews: '18k', price: 899, descriptionPoints: ['Jet pump cleaning', 'Full sanitization'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac10', title: 'Window AC Service', rating: 4.8, reviews: '10k', price: 449, descriptionPoints: ['Full service', 'Filter cleaning'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac11', title: 'Split AC Service', rating: 4.9, reviews: '20k', price: 549, descriptionPoints: ['Indoor & outdoor service', 'Cooling check'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'cyan'
  },
  { 
    id: '3', 
    name: 'Cleaning', 
    icon: 'brush', 
    priceStart: 399, 
    image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'clean-general',
        title: 'Cleaning Services',
        icon: 'brush',
        items: [
          { id: 'c1', title: 'Full Home Cleaning', rating: 4.9, reviews: '30k', price: 2999, descriptionPoints: ['Deep cleaning', 'Sanitization'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c2', title: 'Kitchen Deep Cleaning', rating: 4.8, reviews: '15k', price: 899, descriptionPoints: ['Degreasing', 'Cabinet cleaning'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c3', title: 'Bathroom Deep Cleaning', rating: 4.7, reviews: '18k', price: 399, descriptionPoints: ['Stain removal', 'Floor scrubbing'], image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=400&auto=format&fit=crop' },
          { id: 'c4', title: 'Sofa Cleaning', rating: 4.7, reviews: '12k', price: 599, descriptionPoints: ['Vacuuming', 'Shampooing'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c5', title: 'Carpet Cleaning', rating: 4.8, reviews: '10k', price: 499, descriptionPoints: ['Deep vacuuming', 'Stain removal'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c6', title: 'Mattress Cleaning', rating: 4.7, reviews: '8k', price: 699, descriptionPoints: ['Dust mite removal', 'Sanitization'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c7', title: 'Balcony Cleaning', rating: 4.6, reviews: '5k', price: 399, descriptionPoints: ['Floor scrubbing', 'Railing cleaning'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c8', title: 'Water Tank Cleaning', rating: 4.9, reviews: '12k', price: 999, descriptionPoints: ['Deep cleaning', 'Sediment removal'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c9', title: 'Office Cleaning', rating: 4.8, reviews: '7k', price: 1999, descriptionPoints: ['Desk cleaning', 'Floor mopping'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
          { id: 'c10', title: 'Move-in Move-out Cleaning', rating: 4.9, reviews: '20k', price: 3499, descriptionPoints: ['Full deep cleaning', 'Ready for move'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'emerald'
  },
  { 
    id: '4', 
    name: 'Electrician', 
    icon: 'zap', 
    priceStart: 99, 
    image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'elec-general',
        title: 'Electrical Services',
        icon: 'zap',
        items: [
          { id: 'e1', title: 'Switch Repair', rating: 4.8, reviews: '10k', price: 99, descriptionPoints: ['Switch check', 'Replacement'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e2', title: 'Switchboard Installation', rating: 4.7, reviews: '12k', price: 299, descriptionPoints: ['New board setup', 'Wiring'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e3', title: 'Fan Installation', rating: 4.8, reviews: '15k', price: 199, descriptionPoints: ['Ceiling fan setup', 'Testing'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e4', title: 'Fan Repair', rating: 4.6, reviews: '8k', price: 149, descriptionPoints: ['Motor check', 'Capacitor replacement'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e5', title: 'Light Installation', rating: 4.8, reviews: '20k', price: 149, descriptionPoints: ['Fixture mounting', 'Wiring'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e6', title: 'Wiring Work', rating: 4.9, reviews: '5k', price: 999, descriptionPoints: ['Full wiring check', 'New wiring setup'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e7', title: 'Inverter Installation', rating: 4.8, reviews: '6k', price: 499, descriptionPoints: ['Battery setup', 'Connection testing'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e8', title: 'Doorbell Installation', rating: 4.7, reviews: '4k', price: 199, descriptionPoints: ['Bell setup', 'Wiring'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e9', title: 'MCB Fuse Repair', rating: 4.9, reviews: '10k', price: 249, descriptionPoints: ['Fuse check', 'Replacement'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e10', title: 'Short Circuit Issue', rating: 4.8, reviews: '12k', price: 599, descriptionPoints: ['Diagnosis', 'Fault repair'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
          { id: 'e11', title: 'Decorative Light Installation', rating: 4.9, reviews: '7k', price: 299, descriptionPoints: ['Festive lights', 'Chandelier setup'], image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'amber'
  },
  { 
    id: '5', 
    name: 'Appliances', 
    icon: 'wrench', 
    priceStart: 299, 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    category: 'Appliances',
    subCategories: [
      {
        id: 'app-wm',
        title: 'Washing Machine',
        icon: 'waves',
        items: [
          { id: 'wm1', title: 'Machine Not Starting', rating: 4.8, reviews: '5k', price: 299, descriptionPoints: ['Power check', 'PCB diagnosis'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'wm2', title: 'Not Spinning / Drying', rating: 4.7, reviews: '4k', price: 399, descriptionPoints: ['Belt check', 'Motor inspection'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'wm3', title: 'Water Leakage', rating: 4.6, reviews: '3k', price: 249, descriptionPoints: ['Pipe check', 'Seal replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'wm4', title: 'Noise Issue', rating: 4.7, reviews: '6k', price: 349, descriptionPoints: ['Bearing check', 'Drum alignment'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'wm5', title: 'Drainage Issue', rating: 4.8, reviews: '4k', price: 299, descriptionPoints: ['Pump cleaning', 'Blockage removal'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-ref',
        title: 'Refrigerator',
        icon: 'refrigerator',
        items: [
          { id: 'ref1', title: 'Not Cooling', rating: 4.9, reviews: '8k', price: 499, descriptionPoints: ['Gas check', 'Compressor diagnosis'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'ref2', title: 'Excessive Noise', rating: 4.7, reviews: '3k', price: 399, descriptionPoints: ['Fan check', 'Compressor mounting'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'ref3', title: 'Water Leakage', rating: 4.6, reviews: '2k', price: 299, descriptionPoints: ['Drain pipe clearing', 'Tray check'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'ref4', title: 'Gas Refill', rating: 4.8, reviews: '5k', price: 2499, descriptionPoints: ['Leakage fix', 'Gas charging'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-tv',
        title: 'Television',
        icon: 'tv',
        items: [
          { id: 'tv1', title: 'No Display / Black Screen', rating: 4.8, reviews: '6k', price: 599, descriptionPoints: ['Backlight check', 'Panel diagnosis'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv2', title: 'No Sound', rating: 4.7, reviews: '3k', price: 399, descriptionPoints: ['Speaker check', 'Audio IC repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv3', title: 'Screen Lines Issue', rating: 4.6, reviews: '2k', price: 899, descriptionPoints: ['COF bonding check', 'Panel repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv4', title: 'Panel Damage', rating: 4.5, reviews: '1k', price: 2999, descriptionPoints: ['Panel replacement', 'Testing'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv5', title: 'Remote Not Working', rating: 4.8, reviews: '4k', price: 199, descriptionPoints: ['Sensor check', 'Remote replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv6', title: 'HDMI Port Not Working', rating: 4.7, reviews: '2k', price: 499, descriptionPoints: ['Port replacement', 'Soldering'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv7', title: 'Smart TV Software Issue', rating: 4.9, reviews: '5k', price: 699, descriptionPoints: ['OS reinstallation', 'App fix'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv8', title: 'TV Not Powering On', rating: 4.8, reviews: '7k', price: 499, descriptionPoints: ['Power supply check', 'Fuse replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'tv9', title: 'Wall Mount Installation', rating: 4.9, reviews: '15k', price: 399, descriptionPoints: ['Professional mounting', 'Level check'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-mw',
        title: 'Microwave',
        icon: 'microwave',
        items: [
          { id: 'mw1', title: 'Not Heating', rating: 4.8, reviews: '4k', price: 399, descriptionPoints: ['Magnetron check', 'Transformer diagnosis'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'mw2', title: 'Buttons Not Working', rating: 4.7, reviews: '2k', price: 299, descriptionPoints: ['Touchpad replacement', 'PCB repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'mw3', title: 'Sparking Inside', rating: 4.6, reviews: '1k', price: 349, descriptionPoints: ['Mica sheet replacement', 'Cleaning'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-ch',
        title: 'Chimney',
        icon: 'wind',
        items: [
          { id: 'ch1', title: 'Deep Cleaning', rating: 4.9, reviews: '10k', price: 899, descriptionPoints: ['Filter cleaning', 'Blower cleaning'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'ch2', title: 'Suction Issue', rating: 4.7, reviews: '3k', price: 499, descriptionPoints: ['Motor check', 'Duct cleaning'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-st',
        title: 'Stove',
        icon: 'flame',
        items: [
          { id: 'st1', title: 'Burner Issue', rating: 4.8, reviews: '5k', price: 199, descriptionPoints: ['Cleaning', 'Nozzle replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'st2', title: 'Gas Leakage', rating: 4.9, reviews: '4k', price: 399, descriptionPoints: ['Pipe check', 'Valve repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-lt',
        title: 'Laptop',
        icon: 'laptop',
        items: [
          { id: 'lt1', title: 'Screen Replacement', rating: 4.8, reviews: '3k', price: 2999, descriptionPoints: ['New panel', 'Testing'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'lt2', title: 'Keyboard Repair', rating: 4.7, reviews: '2k', price: 899, descriptionPoints: ['Key fix', 'Replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'lt3', title: 'Battery Issue', rating: 4.6, reviews: '4k', price: 1499, descriptionPoints: ['Battery replacement', 'Charging check'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'lt4', title: 'Software/OS Fix', rating: 4.9, reviews: '6k', price: 599, descriptionPoints: ['OS install', 'Virus removal'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-wp',
        title: 'Water Purifier',
        icon: 'droplet',
        items: [
          { id: 'wp1', title: 'Filter Replacement', rating: 4.9, reviews: '12k', price: 1499, descriptionPoints: ['RO/UV filter change', 'Full service'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'wp2', title: 'Not Working', rating: 4.7, reviews: '5k', price: 399, descriptionPoints: ['Power check', 'Pump repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-gy',
        title: 'Geyser',
        icon: 'flame',
        items: [
          { id: 'gy1', title: 'Not Heating', rating: 4.8, reviews: '6k', price: 399, descriptionPoints: ['Element check', 'Thermostat fix'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'gy2', title: 'Water Leakage', rating: 4.7, reviews: '4k', price: 299, descriptionPoints: ['Tank check', 'Pipe repair'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'app-ac',
        title: 'Air Cooler',
        icon: 'wind',
        items: [
          { id: 'ac1', title: 'Motor Repair', rating: 4.7, reviews: '5k', price: 499, descriptionPoints: ['Motor check', 'Replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac2', title: 'Pump Issue', rating: 4.8, reviews: '4k', price: 199, descriptionPoints: ['Pump cleaning', 'Replacement'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      },
    ],
    color: 'indigo'
  },
  { 
    id: '6', 
    name: 'Gardening', 
    icon: 'flower', 
    priceStart: 299, 
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'garden-general',
        title: 'Gardening Services',
        icon: 'flower',
        items: [
          { id: 'g1', title: 'Lawn Mowing', rating: 4.8, reviews: '5k', price: 499, descriptionPoints: ['Professional mowing', 'Grass trimming'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g2', title: 'Plant Pruning', rating: 4.7, reviews: '3k', price: 299, descriptionPoints: ['Shrub trimming', 'Waste removal'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g3', title: 'Garden Maintenance', rating: 4.9, reviews: '8k', price: 999, descriptionPoints: ['Weeding', 'Fertilizing', 'Soil check'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g4', title: 'Hedge Trimming', rating: 4.7, reviews: '4k', price: 399, descriptionPoints: ['Shape maintenance', 'Clean finish'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'green'
  },
  { 
    id: '7', 
    name: 'Vehicle', 
    icon: 'car', 
    priceStart: 199, 
    image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=800&auto=format&fit=crop',
    category: 'Vehicle',
    subCategories: [
      {
        id: 'veh-general',
        title: 'Vehicle Services',
        icon: 'car',
        items: [
          { id: 'v1', title: 'Car Wash', rating: 4.9, reviews: '20k', price: 399, descriptionPoints: ['Exterior wash', 'Interior vacuum'], image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=400&auto=format&fit=crop' },
          { id: 'v2', title: 'Bike Service', rating: 4.8, reviews: '15k', price: 599, descriptionPoints: ['Oil change', 'Brake check'], image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=400&auto=format&fit=crop' },
          { id: 'v3', title: 'Car Repair', rating: 4.7, reviews: '8k', price: 999, descriptionPoints: ['Engine check', 'Suspension fix'], image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=400&auto=format&fit=crop' },
          { id: 'v4', title: 'Battery Replacement', rating: 4.9, reviews: '5k', price: 2499, descriptionPoints: ['New battery', 'Installation'], image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=400&auto=format&fit=crop' },
          { id: 'v5', title: 'Tyre Replacement', rating: 4.8, reviews: '4k', price: 1999, descriptionPoints: ['New tyre', 'Alignment check'], image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'slate'
  },
  { 
    id: '8', 
    name: 'Pest Control', 
    icon: 'bug', 
    priceStart: 599, 
    image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'pest-general',
        title: 'Pest Control',
        icon: 'bug',
        items: [
          { id: 'pc1', title: 'Cockroach Control', rating: 4.8, reviews: '12k', price: 799, descriptionPoints: ['Gel treatment', 'Spray service'], image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=400&auto=format&fit=crop' },
          { id: 'pc2', title: 'Termite Control', rating: 4.7, reviews: '8k', price: 1999, descriptionPoints: ['Drill-Fill-Seal', 'Warranty included'], image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=400&auto=format&fit=crop' },
          { id: 'pc3', title: 'Bed Bug Control', rating: 4.6, reviews: '6k', price: 1499, descriptionPoints: ['Two-stage spray', 'Deep inspection'], image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=400&auto=format&fit=crop' },
          { id: 'pc4', title: 'Rodent Control', rating: 4.7, reviews: '4k', price: 899, descriptionPoints: ['Baiting', 'Trapping'], image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=400&auto=format&fit=crop' },
          { id: 'pc5', title: 'Mosquito Control', rating: 4.8, reviews: '10k', price: 699, descriptionPoints: ['Fogging', 'Larvicide'], image: 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'orange'
  },
  { 
    id: '9', 
    name: 'Carpenter', 
    icon: 'hammer', 
    priceStart: 149, 
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'carp-general',
        title: 'Carpentry Services',
        icon: 'hammer',
        items: [
          { id: 'cp1', title: 'Furniture Repair', rating: 4.8, reviews: '10k', price: 299, descriptionPoints: ['Door repair', 'Hinge replacement'], image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=400&auto=format&fit=crop' },
          { id: 'cp2', title: 'Furniture Assembly', rating: 4.9, reviews: '8k', price: 499, descriptionPoints: ['Bed assembly', 'Wardrobe setup'], image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=400&auto=format&fit=crop' },
          { id: 'cp3', title: 'Lock Installation', rating: 4.7, reviews: '6k', price: 399, descriptionPoints: ['New lock setup', 'Handle fix'], image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=400&auto=format&fit=crop' },
          { id: 'cp4', title: 'Polishing & Varnishing', rating: 4.8, reviews: '4k', price: 999, descriptionPoints: ['Wood polish', 'Varnish coat'], image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'stone'
  },
  { 
    id: '10', 
    name: 'Home Security', 
    icon: 'shield', 
    priceStart: 999, 
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'sec-general',
        title: 'Security Services',
        icon: 'shield',
        items: [
          { id: 's1', title: 'CCTV Installation', rating: 4.9, reviews: '5k', price: 1999, descriptionPoints: ['Camera setup', 'DVR configuration'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
          { id: 's2', title: 'Video Door Phone', rating: 4.8, reviews: '2k', price: 2499, descriptionPoints: ['Screen setup', 'Wiring'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
          { id: 's3', title: 'Security Alarm System', rating: 4.7, reviews: '1k', price: 3999, descriptionPoints: ['Sensor setup', 'Hub configuration'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'red'
  },
  { 
    id: '11', 
    name: 'Packers & Movers', 
    icon: 'package', 
    priceStart: 2999, 
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'pm-general',
        title: 'Moving Services',
        icon: 'package',
        items: [
          { id: 'pm1', title: 'Local Shifting', rating: 4.8, reviews: '15k', price: 4999, descriptionPoints: ['Packing', 'Loading', 'Unloading'], image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=400&auto=format&fit=crop' },
          { id: 'pm2', title: 'Intercity Shifting', rating: 4.7, reviews: '5k', price: 9999, descriptionPoints: ['Safe transport', 'Insurance included'], image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=400&auto=format&fit=crop' },
          { id: 'pm3', title: 'Office Shifting', rating: 4.9, reviews: '3k', price: 7999, descriptionPoints: ['IT equipment packing', 'Quick setup'], image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'brown'
  },
  { 
    id: '12', 
    name: 'Civil Work', 
    icon: 'construction', 
    priceStart: 499, 
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'civil-general',
        title: 'Civil Services',
        icon: 'construction',
        items: [
          { id: 'cw1', title: 'Wall Painting', rating: 4.9, reviews: '20k', price: 999, descriptionPoints: ['Surface preparation', 'Double coat'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=400&auto=format&fit=crop' },
          { id: 'cw2', title: 'Tiling Work', rating: 4.8, reviews: '10k', price: 1499, descriptionPoints: ['Floor tiling', 'Wall tiling'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=400&auto=format&fit=crop' },
          { id: 'cw3', title: 'Waterproofing', rating: 4.7, reviews: '8k', price: 2999, descriptionPoints: ['Terrace waterproofing', 'Bathroom sealing'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=400&auto=format&fit=crop' },
          { id: 'cw4', title: 'Masonry Work', rating: 4.8, reviews: '12k', price: 1999, descriptionPoints: ['Brick work', 'Plastering'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'yellow'
  },
  { 
    id: '13', 
    name: 'Smart Home', 
    icon: 'home', 
    priceStart: 499, 
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'smart-general',
        title: 'Smart Home Setup',
        icon: 'home',
        items: [
          { id: 'sh1', title: 'Smart Lock Installation', rating: 4.9, reviews: '3k', price: 1499, descriptionPoints: ['Professional mounting', 'App configuration'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
          { id: 'sh2', title: 'Smart Lighting Setup', rating: 4.8, reviews: '2k', price: 999, descriptionPoints: ['Hub configuration', 'Voice assistant sync'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
          { id: 'sh3', title: 'Voice Assistant Sync', rating: 4.9, reviews: '5k', price: 499, descriptionPoints: ['Alexa/Google Home setup', 'Device linking'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'purple'
  },
  { 
    id: '14', 
    name: 'Pet Grooming', 
    icon: 'dog', 
    priceStart: 599, 
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800&auto=format&fit=crop',
    category: 'Personal',
    subCategories: [
      {
        id: 'pet-general',
        title: 'Pet Grooming',
        icon: 'dog',
        items: [
          { id: 'pg1', title: 'Dog Bath & Brush', rating: 4.9, reviews: '5k', price: 799, descriptionPoints: ['Shampooing', 'Blow dry', 'Brushing'], image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop' },
          { id: 'pg2', title: 'Full Grooming', rating: 4.8, reviews: '3k', price: 1499, descriptionPoints: ['Haircut', 'Nail clipping', 'Ear cleaning'], image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop' },
          { id: 'pg3', title: 'Cat Grooming', rating: 4.7, reviews: '2k', price: 999, descriptionPoints: ['Gentle bath', 'Coat maintenance'], image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'pink'
  },
  { 
    id: '15', 
    name: 'Interior Design', 
    icon: 'layout', 
    priceStart: 999, 
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'int-general',
        title: 'Interior Consultation',
        icon: 'layout',
        items: [
          { id: 'id1', title: '1 Room Consultation', rating: 4.9, reviews: '2k', price: 999, descriptionPoints: ['Space planning', 'Color palette', 'Furniture layout'], image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=400&auto=format&fit=crop' },
          { id: 'id2', title: 'Full Home Design', rating: 4.8, reviews: '1k', price: 4999, descriptionPoints: ['3D visualization', 'Material selection'], image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=400&auto=format&fit=crop' },
          { id: 'id3', title: 'Kitchen Design', rating: 4.9, reviews: '3k', price: 2499, descriptionPoints: ['Modular kitchen layout', 'Storage optimization'], image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'teal'
  },
  { 
    id: '16', 
    name: 'Solar Panel', 
    icon: 'sun', 
    priceStart: 1499, 
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'solar-general',
        title: 'Solar Services',
        icon: 'sun',
        items: [
          { id: 'sol1', title: 'Solar Panel Cleaning', rating: 4.8, reviews: '1k', price: 1499, descriptionPoints: ['Dust removal', 'Efficiency check'], image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=400&auto=format&fit=crop' },
          { id: 'sol2', title: 'Solar Installation', rating: 4.9, reviews: '500', price: 9999, descriptionPoints: ['Panel mounting', 'Inverter setup'], image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=400&auto=format&fit=crop' },
          { id: 'sol3', title: 'Solar Maintenance', rating: 4.7, reviews: '800', price: 2999, descriptionPoints: ['Wiring check', 'Performance audit'], image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'yellow'
  },
  { 
    id: '17', 
    name: 'Home Automation', 
    icon: 'cpu', 
    priceStart: 1999, 
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'auto-general',
        title: 'Automation Setup',
        icon: 'cpu',
        items: [
          { id: 'ha1', title: 'Full Home Automation', rating: 4.9, reviews: '500', price: 9999, descriptionPoints: ['Voice control', 'Remote access', 'Security sync'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=400&auto=format&fit=crop' },
          { id: 'ha2', title: 'Smart Lighting Setup', rating: 4.8, reviews: '1k', price: 4999, descriptionPoints: ['App control', 'Scene setting'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=400&auto=format&fit=crop' },
          { id: 'ha3', title: 'Smart Curtain Setup', rating: 4.7, reviews: '300', price: 2999, descriptionPoints: ['Motorized track', 'Remote control'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'cyan'
  },
  { 
    id: '18', 
    name: 'Physiotherapy', 
    icon: 'activity', 
    priceStart: 799, 
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop',
    category: 'Personal',
    subCategories: [
      {
        id: 'physio-general',
        title: 'Physiotherapy at Home',
        icon: 'activity',
        items: [
          { id: 'ph1', title: 'Single Session (45 min)', rating: 4.9, reviews: '3k', price: 799, descriptionPoints: ['Pain management', 'Exercise therapy'], image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=400&auto=format&fit=crop' },
          { id: 'ph2', title: 'Post-Surgery Rehab', rating: 4.8, reviews: '1k', price: 999, descriptionPoints: ['Mobility training', 'Recovery plan'], image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=400&auto=format&fit=crop' },
          { id: 'ph3', title: 'Elderly Care Session', rating: 4.9, reviews: '2k', price: 899, descriptionPoints: ['Balance training', 'Strength exercises'], image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'emerald'
  },
  { 
    id: '19', 
    name: 'Salon for Men', 
    icon: 'scissors', 
    priceStart: 299, 
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
    category: 'Personal',
    subCategories: [
      {
        id: 'salon-men-general',
        title: 'Men\'s Salon',
        icon: 'scissors',
        items: [
          { id: 'sm1', title: 'Haircut & Styling', rating: 4.8, reviews: '10k', price: 299, descriptionPoints: ['Professional stylist', 'Hair wash included'], image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=400&auto=format&fit=crop' },
          { id: 'sm2', title: 'Beard Trimming', rating: 4.7, reviews: '8k', price: 199, descriptionPoints: ['Shape maintenance', 'Aftershave care'], image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=400&auto=format&fit=crop' },
          { id: 'sm3', title: 'Face Massage', rating: 4.9, reviews: '5k', price: 399, descriptionPoints: ['Relaxing treatment', 'Skin hydration'], image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=400&auto=format&fit=crop' },
          { id: 'sm4', title: 'Hair Color', rating: 4.8, reviews: '4k', price: 599, descriptionPoints: ['Ammonia-free color', 'Even coverage'], image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'blue'
  },
  { 
    id: '20', 
    name: 'Salon for Women', 
    icon: 'scissors', 
    priceStart: 499, 
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
    category: 'Personal',
    subCategories: [
      {
        id: 'salon-women-general',
        title: 'Women\'s Salon',
        icon: 'scissors',
        items: [
          { id: 'sw1', title: 'Facial & Cleanup', rating: 4.9, reviews: '15k', price: 999, descriptionPoints: ['Skin analysis', 'Deep cleansing'], image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=400&auto=format&fit=crop' },
          { id: 'sw2', title: 'Hair Spa', rating: 4.8, reviews: '10k', price: 1499, descriptionPoints: ['Nourishing treatment', 'Steam & massage'], image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=400&auto=format&fit=crop' },
          { id: 'sw3', title: 'Manicure & Pedicure', rating: 4.7, reviews: '12k', price: 899, descriptionPoints: ['Nail shaping', 'Exfoliation'], image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=400&auto=format&fit=crop' },
          { id: 'sw4', title: 'Threading & Waxing', rating: 4.9, reviews: '25k', price: 199, descriptionPoints: ['Precise shaping', 'Smooth finish'], image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'rose'
  },
];

import { CustomerApp } from '../components/CustomerApp';
import { WorkerApp } from '../components/WorkerApp';
import { WorkerRegistration } from '../components/WorkerRegistration';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'customer' | 'worker'>('customer');
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    const q = query(collection(db, 'order'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          userId: data.userId,
          cartItems: data.cartItems,
          grandTotal: data.grandTotal,
          address: data.address,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          isInstant: data.isInstant || false,
          instructions: data.instructions,
          imageUrl: data.imageUrl,
          status: data.status,
          interestedWorkers: data.interestedWorkers || [],
          assignedWorkerId: data.assignedWorkerId,
          workerName: data.workerName,
          workerPhoto: data.workerPhoto,
          createdAt: data.createdAt,
          rating: data.rating
        });
      });
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'order');
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchOrders = async () => {
    // Now handled by onSnapshot in useEffect
  };

  const handleCancelOrder = async (order: Booking) => {
    if (!user || !order?.id) return;
    setCancelling(true);
    try {
      const orderRef = doc(db, 'order', order.id);
      await updateDoc(orderRef, { status: 'cancelled' });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `order/${order.id}`);
    } finally {
      setCancelling(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile(docSnap.data() as UserProfile);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-red-600 font-bold">Loading OrGo...</div>;

  if (!user) return <Auth onLoginSuccess={() => {}} />;

  // If professional but no skills, they might need registration (or we can just let them in)
  // The user requested a specific registration flow.
  if (profile?.role === 'professional' && (!profile.skills || profile.skills.length === 0)) {
    return (
      <WorkerRegistration 
        user={user} 
        profile={profile} 
        onComplete={fetchProfile} 
        onBack={() => signOut(auth)} 
        navigate={() => {}} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto relative shadow-2xl">
      <NotificationHandler />
      <AnimatePresence mode="wait">
        {activeMode === 'worker' && profile?.role === 'professional' ? (
          <WorkerApp 
            key="worker-app"
            user={user} 
            profile={profile} 
            onSwitchMode={() => setActiveMode('customer')} 
            onLogout={() => signOut(auth)}
            fetchProfile={fetchProfile}
          />
        ) : (
          <CustomerApp 
            key="customer-app"
            user={user}
            profile={profile}
            onLogout={() => signOut(auth)}
            fetchProfile={fetchProfile}
            orders={orders}
            loadingOrders={loadingOrders}
            fetchOrders={fetchOrders}
            handleCancelOrder={handleCancelOrder}
            cancelling={cancelling}
            setActiveMode={setActiveMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
