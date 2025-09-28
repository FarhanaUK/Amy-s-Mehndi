import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import { useNavigate } from "react-router-dom"
import "react-datepicker/dist/react-datepicker.css";

import emailjs from '@emailjs/browser'
import Footer from "./Footer";


function SimpleBooking() {


const navigate = useNavigate();

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_OWNER
const EMAILJS_PUBLIC_KEY =  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const EMAILJS_TEMPLATE_ID_CUSTOMER = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CUSTOMER


const [formData, setFormData] = useState({
    name: "", 
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    packageType: "",
    date: "",
    slot: "",
    time: "",
    callRequested: false,
    callTimes: "",
    termsAccepted: false,
  })

  const [timeError, setTimeError] = useState("")
  const [formError, setFormError] = useState("")
  const [additionalPeople, setAdditionalPeople] = useState([])
  const [savedDiscount, setSavedDiscount] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("") 
  const [showTerms, setShowTerms] = useState(false)

  const packages = [
    { name: "Classic", price: 175 },
    { name: "Classic hands only", price: 125 },
    { name: "Elegance", price: 200 },
    { name: "Elegance hands only", price: 150 },
    { name: "Picturesque", price: 250 },
    { name: "Picturesque hands only", price: 200 },
    { name: "Diamond", price: 300 },
    { name: "Diamond hands only", price: 250 },
    { name: "Showstopper", price: 350 },
    { name: "Showstopper hands only", price: 300 },
  
  ]

 const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (type === "checkbox") {
   
    setFormData((prev) => ({ ...prev,[name]: checked,}));
    setFormError("");
  } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
  }
};


  useEffect(() => {
    if (!formData.time || !formData.slot) {
      setTimeError("");
      return;
    }
    const [hours, minutes] = formData.time.split(":").map(Number)
    if (formData.slot === "Morning") {
  if (hours < 9 ||
      (hours === 11 && minutes > 0) ||
      hours > 11) {
    setTimeError("For Morning slot, time must be between 09:00 and 11:00")
  } else {
    setTimeError("")
  }
} else if (formData.slot === "Afternoon") {
  if (hours < 16 ||
      (hours === 18 && minutes > 0) ||
      hours > 18
) {
    setTimeError("For Afternoon slot, time must be between 16:00 and 18:00")
  } else {
    setTimeError("")
  }
}
  }, [formData.time, formData.slot])

const basePrice = packages.find(p => p.name === formData.packageType)?.price || 0
const guestBookingPrice = formData.isGuestBooking && formData.guestDuration 
  ? formData.guestDuration * 60 
  : 0
const additionalTotal = additionalPeople.length * 0
const totalPrice = basePrice + guestBookingPrice + additionalTotal

const isPackageSelected = formData.packageType !== ""
const isGuestBookingSelected = formData.isGuestBooking && formData.guestDuration
const depositForPackage = isPackageSelected ? 50 : 0
const depositForGuestBooking = isGuestBookingSelected ? 20 : 0
const totalDeposit = depositForPackage + depositForGuestBooking

const validateForm = () => {
    
  if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      setFormError("Name must be between 2 and 50 characters.")
      return false
    }

    if (!/^[a-zA-Z\s\-']+$/.test(formData.name.trim())) {
      setFormError("Name can only contain letters, spaces, hyphens, and apostrophes.")
      return false
    }

    if (timeError) {
      setFormError(timeError)
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.")
      return false
    }


if (!/^\+?\d{7,15}$/.test(formData.phone.trim())) {
  setFormError("Please enter a valid phone number.")
  return false
}

if (!/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(formData.postcode.trim())) {
      setFormError("Please enter a valid UK postcode.")
      return false;
    }
if (!formData.termsAccepted) {
      setFormError("You must accept the terms and conditions to proceed.")
      return false;
    }

if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.postcode ||
      !formData.packageType ||
      !formData.date ||
      !formData.slot ||
      !formData.time
    ) {
      setFormError("Please fill in all required fields.")
      return false;
    }
    
    setFormError("")
    return true
  }


  

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm() || isSubmitting) return
  
  setIsSubmitting(true)
  setSubmitError("")

