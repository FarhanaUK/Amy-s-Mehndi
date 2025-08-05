import * as functions from 'firebase-functions';
import app from './server.js';  // import app with .js extension

export const api = functions.https.onRequest(app);
