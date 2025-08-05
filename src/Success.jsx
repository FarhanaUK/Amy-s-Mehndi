import React from "react";

function Success() {
  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      {/* Centered card */}
      <div className="max-w-md w-full mx-auto p-6 text-center bg-white rounded shadow">
        <h1 className="text-3xl font-bold mb-4 text-green-700">✅ Booking Complete!</h1>
        <p className="text-gray-700">
          Thank you for your booking. We’ve received your request and deposit. You will receive a confirmation email shortly.
        </p>
      </div>
    </div>
  );
}

export default Success;
