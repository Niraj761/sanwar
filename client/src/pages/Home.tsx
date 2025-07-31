import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { Search, MapPin, Calendar, Users, Star, Shield, Clock, Headphones } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

const Home: React.FC = () => {
  const [searchData, setSearchData] = useState({
    city: '',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    guests: 1,
    rooms: 1,
  });

  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({
      city: searchData.city,
      checkIn: searchData.checkIn.toISOString(),
      checkOut: searchData.checkOut.toISOString(),
      guests: searchData.guests.toString(),
      rooms: searchData.rooms.toString(),
    });
    navigate(`/hotels/search?${queryParams}`);
  };

  const popularCities = [
    { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=300&h=200&fit=crop' },
    { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&h=200&fit=crop' },
    { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=300&h=200&fit=crop' },
    { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300&h=200&fit=crop' },
    { name: 'Chennai', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300&h=200&fit=crop' },
    { name: 'Kolkata', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=300&h=200&fit=crop' },
  ];

  const features = [
    {
      icon: <Star className="text-yellow-500" size={24} />,
      title: 'Quality Assured',
      description: 'Standardized stays with quality you can trust',
    },
    {
      icon: <Shield className="text-green-500" size={24} />,
      title: 'Safe & Secure',
      description: 'Your safety is our priority with verified properties',
    },
    {
      icon: <Clock className="text-blue-500" size={24} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for your needs',
    },
    {
      icon: <Headphones className="text-purple-500" size={24} />,
      title: 'Easy Booking',
      description: 'Simple and hassle-free booking experience',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-red-900 opacity-70"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                India's Largest Hotel Chain
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Book hotels & homes across 800+ cities with the best prices
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* City Input */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      City or Hotel
                    </label>
                    <input
                      type="text"
                      value={searchData.city}
                      onChange={(e) => setSearchData({ ...searchData, city: e.target.value })}
                      placeholder="Enter city name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Check-in Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Check-in
                    </label>
                    <DatePicker
                      selected={searchData.checkIn}
                      onChange={(date) => setSearchData({ ...searchData, checkIn: date || new Date() })}
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Check-out
                    </label>
                    <DatePicker
                      selected={searchData.checkOut}
                      onChange={(date) => setSearchData({ ...searchData, checkOut: date || new Date() })}
                      minDate={searchData.checkIn}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Guests & Rooms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users size={16} className="inline mr-1" />
                      Guests & Rooms
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={searchData.guests}
                        onChange={(e) => setSearchData({ ...searchData, guests: parseInt(e.target.value) })}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} Guest{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      <select
                        value={searchData.rooms}
                        onChange={(e) => setSearchData({ ...searchData, rooms: parseInt(e.target.value) })}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num} Room{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Search size={20} />
                  <span>Search Hotels</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Cities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
            <p className="text-lg text-gray-600">Discover amazing places across India</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularCities.map((city) => (
              <div
                key={city.name}
                onClick={() => setSearchData({ ...searchData, city: city.name })}
                className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose OYO?</h2>
            <p className="text-lg text-gray-600">Experience the best in hospitality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 rounded-full group-hover:bg-red-100 transition-colors duration-200">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;