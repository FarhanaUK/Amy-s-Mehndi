import Footer from "./Footer"

function Success() {
  return (
    <div className="bg-rose-50 min-h-screen flex flex-col justify-between">

      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full p-6 text-center bg-white rounded shadow">
          <h1 className="text-3xl font-bold mb-4 text-green-700">✅ Booking Complete!</h1>
          <p className="text-gray-700">
            Thank you for your booking. We’ve received your request and deposit. You will receive a confirmation email shortly.
          </p>
        </div>
      </div>

    
      <Footer />
    </div>
  );
}

export default Success;
