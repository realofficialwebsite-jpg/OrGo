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
        id: 'large-app',
        title: 'Large Appliances',
        icon: 'monitor',
        items: [
          { id: 'la1', title: 'Washing Machine Repair', rating: 4.7, reviews: '5k', price: 599, descriptionPoints: ['Motor check', 'Drainage fix'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'la2', title: 'Refrigerator Repair', rating: 4.8, reviews: '8k', price: 699, descriptionPoints: ['Cooling check', 'Gas refill'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'la3', title: 'TV Repair', rating: 4.6, reviews: '4k', price: 499, descriptionPoints: ['Display check', 'Sound issue'], image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=400&auto=format&fit=crop' },
        ]
      },
      {
        id: 'small-app',
        title: 'Small Appliances',
        icon: 'coffee',
        items: [
          { id: 'sa1', title: 'Microwave Repair', rating: 4.7, reviews: '3k', price: 399, descriptionPoints: ['Heating check', 'Magnetron fix'], image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa2', title: 'Chimney Repair', rating: 4.6, reviews: '2k', price: 499, descriptionPoints: ['Motor check', 'Filter cleaning'], image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa3', title: 'Stove Repair', rating: 4.8, reviews: '6k', price: 299, descriptionPoints: ['Burner cleaning', 'Gas leak fix'], image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa4', title: 'Laptop Repair', rating: 4.9, reviews: '7k', price: 799, descriptionPoints: ['Screen repair', 'Software issue'], image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa5', title: 'Water Purifier Repair', rating: 4.7, reviews: '5k', price: 399, descriptionPoints: ['Filter change', 'RO check'], image: 'https://images.unsplash.com/photo-1585829365291-1782bd8a3928?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa6', title: 'Geyser Repair', rating: 4.8, reviews: '4k', price: 499, descriptionPoints: ['Heating element fix', 'Thermostat check'], image: 'https://images.unsplash.com/photo-1585829365291-1782bd8a3928?q=80&w=400&auto=format&fit=crop' },
          { id: 'sa7', title: 'Air Cooler Repair', rating: 4.6, reviews: '3k', price: 299, descriptionPoints: ['Motor check', 'Pump repair'], image: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'orange'
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
        id: 'gardening-general',
        title: 'Gardening Services',
        icon: 'flower',
        items: [
          { id: 'g1', title: 'Lawn Mowing', rating: 4.7, reviews: '2k', price: 299, descriptionPoints: ['Grass trimming', 'Edge cleanup'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
          { id: 'g2', title: 'Planting', rating: 4.8, reviews: '1k', price: 399, descriptionPoints: ['Plant setup', 'Soil preparation'], image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'green'
  },
  {
    id: '7',
    name: 'Vehicle',
    icon: 'car',
    priceStart: 599,
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop',
    category: 'Vehicle',
    subCategories: [
      {
        id: 'vehicle-general',
        title: 'Vehicle Services',
        icon: 'car',
        items: [
          { id: 'v1', title: 'Car Service', rating: 4.8, reviews: '9k', price: 1999, descriptionPoints: ['Oil change', 'Full checkup'], image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop' },
          { id: 'v2', title: 'Bike Service', rating: 4.7, reviews: '6k', price: 599, descriptionPoints: ['Oil change', 'Brake check'], image: 'https://images.unsplash.com/photo-1544133782-b621fe018ca3?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'red'
  },
  {
    id: '8',
    name: 'Pest Control',
    icon: 'bug',
    priceStart: 799,
    image: 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'pest-general',
        title: 'Pest Control Services',
        icon: 'bug',
        items: [
          { id: 'pc1', title: 'General Pest Control', rating: 4.7, reviews: '4k', price: 799, descriptionPoints: ['Spray treatment', 'Sanitization'], image: 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?q=80&w=400&auto=format&fit=crop' },
          { id: 'pc2', title: 'Termite Control', rating: 4.8, reviews: '2k', price: 1499, descriptionPoints: ['Drill & fill', 'Chemical treatment'], image: 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'purple'
  },
  {
    id: '9',
    name: 'Extra Services',
    icon: 'star',
    priceStart: 199,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    subCategories: [
      {
        id: 'extra-general',
        title: 'Extra Services',
        icon: 'star',
        items: [
          { id: 'x1', title: 'Carpenter', rating: 4.7, reviews: '5k', price: 199, descriptionPoints: ['Furniture repair', 'New fitting'], image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop' },
          { id: 'x2', title: 'Home Security', rating: 4.8, reviews: '3k', price: 1499, descriptionPoints: ['CCTV install', 'Smart lock'], image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop' },
          { id: 'x3', title: 'Packers & Movers', rating: 4.9, reviews: '8k', price: 1999, descriptionPoints: ['Local shifting', 'Loading help'], image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=400&auto=format&fit=crop' },
          { id: 'x4', title: 'Civil Work', rating: 4.7, reviews: '2k', price: 999, descriptionPoints: ['Masonry', 'Tiling'], image: 'https://images.unsplash.com/photo-1503387762-592dec58ef4e?q=80&w=400&auto=format&fit=crop' },
        ]
      }
    ],
    color: 'yellow'
  }
];
