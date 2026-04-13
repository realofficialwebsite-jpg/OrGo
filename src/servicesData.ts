import { Category } from './types';

export const orgoServices: Category[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'droplets',
    priceStart: 199,
    imageUrl: 'https://images.pexels.com/photos/342800/pexels-photo-342800.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'blue',
    subCategories: [
      'Tap Repair', 'Tap Installation', 'Leakage Repair', 'Pipe Installation', 
      'Pipe Leakage Detection', 'Water Tank Cleaning', 'Motor Installation', 
      'Motor Repair', 'Bathroom Fittings Installation', 'Flush Repair', 
      'Drain Blockage Removal', 'Shower Installation'
    ].map((sub, index) => ({
      id: `plumb-sub-${index}`,
      title: sub,
      icon: 'droplets',
      items: [
        {
          id: `plumb-item-${index}`,
          title: `${sub} Service`,
          rating: 4.8,
          reviews: '1.2k',
          price: 199,
          descriptionPoints: ['Professional service', 'Check-up & diagnosis', 'Standard rates'],
          imageUrl: 'https://images.pexels.com/photos/342800/pexels-photo-342800.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'ac-repair',
    name: 'AC Repair',
    icon: 'wind',
    priceStart: 499,
    imageUrl: 'https://images.unsplash.com/photo-1681042803902-f79c240d8f03?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Appliances',
    color: 'cyan',
    tag: 'Trending',
    subCategories: [
      'AC General Service', 'AC Gas Refill', 'AC Installation', 'AC Uninstallation', 
      'AC Cooling Issue Repair', 'AC Water Leakage Repair', 'AC PCB Repair', 
      'AC Fan Motor Repair', 'AC Deep Cleaning', 'Window AC Service', 'Split AC Service'
    ].map((sub, index) => ({
      id: `ac-sub-${index}`,
      title: sub,
      icon: 'wind',
      imageUrl: 'https://images.unsplash.com/photo-1681042803902-f79c240d8f03?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      items: [
        {
          id: `ac-item-${index}`,
          title: sub,
          rating: 4.9,
          reviews: '2.5k',
          price: 499,
          descriptionPoints: ['Expert technician', '30-day warranty', 'Genuine spare parts'],
          imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=800'
        }
      ]
    }))
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'brush',
    priceStart: 399,
    imageUrl: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'emerald',
    subCategories: [
      'Full Home Cleaning', 'Kitchen Deep Cleaning', 'Bathroom Deep Cleaning', 
      'Sofa Cleaning', 'Carpet Cleaning', 'Mattress Cleaning', 'Balcony Cleaning', 
      'Water Tank Cleaning', 'Office Cleaning', 'Move-in Move-out Cleaning'
    ].map((sub, index) => ({
      id: `clean-sub-${index}`,
      title: sub,
      icon: 'brush',
      items: [
        {
          id: `clean-item-${index}`,
          title: sub,
          rating: 4.9,
          reviews: '5k',
          price: 399,
          descriptionPoints: ['Deep cleaning', 'Eco-friendly chemicals', 'Professional equipment'],
          imageUrl: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'electrician',
    name: 'Electrician',
    icon: 'zap',
    priceStart: 99,
    imageUrl: 'https://images.pexels.com/photos/3825581/pexels-photo-3825581.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'amber',
    subCategories: [
      'Switch Repair', 'Switchboard Installation', 'Fan Installation', 'Fan Repair', 
      'Light Installation', 'Wiring Work', 'Inverter Installation', 'Doorbell Installation', 
      'MCB Fuse Repair', 'Short Circuit Issue', 'Decorative Light Installation'
    ].map((sub, index) => ({
      id: `elec-sub-${index}`,
      title: sub,
      icon: 'zap',
      items: [
        {
          id: `elec-item-${index}`,
          title: sub,
          rating: 4.8,
          reviews: '3.2k',
          price: 99,
          descriptionPoints: ['Certified electrician', 'Safety first approach', 'Quick resolution'],
          imageUrl: 'https://images.pexels.com/photos/3825581/pexels-photo-3825581.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'gardening',
    name: 'Gardening',
    icon: 'flower',
    priceStart: 299,
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    color: 'green',
    subCategories: [
      'Lawn Mowing', 'Plant Trimming', 'New Plant Setup', 'Fertilizer Treatment', 
      'Pest Treatment for Plants', 'Garden Cleaning'
    ].map((sub, index) => ({
      id: `garden-sub-${index}`,
      title: sub,
      icon: 'flower',
      imageUrl: 'https://images.unsplash.com/photo-1416870262648-255fbd25b176?q=80&w=400&auto=format&fit=crop',
      items: [
        {
          id: `garden-item-${index}`,
          title: sub,
          rating: 4.7,
          reviews: '1k',
          price: 299,
          descriptionPoints: ['Expert gardener', 'Organic fertilizers', 'Complete cleanup'],
          imageUrl: 'https://images.unsplash.com/photo-1416870262648-255fbd25b176?q=80&w=400&auto=format&fit=crop'
        }
      ]
    }))
  },
  {
    id: 'vehicle',
    name: 'Vehicle On-Spot',
    icon: 'car',
    priceStart: 199,
    imageUrl: 'https://images.pexels.com/photos/6872146/pexels-photo-6872146.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Vehicle',
    color: 'red',
    subCategories: [
      'Bike Puncture Repair', 'Car Puncture Repair', 'Air Filling', 'Jump Start', 
      'Engine Oil Change', 'Battery Replacement', 'Bike General Service', 
      'Car Washing', 'Doorstep Mechanic Visit'
    ].map((sub, index) => ({
      id: `vehicle-sub-${index}`,
      title: sub,
      icon: 'car',
      items: [
        {
          id: `vehicle-item-${index}`,
          title: sub,
          rating: 4.8,
          reviews: '4.5k',
          price: 199,
          descriptionPoints: ['Doorstep service', 'Quick response', 'Professional tools'],
          imageUrl: 'https://images.pexels.com/photos/6872146/pexels-photo-6872146.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    icon: 'bug',
    priceStart: 599,
    imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop',
    category: 'Home',
    color: 'purple',
    subCategories: [
      'Cockroach Treatment', 'Termite Control', 'Bed Bug Treatment', 'Mosquito Treatment', 
      'Rat Control', 'Ant Control', 'Full Home Pest Control', 'Kitchen Pest Control'
    ].map((sub, index) => ({
      id: `pest-sub-${index}`,
      title: sub,
      icon: 'bug',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop',
      items: [
        {
          id: `pest-item-${index}`,
          title: sub,
          rating: 4.7,
          reviews: '2.8k',
          price: 599,
          descriptionPoints: ['Safe chemicals', 'Long-lasting effect', 'Expert inspection'],
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop'
        }
      ]
    }))
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    icon: 'hammer',
    priceStart: 199,
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800',
    category: 'Home',
    color: 'orange',
    subCategories: [
      'Furniture Repair', 'Bed Assembly', 'Wardrobe Repair', 'Door Repair', 
      'Modular Kitchen Repair', 'Curtain Rod Installation', 'Wooden Shelf Installation'
    ].map((sub, index) => ({
      id: `carp-sub-${index}`,
      title: sub,
      icon: 'hammer',
      imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800',
      items: [
        {
          id: `carp-item-${index}`,
          title: sub,
          rating: 4.8,
          reviews: '3.5k',
          price: 199,
          descriptionPoints: ['Skilled carpenter', 'Quality finish', 'Quick repair'],
          imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800'
        }
      ]
    }))
  },
  {
    id: 'home-security',
    name: 'Home Security',
    icon: 'shield',
    priceStart: 999,
    imageUrl: 'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'slate',
    subCategories: [
      'CCTV Installation', 'CCTV Repair'
    ].map((sub, index) => ({
      id: `sec-sub-${index}`,
      title: sub,
      icon: 'shield',
      items: [
        {
          id: `sec-item-${index}`,
          title: sub,
          rating: 4.9,
          reviews: '1.5k',
          price: 999,
          descriptionPoints: ['Expert installation', 'Remote access setup', 'System testing'],
          imageUrl: 'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'packers-movers',
    name: 'Packers & Movers',
    icon: 'package',
    priceStart: 1999,
    imageUrl: 'https://images.pexels.com/photos/7464398/pexels-photo-7464398.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'indigo',
    subCategories: [
      'House Shifting', 'Office Shifting', 'Local Shifting', 'Loading/Unloading'
    ].map((sub, index) => ({
      id: `pack-sub-${index}`,
      title: sub,
      icon: 'package',
      items: [
        {
          id: `pack-item-${index}`,
          title: sub,
          rating: 4.9,
          reviews: '6k',
          price: 1999,
          descriptionPoints: ['Safe handling', 'Professional packing', 'Timely delivery'],
          imageUrl: 'https://images.pexels.com/photos/7464398/pexels-photo-7464398.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'civil-work',
    name: 'Civil Work',
    icon: 'wrench',
    priceStart: 499,
    imageUrl: 'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Home',
    color: 'stone',
    subCategories: [
      'Tile Repair', 'Floor Repair', 'Wall Crack Repair', 'Minor Construction Work'
    ].map((sub, index) => ({
      id: `civil-sub-${index}`,
      title: sub,
      icon: 'wrench',
      items: [
        {
          id: `civil-item-${index}`,
          title: sub,
          rating: 4.7,
          reviews: '2k',
          price: 499,
          descriptionPoints: ['Quality materials', 'Expert masonry', 'Clean finish'],
          imageUrl: 'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ]
    }))
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: 'wrench',
    priceStart: 299,
    imageUrl: 'https://images.pexels.com/photos/213162/pexels-photo-213162.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Appliances',
    color: 'orange',
    subCategories: [
      {
        id: 'large-appliances',
        title: 'Large Appliances',
        icon: 'monitor',
        items: [
          // Washing Machine
          ...['Not Starting', 'Not Spinning/Drying', 'Water Not Filling', 'Water Not Draining', 'Excessive Vibration', 'Door Lock Problem', 'Drum Noise', 'PCB/Display Issue', 'Leakage', 'Bad Smell', 'Installation/Uninstallation'].map(issue => ({
            id: `wm-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Washing Machine: ${issue}`,
            rating: 4.7,
            reviews: '5k',
            price: 599,
            descriptionPoints: ['Expert diagnosis', 'Genuine parts', 'Warranty included'],
            imageUrl: 'https://images.pexels.com/photos/5849392/pexels-photo-5849392.jpeg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Refrigerator
          ...['Not Cooling', 'Over Cooling/Ice Formation', 'Water Leakage', 'Compressor Not Working', 'Gas Charging', 'Fridge Not Starting', 'Door Seal Problem', 'Light Not Working', 'Strange Noise', 'Deep Freezer Not Cooling', 'PCB Issue'].map(issue => ({
            id: `ref-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Refrigerator: ${issue}`,
            rating: 4.8,
            reviews: '8k',
            price: 699,
            descriptionPoints: ['Cooling check', 'Gas charging', 'Component repair'],
            imageUrl: 'https://images.pexels.com/photos/2343467/pexels-photo-2343467.jpeg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Television
          ...['No Display/Black Screen', 'No Sound', 'Screen Lines', 'Panel Damage', 'Remote Not Working', 'HDMI Port Not Working', 'Smart TV Software', 'TV Not Powering On', 'Wall Mount'].map(issue => ({
            id: `tv-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Television: ${issue}`,
            rating: 4.6,
            reviews: '4k',
            price: 499,
            descriptionPoints: ['Display repair', 'Sound fix', 'Mounting service'],
            imageUrl: 'https://images.pexels.com/photos/5721865/pexels-photo-5721865.jpeg?auto=compress&cs=tinysrgb&w=400'
          }))
        ]
      },
      {
        id: 'small-appliances',
        title: 'Small Appliances',
        icon: 'coffee',
        items: [
          // Microwave
          ...['Not Heating', 'Buttons Not Working', 'Turntable Not Rotating', 'Sparking', 'Display Not Working', 'Door Not Closing', 'Strange Noise', 'Installation'].map(issue => ({
            id: `mw-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Microwave: ${issue}`,
            rating: 4.7,
            reviews: '3k',
            price: 399,
            descriptionPoints: ['Heating check', 'Magnetron fix', 'Quick repair'],
            imageUrl: 'https://images.pexels.com/photos/213162/pexels-photo-213162.jpeg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Chimney
          ...['Suction Power Low', 'Not Turning On', 'Excess Noise', 'Oil Leakage', 'Filter Replacement', 'Light Not Working', 'Button Panel Issue', 'Deep Cleaning'].map(issue => ({
            id: `ch-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Chimney: ${issue}`,
            rating: 4.6,
            reviews: '2k',
            price: 499,
            descriptionPoints: ['Motor check', 'Suction cleaning', 'Filter change'],
            imageUrl: 'https://images.pexels.com/photos/5849392/pexels-photo-5849392.jpeg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Stove
          ...['Gas Leakage', 'Burner Not Igniting', 'Low Flame', 'Knob Not Working', 'Auto Ignition Failure', 'Pipe Installation'].map(issue => ({
            id: `st-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Stove: ${issue}`,
            rating: 4.8,
            reviews: '6k',
            price: 299,
            descriptionPoints: ['Burner cleaning', 'Leakage check', 'Safety test'],
            imageUrl: 'https://images.pexels.com/photos/5849392/pexels-photo-5849392.jpeg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Laptop
          ...['Not Turning On', 'Battery Not Charging', 'Screen Damage', 'Keyboard Not Working', 'Overheating', 'Slow Performance', 'OS/Software', 'Motherboard', 'Speaker/Sound'].map(issue => ({
            id: `lt-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Laptop: ${issue}`,
            rating: 4.9,
            reviews: '7k',
            price: 799,
            descriptionPoints: ['Hardware fix', 'Software setup', 'Performance boost'],
            imageUrl: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400'
          })),
          // Geyser
          ...['Not Heating', 'Water Leakage', 'Power Issue', 'Thermostat', 'Rusty Water', 'Installation'].map(issue => ({
            id: `gy-${issue.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Geyser: ${issue}`,
            rating: 4.8,
            reviews: '4k',
            price: 499,
            descriptionPoints: ['Heating element fix', 'Safety check', 'Scaling removal'],
            imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800'
          }))
        ]
      }
    ]
  }
];
