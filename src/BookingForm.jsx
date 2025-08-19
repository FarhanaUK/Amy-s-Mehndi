
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom"; // for redirect
import "react-datepicker/dist/react-datepicker.css";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import emailjs from '@emailjs/browser'
import Footer from "./Footer";


function BookingForm() {

const stripe = useStripe();
const elements = useElements();
const navigate = useNavigate();

const EMAILJS_SERVICE_ID = 'service_7ed8v2a';
const EMAILJS_TEMPLATE_ID = 'template_m8o042e';
const EMAILJS_PUBLIC_KEY = '130oCqD8htmBVYM0t'; // Replace with your Public Key


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
    guests: 0,
  });
  const [timeError, setTimeError] = useState("");
  const [formError, setFormError] = useState("");
  const [additionalPeople, setAdditionalPeople] = useState([]);
  const [savedDiscount, setSavedDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
    { name: "Guest/party booking", price: 60 },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "callRequested") {
      setFormData((prev) => ({ ...prev, callRequested: checked }));
    } else if (name === "guests") {
      const guestsCount = Math.max(0, parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, guests: guestsCount }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (!formData.time || !formData.slot) {
      setTimeError("");
      return;
    }
    const [hours, minutes] = formData.time.split(":").map(Number);
    if (formData.slot === "Morning") {
  if (hours < 9 ||
      (hours === 11 && minutes > 0) ||
      hours > 11) {
    setTimeError("For Morning slot, time must be between 09:00 and 11:00");
  } else {
    setTimeError("");
  }
} else if (formData.slot === "Afternoon") {
  if (hours < 16 ||
      (hours === 18 && minutes > 0) ||
      hours > 18
) {
    setTimeError("For Afternoon slot, time must be between 16:00 and 18:00");
  } else {
    setTimeError("");
  }
}
  }, [formData.time, formData.slot]);
  // Calculate additionalPeople total price
  const additionalTotal = additionalPeople.reduce((acc, p) => {
    const pkg = packages.find((x) => x.name === p.package);
    return acc + (pkg ? pkg.price : 0);
  }, 0);

  
 useEffect(() => {

  const bridalPackages = [
  "Classic",
  "Classic hands only",
  "Elegance",
  "Elegance hands only",
  "Picturesque",
  "Picturesque hands only",
  "Diamond",
  "Diamond hands only",
  "Showstopper",
  "Showstopper hands only",
];
  
const isBridalPackage = bridalPackages.includes(formData.packageType);
const hasAdditionalPeople = additionalPeople.length > 0 && additionalPeople.some(p => p.package);
const discount = isBridalPackage && hasAdditionalPeople ? 10 : 0;
  setSavedDiscount(discount > 0);
}, [formData.packageType, additionalPeople]);

const basePrice = packages.find(p => p.name === formData.packageType)?.price || 0;
const discount = savedDiscount ? 10 : 0;
const totalPrice = basePrice + additionalTotal - discount;



const isPackageSelected = formData.packageType !== "";
const depositForPackage = isPackageSelected ? 50 : 0;
const depositForAdditionalPeople = additionalPeople.length * 20;
const totalDeposit = depositForPackage + depositForAdditionalPeople;

const validateForm = () => {
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
      setFormError("Please fill in all required fields.");
      return false;
    }

    if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      setFormError("Name must be between 2 and 50 characters.");
      return false;
    }

    if (!/^[a-zA-Z\s\-']+$/.test(formData.name.trim())) {
      setFormError("Name can only contain letters, spaces, hyphens, and apostrophes.");
      return false;
    }

    if (timeError) {
      setFormError(timeError);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.");
      return false;
    }


if (!/^\+?\d{7,15}$/.test(formData.phone.trim())) {
  setFormError("Please enter a valid phone number.");
  return false;
}

if (!/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(formData.postcode.trim())) {
      setFormError("Please enter a valid UK postcode.");
      return false;
    }


if (additionalPeople.some(p => !p.package)) {
  setFormError("Please select a package for each additional person.");
  return false;
}

    setFormError("");
    return true;
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm() || isSubmitting) return
  
  setIsSubmitting(true)
  setPaymentError("")

try{
  console.log("Form data to send:", formData)

 
const date = new Date(formData.date); 
const [hours, minutes] = formData.time.split(":");
date.setHours(+hours);  
date.setMinutes(+minutes); 
date.setSeconds(0);
const startDateTime = date.toISOString();  

console.log("Sending booking data:", {
  ...formData,
  startDateTime,
  depositAmount: totalDeposit,
});

const response = await fetch("https://us-central1-bespoke-web-engineers.cloudfunctions.net/api/book-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDateTime,
          depositAmount: totalDeposit,
        }),
      });

if (!response.ok) {
  const errorData = await response.json();
  console.error("Server error:", errorData.message);
  setPaymentError(`Booking error: ${errorData.message}`)
  return
}

const data = await response.json();

if (!stripe || !elements) {
  setPaymentError("Payment system is loading. Please try again in a moment.")
  return;
}

console.log("Payment Intent Client Secret:", data.clientSecret);

const cardElement = elements.getElement(CardElement)
const paymentResult = await stripe.confirmCardPayment(data.clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: formData.name,
      email: formData.email,
    },
  },
});

if (paymentResult.error) {
  setPaymentError(`Payment failed: ${paymentResult.error.message}`)
  return
}

