// src/BookingForm.jsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    package: "",
    addOns: [],
    date: null,
    time: "",
    callRequested: false,
    callTimes: "",
  });

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

  const totalPrice =
    (packages.find((p) => p.name === formData.package)?.price || 0) +
    addOnOptions
      .filter((opt) => formData.addOns.includes(opt.name))
      .reduce((acc, item) => acc + item.price, 0);

  return (
    <form className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md space-y-5">
      <h2 className="text-2xl font-semibold text-center mb-4">Book Your Appointment</h2>

      <input
        type="text"
        name="name"
        placeholder="Your Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="email"
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="tel"
        name="phone"
        placeholder="Your Phone Number"
        value={formData.phone}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <label className="block font-medium">Select a Package:</label>
      <select
        name="package"
        value={formData.package}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholderText="Select a date"
      />

      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <label className="inline-flex items-center space-x-2">
        <input
          type="checkbox"
          name="callRequested"
          checked={formData.callRequested}
          onChange={handleChange}
          className="form-checkbox h-5 w-5 text-indigo-600"
        />
        <span>Request a Call</span>
      </label>

      {formData.callRequested && (
        <input
          type="text"
          name="callTimes"
          placeholder="When are you available for a call?"
          value={formData.callTimes}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      <p className="text-lg font-semibold">
        Total Price: <span className="text-indigo-600">£{totalPrice}</span>
      </p>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
      >
        Pay & Book
      </button>
    </form>
  );
}

export default BookingForm;
