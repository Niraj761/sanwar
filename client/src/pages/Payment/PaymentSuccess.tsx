import React from 'react';

const PaymentSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Payment Successful!</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            Payment confirmation and booking details will be shown here
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;