try {
  console.log("Form data to send:", formData)


  console.log("Sending email via EmailJS...")
  const additionalGuestsCount = additionalPeople.length;

  let guestBookingInfo = "";
  if (isGuestBookingSelected) {
    guestBookingInfo = `${formData.guestDuration} hours`;
  } else {
    guestBookingInfo = "No";
  }

  let callBackInfo = ""
  if (formData.callRequested) {
    callBackInfo = `
Request a Call Back: YES
Preferred Call Times: ${formData.callTimes}
`;
  } else {
    callBackInfo = "Request a Call Back: NO\n";
  }

  const templateParams = {
    customer_name: formData.name,
    customer_email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    postcode: formData.postcode,
    package_type: formData.packageType,
    guest_booking_info: guestBookingInfo,
    additional_people_count: additionalGuestsCount,
    call_back_info: callBackInfo,
    total_price: totalPrice.toFixed(2),
    total_deposit: totalDeposit,
    booking_date: formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '',
    booking_time: formData.time,
   
    booking_status: "INQUIRY - Payment to be collected on appointment day"
  };

  console.log("Environment variables check:");
  console.log("EMAILJS_SERVICE_ID:", EMAILJS_SERVICE_ID);
  console.log("EMAILJS_TEMPLATE_ID:", EMAILJS_TEMPLATE_ID);
  console.log("EMAILJS_TEMPLATE_ID_CUSTOMER:", EMAILJS_TEMPLATE_ID_CUSTOMER);
  console.log("EMAILJS_PUBLIC_KEY:", EMAILJS_PUBLIC_KEY ? "SET" : "NOT SET");

  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_TEMPLATE_ID_CUSTOMER || !EMAILJS_PUBLIC_KEY) {
    console.error("Missing required EmailJS environment variables");
    throw new Error("Email configuration is incomplete");
  }
  
  console.log("sending owner email via EmailJS...")

  const emailResult = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID, 
    templateParams,
    EMAILJS_PUBLIC_KEY
  );

  console.log("Email sent successfully:", emailResult)

  console.log("Sending customer confirmation email...")
  const customerEmailResult = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID_CUSTOMER,
    templateParams,
    EMAILJS_PUBLIC_KEY
  );

  console.log("Customer thank you email sent successfully:", customerEmailResult)
     
  setFormData({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    packageType: "",
    date: "",
    slot: "",
    time: "",
    callRequested: false,
    callTimes: "",
    SavedDiscount: false,
    termsAccepted: false,
  });
  setSavedDiscount(false)
  setAdditionalPeople([])
  navigate("/success")

} catch (error) {
  console.error("Error:", error)
  
  if (error.name === 'EmailJSResponseError') {
    setSubmitError("Email sending failed. Please try again or contact us directly.")
  } else {
    setSubmitError("Something went wrong. Please try again.")
  }
} finally {
  setIsSubmitting(false)
}
}


  return (
    <div className="px-4">
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-md mx-auto p-8 bg-pink-50 rounded-2xl shadow-xl space-y-6 font-cinzel text-gray-800 border border-pink-200"
    >

      
      <h2 className="text-3xl font-bold text-white text-center mb-6 drop-shadow-md">Book Your Appointment</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        className="font-cinzel w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 "
      />
      <input
        type="text"
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="phone"
        placeholder="Your Phone Number"
        value={formData.phone}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="city"
        placeholder="City"
        value={formData.city}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="postcode"
        placeholder="Postcode"
        value={formData.postcode}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
 
      <h3 className="font-semibold mt-4">Bridal Package</h3>
      <select
        name="packageType"
        value={formData.packageType}
        onChange={handleChange}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        <option value="">-- Select Bridal Package --</option>
        {packages.map((pkg) => (
          <option key={pkg.name} value={pkg.name}>
            {pkg.name} (£{pkg.price})
          </option>
        ))}
      </select>
  
  <div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.isGuestBooking || false}
      onChange={(e) =>
        setFormData({ ...formData, isGuestBooking: e.target.checked })
      }
    />
    Guest/Party Booking (£60/hour)
  </label>
  {formData.isGuestBooking && (
    <p className="text-sm text-gray-500">
      * Minimum 10 people required for this booking
    </p>
  )}
