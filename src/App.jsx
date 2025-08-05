import { Routes, Route } from "react-router-dom";
import BookingForm from "./BookingForm";
import Success from "./Success";
import Footer from './Footer'

function App() {
  return (
    <div className="bg-yellow-50">
    <h1 className="font-parisienne text-shadow-lg text-6xl text-pink-500 drop-shadow-lg flex justify-center py-6">Amy's Mehndi</h1>
    
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    
    <Footer/>
    </div>
  );
}

export default App;
