// src/BookingForm.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",      // new address line
    city: "",         // new city line
    postcode: "",     // new postcode line
    package: "",
    addOns: [],
    date: null,
    slot: "", // new slot: "Morning" or "Afternoon"
    time: "",
    callRequested: false,
    callTimes: "",
  });
  const [success, setSuccess] = useState(false);
  const [timeError, setTimeError] = useState("");

  const packages = [
    { name: "Basic", price: 50 },
    { name: "Premium", price: 100 },
    { name: "Luxury", price: 150 },
  ];

  const addOnOptions = [
    { name: "Extra Styling", price: 20 },
    { name: "Travel to Location", price: 15 },
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
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate time based on slot
  useEffect(() => {
    if (!formData.time || !formData.slot) {
      setTimeError("");
      return;
    }
    const [hours, minutes] = formData.time.split(":").map(Number);

    if (formData.slot === "Morning") {
      // Morning slot: 10:00 - 15:59
      if (hours < 10 || hours >= 16) {
        setTimeError("For Morning slot, time must be between 10:00 and 15:59");
      } else {
        setTimeError("");
      }
    } else if (formData.slot === "Afternoon") {
      // Afternoon slot: 16:00 - 21:00 (you can adjust end time)
      if (hours < 16 || hours > 21) {
        setTimeError("For Afternoon slot, time must be between 16:00 and 21:00");
      } else {
        setTimeError("");
      }
    }
  }, [formData.time, formData.slot]);

  const totalPrice =
    (packages.find((p) => p.name === formData.package)?.price || 0) +
    addOnOptions
      .filter((opt) => formData.addOns.includes(opt.name))
      .reduce((acc, item) => acc + item.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timeError) return alert("Please fix the time selection before submitting.");

    const form = new FormData();
    form.append("access_key", "0e74b282-1631-4ffc-be65-dddd8c96996b"); // 👉 Replace with your key
    form.append("subject", "New Booking Request");
    form.append("from_name", formData.name);
    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("phone", formData.phone);
    form.append("address", formData.address);   // added address to submission
    form.append("city", formData.city);         // added city to submission
    form.append("postcode", formData.postcode); // added postcode to submission
    form.append("package", formData.package);
    form.append("addons", formData.addOns.join(", "));
    form.append("date", formData.date ? formData.date.toLocaleDateString("en-GB") : "");
    form.append("slot", formData.slot);
    form.append("time", formData.time);
    form.append("callRequested", formData.callRequested ? "Yes" : "No");
    form.append("callTimes", formData.callTimes);
    form.append("total", `£${totalPrice}`);

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    if (result.success) {
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",   // reset address
        city: "",      // reset city
        postcode: "",  // reset postcode
        package: "",
        addOns: [],
        date: null,
        slot: "",
        time: "",
        callRequested: false,
        callTimes: "",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md space-y-5"
    >
      <h2 className="text-2xl font-semibold text-center mb-4">Book Your Appointment</h2>

      {success && (
        <p className="text-green-600 text-center font-medium">
          ✅ Booking submitted successfully!
        </p>
      )}

      <label htmlFor="email" className="block font-medium mb-1">Name</label>

      <input
  id="name"
  type="text"
  name="name"
  placeholder="Name"
  value={formData.name}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>
<label htmlFor="email" className="block font-medium mb-1">Email</label>
<input
  id="email"
  type="email"
  name="email"
  placeholder="Your Email"
  value={formData.email}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>

<label htmlFor="phone" className="block font-medium mb-1">Phone Number</label>
<input
  id="phone"
  type="tel"
  name="phone"
  placeholder="Your Phone Number"
  value={formData.phone}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>

<label htmlFor="address" className="block font-medium mb-1">Address</label>
<input
  id="address"
  type="text"
  name="address"
  placeholder="Address"
  value={formData.address}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>

<label htmlFor="city" className="block font-medium mb-1">City</label>
<input
  id="city"
  type="text"
  name="city"
  placeholder="City"
  value={formData.city}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>

<label htmlFor="postcode" className="block font-medium mb-1">Postcode</label>
<input
  id="postcode"
  type="text"
  name="postcode"
  placeholder="Postcode"
  value={formData.postcode}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md"
/>

      <label className="block font-medium">Select a Package:</label>
      <select
        name="package"
        value={formData.package}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="">-- Select --</option>
        {packages.map((pkg) => (
          <option key={pkg.name} value={pkg.name}>
            {pkg.name} (£{pkg.price})
          </option>
        ))}
      </select>

      <fieldset className="space-y-2">
        <legend className="font-medium">Add-ons:</legend>
        {addOnOptions.map((opt) => (
          <label key={opt.name} className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              name="addOns"
              value={opt.name}
              checked={formData.addOns.includes(opt.name)}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
            <span>{opt.name} (£{opt.price})</span>
          </label>
        ))}
      </fieldset>

      <label className="block font-medium">Select Date:</label>
      <DatePicker
        selected={formData.date}
        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
        minDate={new Date()}
        required
        className="w-full px-4 py-2 border rounded-md"
        placeholderText="Select a date"
        dateFormat="dd/MM/yyyy"
      />

      <label className="block font-medium mt-4">Select Booking Slot:</label>
      <select
        name="slot"
        value={formData.slot}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="">-- Select Slot --</option>
        <option value="Morning">Morning (From 10:00 AM)</option>
        <option value="Afternoon">Afternoon (From 4:00 PM)</option>
      </select>

      <label className="block font-medium mt-4">Select Time:</label>
      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md"
      />
      {timeError && <p className="text-red-600 mt-1">{timeError}</p>}

      <p className="text-sm text-gray-600 mt-1">
        * Morning slot bookings can be scheduled between 10:00 AM and 3:59 PM. <br />
        * Afternoon slot bookings can be scheduled between 4:00 PM and 9:00 PM.
      </p>

      <label className="inline-flex items-center space-x-2 mt-4">
        <input
          type="checkbox"
          name="callRequested"
          checked={formData.callRequested}
          onChange={handleChange}
          className="form-checkbox h-5 w-5 text-indigo-600"
        />
        <span>Request a call</span>
      </label>

      {formData.callRequested && (
        <textarea
          name="callTimes"
          placeholder="Preferred call times"
          value={formData.callTimes}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md mt-2"
        />
      )}

      <p className="text-lg font-semibold text-center">
        Total Price: £{totalPrice}
      </p>

      <button
        type="submit"
        disabled={!!timeError}
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
      >
        Submit Booking
      </button>
    </form>
  );
}

export default BookingForm;