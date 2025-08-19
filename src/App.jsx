import { Routes, Route } from "react-router-dom";
import BookingForm from "./BookingForm";
import Success from "./Success";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from "react-router-dom";

const stripePromise = loadStripe("pk_test_51QDrQ2EU1FJEcQgPVE6BVv3fH2bYAjUGpGB7ZxXgXeVa57ckd3EkeYmWS5RhJTedjBsZP0dhBMRodegfy1QvvdDq00MHm8lyDb")
function App() {
   let location = useLocation();
   
  return (
    <Elements stripe={stripePromise}>
    <div className="bg-yellow-50">
     
      {
        location.pathname === '/' && (
          <h1 className="font-parisienne text-shadow-lg text-6xl text-pink-500 drop-shadow-lg flex justify-center py-6">Amy's Mehndi</h1>
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

export default App;