if (paymentResult.paymentIntent.status !== "succeeded") {
  setPaymentError("Payment was not successful. Please try again.");
  return;
}

console.log("Sending email via EmailJS...");

const additionalGuestsCount = additionalPeople?.length || 0;
let additionalGuestsInfo = "No additional guests";
if (additionalGuestsCount && additionalPeople.length > 0) {
  additionalGuestsInfo = additionalPeople
.map((guest, index) => `Person ${index + 1} Package: ${guest.package}`)
    .join("\n");
}

let callBackInfo = "";
if (formData.callRequested) {
  callBackInfo = `
Request a Call Back: YES
Preferred Call Times: ${formData.callTimes}
`;
} else {
  callBackInfo = "Request a Call Back: NO\n";
  console.log(additionalGuestsInfo, callBackInfo)
}

const templateParams = {
        customer_name: formData.name,
        customer_email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postcode: formData.postcode,
        package_type: formData.packageType,
        additional_people_count: additionalGuestsCount,
        additional_people_info: additionalGuestsInfo,
        call_back_info: callBackInfo,
        total_price: totalPrice.toFixed(2),
        total_deposit: totalDeposit,
        booking_date: formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '',
        booking_time: formData.time,
        payment_id: paymentResult.paymentIntent.id,
      };


 const emailResult = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID, 
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email sent successfully:", emailResult);


  const customerEmailResult = await emailjs.send(
  EMAILJS_SERVICE_ID,
  'template_8qwjw5n',
  templateParams,
  EMAILJS_PUBLIC_KEY
);

console.log("Customer thank you email sent successfully:", customerEmailResult);
   
     
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
        guests: 0,
        setSavedDiscount: false
     });
      setAdditionalPeople([]); // 🔥 ADD THIS: Also reset additional people
      navigate("/success");

    } catch (error) {
      console.error("Error:", error);
      
      // 🔥 ADD BETTER ERROR HANDLING
      if (error.name === 'EmailJSResponseError') {
        setPaymentError("Email sending failed. Your booking is confirmed but we couldn't send the confirmation email. Please contact us directly.");
      } else {
        setPaymentError("Something went wrong. Please try again.")
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="px-4">
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-md mx-auto p-8 bg-pink-50 rounded-2xl shadow-xl space-y-6 font-cinzel text-gray-800 border border-pink-200"
    >

      
      <h2 className="text-3xl font-bold text-white text-center mb-6 drop-shadow-md">Book Your Appointment</h2>
      {/* User Details */}
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
      {/* Package Selector */}
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
      {/* Additional People */}
      <h3 className="font-semibold mt-4">Additional People</h3>
      <label>Number of Additional People (0-10):</label>
      <input
        type="number"
        min={0}
        max={10}
        value={additionalPeople.length}
        onChange={(e) => {
          const count = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
          const updated = Array.from({ length: count }, (_, i) => additionalPeople[i] || { package: "" });
          setAdditionalPeople(updated);
        }}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      {additionalPeople.map((person, idx) => (
        <div key={idx} className="mt-2">
          <label>Person {idx + 1} Package:</label>
          <select
            value={person.package}
            onChange={(e) => {
              const updated = [...additionalPeople];
              updated[idx].package = e.target.value;
              setAdditionalPeople(updated);
            }}
            className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="">-- Select Package --</option>
            {packages.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name} (£{pkg.price})
              </option>
            ))}
          </select>
        </div>
      ))}
      {/* Guests Number Input (only for Guest/party booking) */}
      
    
      <label className="mt-4 block">Select Date:</label>
      <DatePicker
        selected={formData.date}
        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
        dateFormat="dd-MM-yyyy"
        minDate={new Date()}
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        required
      />
      {/* Slot */}
      <label className="mt-4 block">Select Slot:</label>
      <select
        name="slot"
        value={formData.slot}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        <option value="">-- Select Slot --</option>
        <option value="Morning">Morning</option>
        <option value="Afternoon">Afternoon</option>
      </select>
      {/* Time input */}
      <label className="mt-4 block">Select Time:</label>
      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      {timeError && <p className="text-red-500">{timeError}</p>}
      {/* Call Request */}
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
{isPackageSelected && (
  <p className="mt-2 font-semibold text-pink-600">
    Deposit required: £{totalDeposit}
    {(depositForPackage > 0 || additionalPeople.length > 0) && (
      <span className="block text-sm font-normal text-black mt-1">
        (£50 for Bridal Package + £20 per additional person)
      </span>
    )}
  </p>
)}

<div className="mb-4 border pb-4 pl-2">
  <label className="block mb-1 text-cyan-500 font-bold">Card Details</label>
  <CardElement options={{ hidePostalCode: true }}/>
</div>
      {/* Price Display */}
      <div className="mt-4 font-bold text-lg">
        Total Price: £{totalPrice.toFixed(2)}
        {savedDiscount && <span className="text-green-600 ml-2">(£10 discount applied)</span>}
      </div>
      {/* Form Error */}
      {formError && <p className="text-red-600">{formError}</p>}
      {paymentError && <p className="text-red-600 font-semibold">{paymentError}</p>}
      <button
        disabled={isSubmitting}
  className={`w-full text-white py-3 rounded-md ${
    isSubmitting 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-yellow-400 hover:bg-yellow-500'
  }`}
>
  {isSubmitting ? 'Processing...' : 'Book Now'}
      </button>
    </form>

    <Footer />
  </div>
  );
}
export default BookingForm;