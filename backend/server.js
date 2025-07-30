import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();
app.use(express.json());

// Load service account credentials from file
const credentials = JSON.parse(fs.readFileSync('credentials.json'));

// Authenticate with Google
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Read calendar ID from environment variable
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

app.get('/', (req, res) => {
  res.send('Server is running and connected to Google Calendar');
});

// Test endpoint to fetch upcoming events
app.get('/events', async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID, // Use env variable her
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    app.post('/book-event', async (req, res) => {
  try {
    const { summary, description, startDateTime, endDateTime } = req.body;

    const event = {
      summary,
      description,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    };

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
    });

    res.status(201).json({ message: 'Event created!', eventId: response.data.id });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Failed to create event');
  }
});


    app.delete('/cancel-event/:eventId', async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: req.params.eventId,
    });
    res.json({ message: 'Event cancelled' });
  } catch (error) {
    console.error('Error cancelling event:', error);
    res.status(500).send('Failed to cancel event');
  }
});

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Failed to fetch events');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
