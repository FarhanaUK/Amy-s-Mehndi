import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

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

// Helper function to convert any date string to UK time ISO string
function toUKISOString(dateStr) {
  // Convert input date string to Date object localized to UK time zone
  const ukTimeString = new Date(dateStr).toLocaleString('en-GB', { timeZone: 'Europe/London' });
  // Convert localized string back to Date object
  const ukDate = new Date(ukTimeString);
  // Return ISO string for Google Calendar API
  return ukDate.toISOString();
}

// POST /book-event to create calendar events
app.post('/book-event', async (req, res) => {
  try {
    const { summary, description, startDateTime, endDateTime } = req.body;

    const event = {
      summary,
      description,
      start: { dateTime: toUKISOString(startDateTime) }, 
      end: { dateTime: toUKISOString(endDateTime) },    
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
