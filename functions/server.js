
import express from "express";
import cors from "cors"; // ← Proper import style
import { google } from "googleapis";
import fs from "fs";
import Stripe from "stripe";
import dotenv from "dotenv";

// Add this import at the top of your server.js file
import { Buffer } from 'buffer';
dotenv.config();


const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://amys-mehndi-booking.web.app'
];
app.use(
  cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // allow request
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'stripe-signature'],
  })
);
// No need for app.options('*', cors()) anymore
let stripe;
let calendar;
let GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
function initServices() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  // Google Calendar initialization outside the Stripe-only block
  if (!calendar) {
    if (!GOOGLE_CALENDAR_ID) throw new Error("Missing GOOGLE_CALENDAR_ID");
    const credentials = JSON.parse(fs.readFileSync("./credentials.json")); // make sure path is correct
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    calendar = google.calendar({ version: "v3", auth });
  }
  console.log("✅ Stripe and Google Calendar initialized");
  console.log("✅ yay");
}
app.post(
  "/webhook", async (req, res) => {
    console.log("🎯 WEBHOOK HIT!");
  console.log("🎯 Headers:", req.headers);
  console.log("🎯 Body type:", typeof req.body);
  console.log("🎯 Body keys:", Object.keys(req.body || {}));


    await initServices()
    const sig = req.headers["stripe-signature"];
    let rawBody;
    
    // FIREBASE WORKAROUND: Check if body was already parsed
   try {
    // In Firebase Functions, the raw body is available as req.rawBody
    if (req.rawBody) {
      rawBody = req.rawBody;
      console.log("✅ Using req.rawBody (Firebase native)");
    } 
    // If rawBody not available, try to reconstruct from parsed body
    else if (typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
      console.log("🔧 Reconstructed from parsed object");
    }
    // Last resort - if body is already a string
    else if (typeof req.body === 'string') {
      rawBody = req.body;
      console.log("✅ Using string body");
    } else {
      throw new Error("Cannot determine raw body format");
    }

    console.log("Raw body type:", typeof rawBody);
    console.log("Raw body length:", rawBody.length);
    
  } catch (bodyError) {
    console.error("❌ Error preparing raw body:", bodyError);
    return res.status(400).send("Invalid body format");
  }
    
    let event;
    console.log("Webhook received - attempting signature verification...");
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log("✅ Webhook signature verified successfully!");
      console.log("✅ Event type:", event.type);
      
    } catch (err) {
      console.log(`❌ Webhook signature verification failed:`, err.message);
      console.log("❌ Raw body type used:", typeof rawBody);
      console.log("❌ Raw body length:", rawBody ? rawBody.length : 'undefined');
      console.log("❌ Signature:", sig);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

 
if (event.type === "payment_intent.succeeded") {
  console.log("Payment succeeded event received");
  const paymentIntent = event.data.object;
  
  // Extract metadata from payment intent
  const {
    customerName,
    customerEmail,
    packageType,
    phone,
    address,
    city,
    postcode,
    guests,
    startDateTime,
    endDateTime,
  } = paymentIntent.metadata;

   try {
      // Create confirmed booking event
      console.log("Creating confirmed booking event...");
      
      
      const eventDescription = `📋 BOOKING CONFIRMED & PAID
        
Customer: ${customerName}
Email: ${customerEmail}
Phone: ${phone}
Address: ${address}, ${city}, ${postcode}
Guests: ${guests || 0}
Package: ${packageType}

Payment ID: ${paymentIntent.id}
Booking confirmed at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`;

      const calendarEvent = {
        summary: `✅ CONFIRMED: ${packageType} for ${customerName}`,
        description: eventDescription,
        start: { dateTime: startDateTime, timeZone: "Europe/London" },
        end: { dateTime: endDateTime, timeZone: "Europe/London" },
        colorId: "10", // Green color for confirmed bookings
      };

      const eventResponse = await calendar.events.insert({
        calendarId: GOOGLE_CALENDAR_ID,
        resource: calendarEvent,
      });

      console.log(`✅ Google Calendar event created: ${eventResponse.data.htmlLink}`);
      
    } catch (calendarError) {
      console.error("❌ Error creating calendar event:", calendarError);
    }
  }

  // Important: Always respond to webhook
  res.json({ received: true });
});

