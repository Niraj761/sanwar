import React from 'react';

const BookingConfirmation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Booking Confirmed!</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            Booking confirmation details will be shown here
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;