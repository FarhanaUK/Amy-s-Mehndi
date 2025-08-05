import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom"; // for redirect
import "react-datepicker/dist/react-datepicker.css";

function BookingForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    packageType: "",
    addOns: [],
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

  const addOnOptions = [
    { name: "Extra Styling", price: 20 },
   
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "addOns") {
      setFormData((prev) => ({
        ...prev,
        addOns: checked
          ? [...prev.addOns, value]
          : prev.addOns.filter((item) => item !== value),
      }));
    } else if (type === "checkbox" && name === "callRequested") {
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
      if (hours < 9 || (hours === 11 && minutes > 0) || hours > 11) {
        setTimeError("For Morning slot, time must be between 09:00 and 11:00");
      } else {
        setTimeError("");
      }
    } else if (formData.slot === "Afternoon") {
      if (hours < 16 || (hours === 18 && minutes > 0) || hours > 18) {
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

  // Check discount and update state
  useEffect(() => {
    const discount = additionalPeople.some((p) => p.package) ? 10 : 0;
    setSavedDiscount(discount > 0);
  }, [additionalPeople]);

  const basePrice = packages.find((p) => p.name === formData.package)?.price || 0;

  const addOnsTotal = addOnOptions
      .filter((opt) => Array.isArray(formData.addOns) && formData.addOns.includes(opt.name))
    .reduce((acc, item) => acc + item.price, 0);

  // Fix totalPrice calculation: base + additional + addons - discount if any
  const discount = savedDiscount ? 10 : 0;
  const totalPrice = basePrice + additionalTotal + addOnsTotal - discount;

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.postcode ||
      !formData.package ||
      !formData.date ||
      !formData.slot ||
      !formData.time
    ) {
      setFormError("Please fill in all required fields.");
      return false;
    }
    if (timeError) {
      setFormError(timeError);
      return false;
    }
    setFormError("");
    return true;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
console.log("Submitting form...")
  try {

    console.log("Date:", formData.date);
console.log("Time:", formData.time);
    // Convert date and time inputs to valid ISO strings for backend
    const dateString = formData.date.toISOString().split('T')[0]; 
     const startDateTime = new Date(`${dateString}T${formData.time}:00`).toISOString();
    const endDateTime = new Date(`${dateString}T${formData.time}:00`).toISOString();
console.log("Start datetime:", startDateTime);
console.log("End datetime:", endDateTime);
    const response = await fetch("http://localhost:5000/book-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        startDateTime, // backend expects ISO date string
        endDateTime,   // backend expects ISO date string
      }),
    });
console.log("Fetch finished:", response)
    if (response.ok) {
      alert(`Booking submitted! Total price: £${totalPrice}`);
      setFormData({ /* reset form or keep as needed */ });
      navigate("/success");
    } else {
      const errorData = await response.json();
      setFormError("Error: " + (errorData.message || "Booking failed"));
    }
  } catch (error) {
    setFormError("Network error: " + error.message);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
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
        required
        className="font-cinzel w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 "
      />
      <input
        type="email"
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="tel"
        name="phone"
        placeholder="Your Phone Number"
        value={formData.phone}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="city"
        placeholder="City"
        value={formData.city}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="text"
        name="postcode"
        placeholder="Postcode"
        value={formData.postcode}
        onChange={handleChange}
        required
        className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      {/* Package Selector */}
      <h3 className="font-semibold mt-4">Bridal Package</h3>
      <select
        name="package"
        value={formData.package}
        onChange={handleChange}
        required
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
      {formData.package === "Guest/party booking" && (
        <div>
          <label>Number of Guests:</label>
          <input
            type="number"
            min={0}
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-pink-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      )}

      {/* Add-ons */}
      <h3 className="font-semibold mt-4">Add-ons</h3>
      {addOnOptions.map((opt) => (
        <label key={opt.name} className="block">
          <input
            type="checkbox"
            name="addOns"
            value={opt.name}
            checked={(formData.addOns || []).includes(opt.name)}
            onChange={handleChange}
            className="w-4 h-4 mr-2 border border-pink-300 rounded-sm shadow-sm checked:bg-pink-500 checked:border-transparent appearance-none"
          />
          {opt.name} (£{opt.price})
        </label>
      ))}

      {/* Date picker */}
      <label className="mt-4 block">Select Date:</label>
      <DatePicker
        selected={formData.date}
        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
        dateFormat="yyyy-MM-dd"
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

      {/* Price Display */}
      <div className="mt-4 font-bold text-lg">
        Total Price: £{totalPrice.toFixed(2)}
        {savedDiscount && <span className="text-green-600 ml-2">(£10 discount applied)</span>}
      </div>

      {/* Form Error */}
      {formError && <p className="text-red-600">{formError}</p>}

      <button
        type="submit"
        className="w-full text-white py-3 rounded-md bg-yellow-400 hover:bg-yellow-500"
      >
        Book Now
      </button>
    </form>
  );
}

export default BookingForm;