</div>
{formData.isGuestBooking && (
  <div className="mt-2">
    <label>Select Duration:</label>
    <select
      value={formData.guestDuration || ""}
      onChange={(e) =>
        setFormData({ ...formData, guestDuration: parseInt(e.target.value) })
      }
      className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
    >
      <option value="">-- Select --</option>
      <option value={2}>2 Hours (£120)</option>
      <option value={3}>3 Hours (£180)</option>
      <option value={4}>4 Hours (£240)</option>
    </select>
  </div>
)}




      <h3 className="font-semibold mt-4">Additional People</h3>
      <label>Number of Additional People (0-3):</label>
      <input
        type="number"
        min={0}
        max={3}
        value={additionalPeople.length.toString()}
        onChange={(e) => {
          const count = Math.min(3, Math.max(0, parseInt(e.target.value) || 0));
        const updated = Array.from({ length: count }, () => ({}));
    setAdditionalPeople(updated);;
        }}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
   
    
      
      <label className="mt-4 block">Select Date:</label>
      <DatePicker
        selected={formData.date}
        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
        dateFormat="dd-MM-yyyy"
        minDate={new Date()}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        required
      />
     
      <label className="mt-4 block">Select Slot:</label>
      <select
        name="slot"
        value={formData.slot}
        onChange={handleChange}
        autoComplete="off"
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        <option value="">-- Select Slot --</option>
        <option value="Morning">Morning</option>
        <option value="Afternoon">Afternoon</option>
      </select>
     
      <label className="mt-4 block">Select Time:</label>
      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        autoComplete="off"
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      {timeError && <p className="text-red-500">{timeError}</p>}
    
      <label className="mt-4 block">
        <input
          type="checkbox"
          name="callRequested"
          checked={formData.callRequested}
          onChange={handleChange}
          className="w-4 h-4 mr-2 border border-pink-300 rounded-sm shadow-sm checked:bg-pink-500 checked:border-transparent appearance-none"
        />
        Request a Call Back
      </label>
      {formData.callRequested && (
        <textarea
          name="callTimes"
          placeholder="Enter preferred call times"
          value={formData.callTimes}
          onChange={handleChange}
          className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      )}

     
<div className="mt-4 font-bold text-lg">
  Total Price: £{totalPrice.toFixed(2)}
  {savedDiscount && <span className="text-green-600 ml-2">(£10 discount applied)</span>}
</div>


<div>
  {(isPackageSelected || isGuestBookingSelected) && (
    <p className="mt-2 font-semibold text-pink-600">
      Deposit: £{totalDeposit}
      <span className="block text-sm font-normal text-black mt-1">
        {isPackageSelected && "(£50 for Bridal Package"}
        {isPackageSelected && isGuestBookingSelected && " + "}
        {isGuestBookingSelected && "£20 for Guest/Party Booking"}
        {(isPackageSelected || isGuestBookingSelected) && ")"}
      </span>
     
    </p>
  )}

</div>

 <div className="mt-6 border-t pt-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            className="w-4 h-4 mt-1 accent-pink-500 flex-shrink-0"
            required
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I accept the Terms and Conditions{' '}
            <button
              type="button"
              onClick={() => setShowTerms(!showTerms)}
              className="text-pink-600 hover:text-pink-800 underline font-medium focus:outline-none"
            >
              (Read More)
            </button>
          </span>
        </label>
        
        
        {showTerms && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-pink-200 max-h-64 overflow-y-auto text-sm text-gray-600">
            <h4 className="font-semibold mb-3 text-pink-700">Terms and Conditions</h4>
            
            <div className="space-y-3">
             <p>n/a</p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="mt-4 text-pink-600 hover:text-pink-800 font-medium focus:outline-none"
            >
              Close
            </button>
          </div>
        )}
      </div>

     
      {formError && <p className="text-red-600">{formError}</p>}
      {submitError && <p className="text-red-600 font-semibold">{submitError}</p>}
      <button
        disabled={isSubmitting || !formData.termsAccepted}
  className={`w-full text-white py-3 rounded-md ${
    isSubmitting || !formData.termsAccepted
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-yellow-400 hover:bg-yellow-500'
  }`}
>
  {isSubmitting ? 'Processing...' : 'Submit Booking Inquiry'}
      </button>
    </form>

    <Footer />
  </div>
  )
}
export default SimpleBooking