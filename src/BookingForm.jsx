import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    package: "",
    addOns: [],
    date: null,
    slot: "",
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
    const [hours] = formData.time.split(":").map(Number);

    if (formData.slot === "Morning") {
      if (hours < 10 || hours >= 16) {
        setTimeError("For Morning slot, time must be between 10:00 and 15:59");
      } else {
        setTimeError("");
      }
    } else if (formData.slot === "Afternoon") {
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

    if (!formData.date) return alert("Please select a date.");

    // Construct start and end datetime strings for the event in ISO format
    const [hours, minutes] = formData.time.split(":").map(Number);
    const startDateTime = new Date(formData.date);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Set end time 1 hour after start time (adjust if needed)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    // Prepare event data for backend
    const eventPayload = {
      summary: `Booking: ${formData.name}`,
      description: `Package: ${formData.package}, Add-ons: ${formData.addOns.join(", ")}`,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    };

    try {
      const response = await fetch("/book-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });

      if (!response.ok) throw new Error("Failed to book event");

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postcode: "",
        package: "",
        addOns: [],
        date: null,
        slot: "",
        time: "",
        callRequested: false,
        callTimes: "",
      });
    } catch (err) {
      alert("Error submitting booking: " + err.message);
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

      <label htmlFor="name" className="block font-medium mb-1">Name</label>
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
        placeholder="Your Address"
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

      <label className="block font-medium mb-1">Choose Package</label>
      <select
        name="package"
        value={formData.package}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="" disabled>Select package</option>
        {packages.map((pkg) => (
          <option key={pkg.name} value={pkg.name}>
            {pkg.name} (£{pkg.price})
          </option>
        ))}
      </select>

      <fieldset className="space-y-2">
        <legend className="font-medium mb-1">Add-ons</legend>
        {addOnOptions.map((opt) => (
          <label key={opt.name} className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              name="addOns"
              value={opt.name}
              checked={formData.addOns.includes(opt.name)}
              onChange={handleChange}
              className="mr-2"
            />
            {opt.name} (£{opt.price})
          </label>
        ))}
      </fieldset>

      <label className="block font-medium mb-1">Select Date</label>
      <DatePicker
        selected={formData.date}
        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
        dateFormat="yyyy-MM-dd"
        minDate={new Date()}
        required
        className="w-full px-4 py-2 border rounded-md"
      />

      <label className="block font-medium mb-1">Select Slot</label>
      <select
        name="slot"
        value={formData.slot}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="" disabled>Select slot</option>
        <option value="Morning">Morning (10am-4pm)</option>
        <option value="Afternoon">Afternoon (4pm-9pm)</option>
      </select>

      <label className="block font-medium mb-1">Select Time</label>
      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        required
        className={`w-full px-4 py-2 border rounded-md ${timeError ? "border-red-500" : ""}`}
      />
      {timeError && <p className="text-red-600 text-sm mt-1">{timeError}</p>}

      <label className="inline-flex items-center space-x-2">
        <input
          type="checkbox"
          name="callRequested"
          checked={formData.callRequested}
          onChange={handleChange}
          className="form-checkbox"
        />
        <span>Request a call</span>
      </label>

      {formData.callRequested && (
        <textarea
          name="callTimes"
          placeholder="Preferred call times"
          value={formData.callTimes}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md"
        />
      )}

      <p className="text-lg font-semibold mt-4">
        Total Price: £{totalPrice}
      </p>

      <button
        type="submit"
        disabled={!!timeError}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition"
      >
        Submit Booking
      </button>
    </form>
  );
}

export default BookingForm;
