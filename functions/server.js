import express from "express";
import cors from "cors"; // ← Proper import style
import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
import Stripe from "stripe";
import bodyParser from 'body-parser';

dotenv.config();

const app = express();

app.use(cors({ origin: true }));


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }), // raw buffer needed for Stripe signature check
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.body; // This is a Buffer, NOT parsed JSON
    let event;
console.log("Webhook received"); // log webhook receipt
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`Webhook signature verification failed:`, err);
      return res.sendStatus(400);
    }
console.log('Webhook received'); 
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
        // Prepare detailed event description
        const eventDescription = `
Email: ${customerEmail}
Phone: ${phone}
Address: ${address}, ${city}, ${postcode}
Guests: ${guests || 0};
        `;

        const calendarEvent = {
          summary: `Booking: ${packageType} for ${customerName}`, // dynamic summary
          description: eventDescription,
          start: { dateTime: startDateTime, timeZone: "Europe/London" }, // add timezone
          end: { dateTime: endDateTime, timeZone: "Europe/London" },
     
        };

        // Insert event using 'resource' param (recommended)
        console.log("Creating Google Calendar event now");
        const eventResponse = await calendar.events.insert({
          calendarId: GOOGLE_CALENDAR_ID,
          resource: calendarEvent,
        });

        console.log(
          `Google Calendar event created: ${eventResponse.data.htmlLink}`
        );
      } catch (calendarError) {
        console.error("Error creating calendar event:", calendarError);
      }
    }

    res.json({ received: true });
  }
);



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
  try {
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

    const start = new Date(startDateTime)
    const startHour = new Date(startDateTime).getHours();
    const minutes = start.getMinutes();
    if (
      !(
        (startHour >= 9 && (startHour < 11 || (startHour === 11 && minutes === 0))) ||
    (startHour >= 16 && (startHour < 18 || (startHour === 18 && minutes === 0)))

      )
    ) {
      return res
        .status(400)
        .json({ message: "Bookings only allowed between 9-11am and 4-6pm" });
    }

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
     // Return client_secret for frontend to confirm payment
    return res.status(200).json({
      message: "Payment initiated",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error booking event:", error);
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

const PORT = process.env.MY_PORT || 5000;
app.listen(PORT, () => {console.log(`✅ Server running at http://localhost:${PORT}`); 
  });

export default app;