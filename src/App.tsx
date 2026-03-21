import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null); 
  const { cart, addToCart, removeFromCart, getItemQuantity, cartTotal, clearCart } = useCart();
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderToCancel, setOrderToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        setUser(null);
        setLoading(false);
        setView(AppView.AUTH);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      if (!currentUser) setView(AppView.AUTH);
      else if (view === AppView.AUTH) setView(AppView.HOME);
    });
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    if (user && view === AppView.ORDERS) {
      fetchOrders();
    }
  }, [user, view]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const q = query(collection(db, 'order'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
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
          instructions: data.instructions,
          imageUrl: data.imageUrl,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      setOrders(fetchedOrders);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'order');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !user) return;
    setCancelling(true);
    try {
      const orderRef = doc(db, 'order', orderToCancel.id);
      await updateDoc(orderRef, { status: 'Cancelled' });
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderToCancel.id ? { ...o, status: 'Cancelled' } : o));
      setOrderToCancel(null);
    } catch (error) {
      console.error("Error cancelling order:", error);
      handleFirestoreError(error, OperationType.UPDATE, `order/${orderToCancel.id}`);
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

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    if (category.subCategories.length === 1) {
      setSelectedSubCategory(category.subCategories[0]);
      setView(AppView.SERVICE_DETAILS);
    } else {
      setView(AppView.SUB_CATEGORY);
    }
  };

  const handleSubCategoryClick = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setView(AppView.SERVICE_DETAILS);
  };

  const handleViewCart = () => {
    setView(AppView.CART);
  };

  const handleBookingComplete = () => {
    setView(AppView.TRACKING);
    setSelectedService(null);
    clearCart(); // Clear cart after booking
    fetchOrders(); // Refresh orders after new booking
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView(AppView.AUTH);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-red-600 font-bold">Loading OrGo...</div>;

  if (!user) return <Auth onLoginSuccess={() => setView(AppView.HOME)} />;

  // --- Views ---

  const getIcon = (iconName: string, color?: string) => {
    const iconProps = { 
      size: 24, 
      className: color ? `text-${color}-500` : 'text-primary',
      strokeWidth: 2.5
    };

    switch (iconName) {
      case 'droplet': return <Droplet {...iconProps} />;
      case 'wind': return <Wind {...iconProps} />;
      case 'brush': return <Brush {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'wrench': return <Wrench {...iconProps} />;
      case 'waves': return <Waves {...iconProps} />;
      case 'refrigerator': return <Refrigerator {...iconProps} />;
      case 'tv': return <Tv {...iconProps} />;
      case 'microwave': return <Microwave {...iconProps} />;
      case 'flame': return <Flame {...iconProps} />;
      case 'laptop': return <Laptop {...iconProps} />;
      case 'flower': return <Flower {...iconProps} />;
      case 'car': return <Car {...iconProps} />;
      case 'bike': return <Bike {...iconProps} />;
      case 'bug': return <Bug {...iconProps} />;
      case 'hammer': return <Hammer {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'package': return <Package {...iconProps} />;
      case 'construction': return <Construction {...iconProps} />;
      case 'home': return <Home {...iconProps} />;
      case 'dog': return <Dog {...iconProps} />;
      case 'layout': return <Layout {...iconProps} />;
      case 'sun': return <Sun {...iconProps} />;
      case 'cpu': return <Cpu {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      case 'scissors': return <Scissors {...iconProps} />;
      default: return <Wrench {...iconProps} />;
    }
  };

  const renderHome = () => {
    const categories = ['All', 'Home', 'Appliances', 'Vehicle', 'Outdoor'];
    
    const filteredServices = activeCategory === 'All' 
      ? CATEGORIES 
      : CATEGORIES.filter(s => s.category === activeCategory);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-32 bg-white"
      >
        {/* Location Header */}
        <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <div 
              onClick={() => alert('Location Selection')}
              className="flex flex-col cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-primary" strokeWidth={2.5} />
                <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Home</span>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 font-medium truncate max-w-[220px] mt-0.5">B-12, Vaishali Nagar, Jaipur, Rajasthan 302021</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-700" strokeWidth={2.5} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button 
                onClick={() => setView(AppView.ACCOUNT)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-gray-500" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Search Bar - UC Style */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="Search for 'AC Repair'..."
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all shadow-inner-soft"
            />
          </div>
        </div>

        <div className="space-y-8 pt-6">
          {/* Hero Banner - Gradient Style */}
          <div className="px-5">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative h-48 rounded-[32px] overflow-hidden group shadow-depth"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-red-900"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative h-full flex flex-col justify-center px-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-4 w-fit border border-white/10">
                  <Sparkles size={12} /> Special Offer
                </div>
                <h2 className="text-3xl font-bold text-white font-display leading-tight mb-2">Up to 50% OFF<br/>on First Booking</h2>
                <p className="text-white/70 text-sm font-medium">Professional services at your doorstep</p>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 blur-3xl"></div>
            </motion.div>
          </div>

          {/* Categories - Horizontal Scroll */}
          <div className="mt-10">
            <div className="px-5 flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 font-display">Service Categories</h3>
              <button className="text-primary text-sm font-bold hover:underline">See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pb-4">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-soft active:scale-95 whitespace-nowrap border ${
                    activeCategory === cat 
                      ? 'bg-primary text-white border-primary shadow-primary/20' 
                      : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid - Modern Layout */}
          <div className="px-5">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service) => (
                  <motion.div 
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(service)}
                    className="group relative bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-soft cursor-pointer"
                  >
                    <div className="aspect-[4/5] relative">
                      <img 
                        src={service.image} 
                        alt={service.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      {service.tag && (
                        <div className={`absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-bold text-${service.color}-500 uppercase tracking-wider shadow-sm`}>
                          {service.tag}
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-white font-bold text-lg font-display mb-0.5">{service.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Starts at ₹{service.priceStart}</p>
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                            <ChevronRight size={16} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-gray-50 py-10 px-5 grid grid-cols-3 gap-4 border-y border-gray-100">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">UC Safe<br/>Guarantee</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                <Star size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">4.8 Average<br/>Rating</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                <Clock size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">On-Time<br/>Service</span>
            </div>
          </div>

          {/* Refer & Earn - Gradient Style */}
          <div className="px-5 pb-8">
            <div className="bg-gradient-to-r from-red-600 to-primary rounded-[32px] p-7 flex items-center justify-between shadow-lg shadow-primary/20 relative overflow-hidden">
              <div className="relative z-10 max-w-[65%]">
                <h4 className="text-white font-bold text-lg mb-1 font-display">Refer & Earn ₹100</h4>
                <p className="text-white/80 text-xs font-medium">Get rewards for every friend you invite to OrGo</p>
              </div>
              <div className="relative z-10 w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                <Copy size={24} strokeWidth={2.5} />
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Trending Services - Horizontal Scroll */}
          <div className="px-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 font-display">Trending Services</h3>
              <button className="text-primary text-sm font-bold hover:underline">View all</button>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
              {CATEGORIES.slice(0, 5).map((s) => (
                <motion.div 
                  key={s.id + '-trend'} 
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryClick(s)}
                  className="min-w-[200px] bg-white rounded-[32px] border border-gray-100 shadow-soft overflow-hidden group cursor-pointer active:scale-95 transition-all"
                >
                    <div className="h-32 bg-gray-100 relative">
                      <img src={s.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      {s.tag && (
                        <div className={`absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-${s.color}-500 uppercase tracking-wider shadow-sm`}>
                          {s.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-sm font-bold text-gray-900 mb-1 font-display">{s.name}</p>
                      <p className={`text-xs text-${s.color}-500 font-bold`}>Starts at ₹{s.priceStart}</p>
                    </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSubCategory = () => {
    if (!selectedCategory) return null;

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="min-h-screen bg-white pb-32"
      >
        <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50 flex items-center gap-4">
          <button onClick={() => setView(AppView.HOME)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 font-display">{selectedCategory.name}</h2>
        </div>

        <div className="p-5 grid grid-cols-3 gap-4">
          {selectedCategory.subCategories.map((sub) => (
            <motion.div
              key={sub.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubCategoryClick(sub)}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                {sub.image ? (
                  <img src={sub.image} alt={sub.title} className="w-full h-full object-cover" />
                ) : (
                  getIcon(sub.icon, selectedCategory.color)
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">{sub.title}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderServiceDetails = () => {
    if (!selectedSubCategory) return null;

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="min-h-screen bg-gray-50 pb-40"
      >
        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (selectedCategory && selectedCategory.subCategories.length === 1) {
                  setView(AppView.HOME);
                } else {
                  setView(AppView.SUB_CATEGORY);
                }
              }} 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 font-display">{selectedSubCategory.title}</h2>
          </div>
          <button className="p-2 bg-gray-50 rounded-full">
            <Search size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Trust Banner */}
        <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">UC Safe Guarantee</p>
            <p className="text-[10px] text-gray-500 font-medium">Professional & verified experts only</p>
          </div>
        </div>

        {/* Service Items */}
        <div className="p-5 space-y-4">
          {selectedSubCategory.items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 leading-tight">{item.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700">
                    <Star size={10} className="fill-gray-700" /> {item.rating}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{item.reviews} reviews</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-4">₹{item.price}</p>
                <ul className="space-y-2">
                  {item.descriptionPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-500 font-medium">
                      <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-28 flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gray-100">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                
                {getItemQuantity(item.id) > 0 ? (
                  <div className="flex items-center justify-between w-full bg-primary/10 rounded-xl p-1 border border-primary/20">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="text-sm font-bold text-primary">{getItemQuantity(item.id)}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-primary text-xs font-bold shadow-sm hover:border-primary transition-colors active:scale-95"
                  >
                    ADD
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderCart = () => (
    <Cart 
      onClose={() => setView(AppView.SUB_CATEGORY)} 
      setView={setView} 
    />
  );

  const renderCheckout = () => (
    <Checkout 
      onClose={() => setView(AppView.CART)} 
      setView={setView} 
    />
  );

  const renderOrders = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 bg-gray-50 min-h-screen"
    >
      <div className="bg-white px-5 pt-6 pb-5 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 font-display">My Bookings</h2>
          <button 
            onClick={fetchOrders} 
            disabled={loadingOrders} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-primary active:scale-90 transition-transform"
          >
            <RefreshCw size={18} className={loadingOrders ? "animate-spin" : ""} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        {orders.length === 0 && !loadingOrders ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <ClipboardList size={40} className="text-gray-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">No bookings yet</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">You haven't booked any services yet.</p>
            <button onClick={() => setView(AppView.HOME)} className="btn-primary px-8">Book a service</button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 group active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 font-display">
                    {order.cartItems?.[0]?.title || 'Home Service'} 
                    {order.cartItems && order.cartItems.length > 1 && ` +${order.cartItems.length - 1} more`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock size={12} strokeWidth={2.5} />
                    <span>{order.scheduledDate} • {order.scheduledTime}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-gray-500 mb-5 bg-gray-50 p-3 rounded-xl">
                <MapPin size={14} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                <span className="truncate">{order.address}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Paid</span>
                  <span className="text-lg font-bold text-gray-900 font-display">₹{order.grandTotal}</span>
                </div>
                <div className="flex items-center gap-4">
                  {order.status === 'Active' && (
                    <button 
                      onClick={() => setOrderToCancel(order)}
                      className="text-red-500 text-sm font-bold hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => setView(AppView.TRACKING)}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    View Details <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToCancel(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={36} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2 font-display">Cancel Booking?</h3>
              <p className="text-gray-500 text-center text-sm font-medium mb-8 leading-relaxed">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
                <button 
                  onClick={() => setOrderToCancel(null)}
                  className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  Keep Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 bg-gray-50 min-h-screen"
    >
      <div className="bg-primary p-10 text-white rounded-b-[40px] mb-8 shadow-lg shadow-primary/20">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">UC Wallet Balance</p>
            <h2 className="text-4xl font-bold font-display">₹1,240</h2>
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex gap-4">
          <button className="flex-1 bg-white text-primary py-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-transform">Add Money</button>
          <button className="flex-1 bg-white/10 backdrop-blur-md py-3.5 rounded-2xl font-bold text-sm border border-white/20 active:scale-95 transition-transform">View History</button>
        </div>
      </div>

      <div className="px-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 font-display">Available Offers</h3>
          <button className="text-primary text-sm font-bold hover:underline">View all</button>
        </div>
        {[
          { title: '50% OFF on first booking', code: 'UCNEW50', desc: 'Valid on all professional services', color: 'bg-red-50 border-red-100' },
          { title: 'Flat ₹100 OFF on AC Repair', code: 'AC100', desc: 'Valid on orders above ₹499', color: 'bg-emerald-50 border-emerald-100' },
        ].map((offer) => (
          <div key={offer.code} className={`p-5 rounded-3xl border shadow-sm ${offer.color}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-900 text-lg font-display">{offer.title}</h4>
              <Sparkles size={20} className="text-primary opacity-30" />
            </div>
            <p className="text-xs text-gray-500 font-medium mb-5">{offer.desc}</p>
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-dashed border-gray-200">
              <code className="font-bold text-primary text-sm tracking-wider">{offer.code}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(offer.code);
                  alert('Code copied!');
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                <Copy size={12} strokeWidth={2.5} /> Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto relative shadow-2xl">
      <NotificationHandler />
      <div className="bg-white min-h-screen">
        <AnimatePresence mode="wait">
          {view === AppView.HOME && renderHome()}
          {view === AppView.SUB_CATEGORY && renderSubCategory()}
          {view === AppView.SERVICE_DETAILS && renderServiceDetails()}
          {view === AppView.ORDERS && renderOrders()}
          {view === AppView.CART && renderCart()}
          {view === AppView.CHECKOUT && renderCheckout()}
          {view === AppView.TRACKING && <Tracking key="tracking" onBack={() => setView(AppView.ORDERS)} />}
          {view === AppView.PROVIDER_DASHBOARD && profile && <ProviderDashboard user={user!} profile={profile} />}
          {view === AppView.ACCOUNT && user && (
              <Account key="account" user={user} onLogout={handleLogout} navigate={setView} onUpdateProfile={fetchProfile} />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (view === AppView.SERVICE_DETAILS || view === AppView.SUB_CATEGORY) && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-5 z-50"
          >
            <div className="bg-primary rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/20">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">₹{cartTotal}</p>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{cart.length} items added</p>
                </div>
              </div>
              <button 
                onClick={handleViewCart}
                className="px-6 py-2.5 bg-white text-primary font-bold rounded-xl text-sm shadow-sm active:scale-95 transition-transform"
              >
                View Cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - UC Style */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around py-3 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        {[
          { id: AppView.HOME, icon: Home, label: 'Home' },
          { id: AppView.ORDERS, icon: ClipboardList, label: 'Bookings' },
          { id: AppView.TRACKING, icon: MapPin, label: 'Track' },
          { id: AppView.ACCOUNT, icon: UserIcon, label: 'Profile' },
          ...(profile?.role === 'professional' ? [{ id: AppView.PROVIDER_DASHBOARD, icon: Wrench, label: 'Dashboard' }] : []),
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)} 
            className={`flex flex-col items-center gap-1.5 py-1 flex-1 transition-all active:scale-90 ${view === item.id ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon size={22} strokeWidth={view === item.id ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${view === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;