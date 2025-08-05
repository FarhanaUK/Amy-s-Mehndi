import express from 'express';
import cors from 'cors'; // ← Proper import style
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv'

dotenv.config();



const app = express();
app.use(express.json());
app.use(cors()); // ← Enables CORS


// Load credentials from credentials.json
const credentials = JSON.parse(fs.readFileSync('credentials.json'));

// Setup GoogleAuth with credentials and calendar scope
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

app.get('/', (req, res) => {
  res.send('Server is running and connected to Google Calendar');
});



// POST /book-event to create calendar events
app.post('/book-event', async (req, res) => {
  try {
    const { name, email, phone, startDateTime, endDateTime } = req.body;
if (!startDateTime || !endDateTime) {
    return res.status(400).json({ message: 'Start and end times are required' });
  }

  if (isNaN(new Date(startDateTime).getTime()) || isNaN(new Date(endDateTime).getTime())) {
    return res.status(400).json({ message: 'Invalid start or end date' });
  }
    // Build event description only with name, email, and phone
    const eventDescription = `Name: ${name}\nPhone: ${phone}\nEmail: ${email}`;

    const event = {
      summary: 'Booking Event', // You can keep a fixed summary or change as needed
      description: eventDescription,
      start: { dateTime: req.body.startDateTime, timeZone: 'Europe/London' },
      end: { dateTime: req.body.endDateTime, timeZone: 'Europe/London' },
    };


    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
    });

    res.status(201).json({ message: 'Event created!', eventId: response.data.id });
  } catch (error) {
    console.error('Error creating event:', error.response?.data || error.message || error);
    res.status(500).send('Failed to create event');
  }
});

// DELETE /cancel-event/:eventId to delete calendar events
app.delete('/cancel-event/:eventId', async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: req.params.eventId,
    });
    res.json({ message: 'Event cancelled' });
  } catch (error) {
    console.error('Error cancelling event:', error.response?.data || error.message || error);
    res.status(500).send('Failed to cancel event');
  }
});

// GET /events to list calendar events
app.get('/events', async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error.response?.data || error.message || error);
    res.status(500).send('Failed to fetch events');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

export default app