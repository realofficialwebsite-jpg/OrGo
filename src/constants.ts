import { Category } from './types';

export const APP_CATEGORIES: Category[] = [
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
        ]
      }
    ]
  },
  { 
    id: '2', 
    name: 'AC Repair', 
    icon: 'wind', 
    priceStart: 399, 
    image: 'https://images.unsplash.com/photo-1533461502717-83546f485d01?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'ac-general',
        title: 'AC Services',
        icon: 'wind',
        items: [
          { id: 'ac1', title: 'AC Service', rating: 4.8, reviews: '12k', price: 399, descriptionPoints: ['Filter cleaning', 'Gas check'], image: 'https://images.unsplash.com/photo-1533461502717-83546f485d01?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac2', title: 'AC Installation', rating: 4.7, reviews: '8k', price: 1499, descriptionPoints: ['New AC setup', 'Pipe connection'], image: 'https://images.unsplash.com/photo-1533461502717-83546f485d01?q=80&w=400&auto=format&fit=crop' },
          { id: 'ac3', title: 'AC Repair', rating: 4.6, reviews: '5k', price: 599, descriptionPoints: ['Diagnosis', 'Part repair'], image: 'https://images.unsplash.com/photo-1533461502717-83546f485d01?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ]
  },
  { 
    id: '3', 
    name: 'Cleaning', 
    icon: 'sparkles', 
    priceStart: 499, 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'c-general',
        title: 'Cleaning Services',
        icon: 'sparkles',
        items: [
          { id: 'c1', title: 'Full Home Cleaning', rating: 4.8, reviews: '12k', price: 1999, descriptionPoints: ['Deep cleaning', 'Sanitization'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'c2', title: 'Kitchen Cleaning', rating: 4.7, reviews: '8k', price: 999, descriptionPoints: ['Deep cleaning', 'Grease removal'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'c3', title: 'Bathroom Cleaning', rating: 4.6, reviews: '5k', price: 599, descriptionPoints: ['Deep cleaning', 'Sanitization'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ]
  },
  { 
    id: '4', 
    name: 'Electrician', 
    icon: 'zap', 
    priceStart: 149, 
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a268e?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'e-general',
        title: 'Electrical Services',
        icon: 'zap',
        items: [
          { id: 'e1', title: 'Switch Repair', rating: 4.8, reviews: '12k', price: 149, descriptionPoints: ['Diagnosis', 'Repair'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a268e?q=80&w=400&auto=format&fit=crop' },
          { id: 'e2', title: 'Wiring Repair', rating: 4.7, reviews: '8k', price: 299, descriptionPoints: ['Diagnosis', 'Repair'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a268e?q=80&w=400&auto=format&fit=crop' },
          { id: 'e3', title: 'Light Installation', rating: 4.6, reviews: '5k', price: 199, descriptionPoints: ['Installation', 'Wiring check'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a268e?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ]
  },
  { 
    id: '5', 
    name: 'Gardening', 
    icon: 'flower', 
    priceStart: 299, 
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'g-general',
        title: 'Gardening Services',
        icon: 'flower',
        items: [
          { id: 'g1', title: 'Lawn Mowing', rating: 4.8, reviews: '12k', price: 299, descriptionPoints: ['Mowing', 'Cleanup'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g2', title: 'Planting', rating: 4.7, reviews: '8k', price: 499, descriptionPoints: ['Planting', 'Care advice'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g3', title: 'Garden Maintenance', rating: 4.6, reviews: '5k', price: 799, descriptionPoints: ['Pruning', 'Fertilizing'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ]
  }
];
