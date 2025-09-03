import { Routes, Route } from "react-router-dom";
import BookingForm from "./BookingForm";
import Success from "./Success";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from "react-router-dom";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
function App() {
   let location = useLocation()
   
  return (
    <Elements stripe={stripePromise}>
    <div className="bg-black">
     
      {
        location.pathname === '/' && (
          <h1 className="font-parisienne text-shadow-lg text-pink-500 drop-shadow-lg text-5xl sm:text-6xl md:text-7xl text-center py-6">Amy's Mehndi</h1>
        )
      }
  
    
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    
 
    </div>
    </Elements>
  );
}

export default App