function isSlotAvailable(events, requestedStart, requestedEnd) {
  const reqStart = new Date(requestedStart).getTime();
  const reqEnd = new Date(requestedEnd).getTime();
  return !events.some((event) => {
    const eventStart = new Date(
      event.start.dateTime || event.start.date
    ).getTime();
    const eventEnd = new Date(event.end.dateTime || event.end.date).getTime();
    
    return reqStart < eventEnd && reqEnd > eventStart;
  });
}
async function fetchEventsInRange(startDateTime, endDateTime) {
  const response = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin: startDateTime,
    timeMax: endDateTime,
    singleEvents: true,
    orderBy: "startTime",
  });
  return response.data.items || [];
}
app.use(express.json());
app.post("/book-event", async (req, res) => {
 console.log("🔥 /book-event endpoint hit");
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("🔥 /book-event endpoint hit");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  try {
     console.log("Step 1: Initializing services...");
    await initServices();
     console.log("✅ Services initialized");
     console.log("Step 2: Extracting data...");
    const {
      name,
      email,
      phone,
      packageType,
      address,
      city,
      postcode,
      guests,
      startDateTime,
      depositAmount,
    } = req.body;
       console.log("✅ Data extracted");
    if (
      !name ||
      !email ||
      !phone ||
      !packageType ||
      !startDateTime ||
      !address ||
      !city ||
      !postcode
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: name, email, phone, address, city, postcode, packageType, startDateTime",
      });
    }
    // Check required address fields
    if (!address || !city || !postcode) {
      return res
        .status(400)
        .json({ message: "Address, city, and postcode are required" });
    }
    




const start = new Date(startDateTime);
const startHour = new Date(startDateTime).getHours();
const minutes = start.getMinutes();
// ADD THESE DEBUG LOGS
console.log("=== TIME DEBUG ===");
console.log("📅 Received startDateTime:", startDateTime);
console.log("🕐 Parsed as UTC date:", start);
console.log("⏰ UTC Hour:", startHour, "Minutes:", minutes);
// Get London time properly
const londonHour = parseInt(new Date(startDateTime).toLocaleString("en-US", {
  timeZone: "Europe/London",
  hour: 'numeric',
  hour12: false
}));
const londonMinutes = parseInt(new Date(startDateTime).toLocaleString("en-US", {
  timeZone: "Europe/London",
  minute: 'numeric'
}));
const londonTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false
}).format(new Date(startDateTime));
console.log("🇬🇧 London hour:", londonHour);
console.log("🇬🇧 London minutes:", londonMinutes);
console.log("🇬🇧 London time formatted:", londonTime);
// Also check what your frontend is actually sending
console.log("📱 Raw formData.date:", req.body.date);
console.log("📱 Raw formData.time:", req.body.time);
console.log("=== END DEBUG ===");
// IMPORTANT: Use London time for validation, not UTC
if (
  !(
    (londonHour >= 9 && (londonHour < 11 || (londonHour === 11 && londonMinutes === 0))) ||
    (londonHour >= 16 && (londonHour < 18 || (londonHour === 18 && londonMinutes === 0)))
  )
) {
  console.log("❌ Time validation FAILED");
  console.log(`Attempted booking at London time: ${londonHour}:${londonMinutes}`);
  return res
    .status(400)
    .json({ message: "Bookings only allowed between 9-11am and 4-6pm" });
}
console.log("✅ Time validation PASSED");















    const startTime = new Date(startDateTime).getTime();
  
    const bookingDurationMs = 3 * 60 * 60 * 1000;
    const endTime = startTime + bookingDurationMs;
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ message: "Invalid start or end date" });
    }
    const endDateTime = new Date(endTime).toISOString();
    const existingEvents = await fetchEventsInRange(startDateTime, endDateTime);
    const available = isSlotAvailable(
      existingEvents,
      startDateTime,
      endDateTime
    );
    if (!available) {
      return res.status(409).json({
        message:
          "Sorry, this slot is already booked. Please choose another time.",
      });
    }
    



    const depositAmountInPence = depositAmount * 100; // convert £ to pence
console.log("Creating payment intent now")
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountInPence,
      currency: "gbp",
      metadata: {
        customerName: name,
        customerEmail: email,
        packageType,
        phone,
        address,
        city,
        postcode,
        guests: guests || 0,
        startDateTime,
        endDateTime,
      },
    });
 console.log("Payment intent created:", paymentIntent.id); 
 return res.status(200).json({
      message: "Payment initiated",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
   console.error("❌ Detailed error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ message: "Internal server error" });
  }

});

app.get("/", (req, res) => {
  res.send("Server is running and connected to Google Calendar");
});

app.delete("/cancel-event/:eventId", async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: req.params.eventId,
    });
    res.json({ message: "Event cancelled" });
  } catch (error) {
    console.error(
      "Error cancelling event:",
      error.response?.data || error.message || error
    );
    res.status(500).json("Failed to cancel event");
  }
});
function filterBookingSlots(events) {
  return events
    .map((event) => ({
      id: event.id,
      date: new Date(event.start.dateTime || event.start.date).toISOString(),
      startTime: new Date(event.start.dateTime || event.start.date),
      endTime: new Date(event.end.dateTime || event.end.date),
      summary: event.summary || "No title",
      location: event.location || "",
      description: event.description || "",
      htmlLink: event.htmlLink || "",
      creator: event.creator?.email || "",
    }))
    .filter((slot) => {
      const hour = slot.startTime.getHours();
      return (hour >= 9 && hour < 11) || (hour >= 16 && hour < 18);
    })
    .map((slot) => ({
      id: slot.id,
      date: slot.date,
      start: slot.startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: slot.endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      summary: slot.summary,
    }));
}
app.get("/events", async (req, res) => {
  try {
    const now = new Date();
    const timeMin = now.toISOString(); // now
    const timeMax = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = response.data.items || [];
    const filteredEvents = filterBookingSlots(events);
    res.json(filteredEvents);
  } catch (error) {
    console.error(
      "Error fetching events:",
      error.response?.data || error.message || error
    );
    res.status(500).send("Failed to fetch events");
  }

  
});

app.get("/webhook", (req, res) => {
  res.json({ 
    message: "Webhook endpoint is alive", 
    timestamp: new Date().toISOString() 
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString() 
  });
});


export default app;
