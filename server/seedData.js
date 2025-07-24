const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hotel = require('./models/Hotel');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oyo-booking');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Hotel.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const users = await User.create([
      {
        name: 'Demo User',
        email: 'demo@oyo.com',
        password: hashedPassword,
        phone: '+91 9876543210',
        role: 'user'
      },
      {
        name: 'Hotel Owner',
        email: 'owner@oyo.com',
        password: hashedPassword,
        phone: '+91 9876543211',
        role: 'hotel_owner'
      },
      {
        name: 'Admin User',
        email: 'admin@oyo.com',
        password: hashedPassword,
        phone: '+91 9876543212',
        role: 'admin'
      }
    ]);

    console.log('Created demo users');

    // Create sample hotels
    const sampleHotels = [
      {
        name: 'OYO 123 Mumbai Central',
        description: 'A modern hotel in the heart of Mumbai with excellent amenities and service. Perfect for business travelers and tourists alike.',
        address: {
          street: '123 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001'
        },
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // [longitude, latitude] for Mumbai
        },
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop'
        ],
        amenities: ['WiFi', 'AC', 'TV', 'Room Service', 'Parking', 'Breakfast'],
        rooms: [
          {
            type: 'Single',
            price: 1500,
            totalRooms: 10,
            availableRooms: 8,
            amenities: ['WiFi', 'AC', 'TV'],
            images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'],
            maxOccupancy: 1
          },
          {
            type: 'Double',
            price: 2500,
            totalRooms: 15,
            availableRooms: 12,
            amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
            images: ['https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop'],
            maxOccupancy: 2
          },
          {
            type: 'Deluxe',
            price: 3500,
            totalRooms: 8,
            availableRooms: 6,
            amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'],
            images: ['https://images.unsplash.com/photo-1631049421450-348ce5a65b8a?w=400&h=300&fit=crop'],
            maxOccupancy: 3
          }
        ],
        owner: users[1]._id,
        rating: {
          average: 4.2,
          count: 156
        }
      },
      {
        name: 'OYO 456 Delhi CP',
        description: 'Strategically located hotel in Connaught Place, Delhi. Walking distance to metro station and major shopping areas.',
        address: {
          street: '456 Connaught Place',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          zipCode: '110001'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // [longitude, latitude] for Delhi
        },
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'
        ],
        amenities: ['WiFi', 'AC', 'TV', 'Room Service', 'Gym', 'Restaurant'],
        rooms: [
          {
            type: 'Single',
            price: 1800,
            totalRooms: 12,
            availableRooms: 10,
            amenities: ['WiFi', 'AC', 'TV'],
            images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'],
            maxOccupancy: 1
          },
          {
            type: 'Double',
            price: 2800,
            totalRooms: 18,
            availableRooms: 15,
            amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
            images: ['https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop'],
            maxOccupancy: 2
          },
          {
            type: 'Suite',
            price: 5000,
            totalRooms: 5,
            availableRooms: 4,
            amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Living Room', 'Kitchenette'],
            images: ['https://images.unsplash.com/photo-1631049421658-56d2d21e4c5f?w=400&h=300&fit=crop'],
            maxOccupancy: 4
          }
        ],
        owner: users[1]._id,
        rating: {
          average: 4.5,
          count: 203
        }
      },
      {
        name: 'OYO 789 Bangalore Koramangala',
        description: 'Modern hotel in the tech hub of Bangalore. Perfect for IT professionals and startup enthusiasts.',
        address: {
          street: '789 Koramangala 4th Block',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          zipCode: '560034'
        },
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9352] // [longitude, latitude] for Bangalore
        },
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop'
        ],
        amenities: ['WiFi', 'AC', 'TV', 'Workspace', 'Coffee Machine', 'Parking'],
        rooms: [
          {
            type: 'Single',
            price: 1600,
            totalRooms: 14,
            availableRooms: 11,
            amenities: ['WiFi', 'AC', 'TV', 'Workspace'],
            images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'],
            maxOccupancy: 1
          },
          {
            type: 'Double',
            price: 2600,
            totalRooms: 20,
            availableRooms: 17,
            amenities: ['WiFi', 'AC', 'TV', 'Workspace', 'Mini Bar'],
            images: ['https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop'],
            maxOccupancy: 2
          },
          {
            type: 'Deluxe',
            price: 3800,
            totalRooms: 10,
            availableRooms: 8,
            amenities: ['WiFi', 'AC', 'TV', 'Workspace', 'Mini Bar', 'Balcony'],
            images: ['https://images.unsplash.com/photo-1631049421450-348ce5a65b8a?w=400&h=300&fit=crop'],
            maxOccupancy: 3
          }
        ],
        owner: users[1]._id,
        rating: {
          average: 4.3,
          count: 98
        }
      },
      {
        name: 'OYO 321 Goa Baga Beach',
        description: 'Beachside hotel in Goa with stunning ocean views. Perfect for vacation and relaxation.',
        address: {
          street: '321 Baga Beach Road',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          zipCode: '403516'
        },
        location: {
          type: 'Point',
          coordinates: [73.7519, 15.5557] // [longitude, latitude] for Goa
        },
        images: [
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop'
        ],
        amenities: ['WiFi', 'AC', 'TV', 'Beach Access', 'Pool', 'Restaurant', 'Bar'],
        rooms: [
          {
            type: 'Double',
            price: 3500,
            totalRooms: 16,
            availableRooms: 13,
            amenities: ['WiFi', 'AC', 'TV', 'Beach View'],
            images: ['https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop'],
            maxOccupancy: 2
          },
          {
            type: 'Deluxe',
            price: 4500,
            totalRooms: 12,
            availableRooms: 9,
            amenities: ['WiFi', 'AC', 'TV', 'Beach View', 'Mini Bar', 'Balcony'],
            images: ['https://images.unsplash.com/photo-1631049421450-348ce5a65b8a?w=400&h=300&fit=crop'],
            maxOccupancy: 3
          },
          {
            type: 'Suite',
            price: 6500,
            totalRooms: 6,
            availableRooms: 5,
            amenities: ['WiFi', 'AC', 'TV', 'Ocean View', 'Mini Bar', 'Living Room', 'Jacuzzi'],
            images: ['https://images.unsplash.com/photo-1631049421658-56d2d21e4c5f?w=400&h=300&fit=crop'],
            maxOccupancy: 4
          }
        ],
        owner: users[1]._id,
        rating: {
          average: 4.7,
          count: 287
        }
      }
    ];

    const hotels = await Hotel.create(sampleHotels);
    console.log('Created sample hotels');

    // Add some sample reviews to hotels
    const sampleReviews = [
      {
        user: users[0]._id,
        rating: 5,
        comment: 'Excellent service and clean rooms. Highly recommended!'
      },
      {
        user: users[0]._id,
        rating: 4,
        comment: 'Good location and friendly staff. Will visit again.'
      }
    ];

    // Add reviews to first hotel
    hotels[0].reviews = sampleReviews;
    hotels[0].calculateAverageRating();
    await hotels[0].save();

    console.log('Added sample reviews');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Created:');
    console.log(`- ${users.length} users`);
    console.log(`- ${hotels.length} hotels`);
    console.log('\n👤 Demo Credentials:');
    console.log('Email: demo@oyo.com');
    console.log('Password: demo123');
    console.log('\n🏨 Hotel Owner:');
    console.log('Email: owner@oyo.com');
    console.log('Password: demo123');
    console.log('\n👑 Admin:');
    console.log('Email: admin@oyo.com');
    console.log('Password: demo123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the seeder
seedData();