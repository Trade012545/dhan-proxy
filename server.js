const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Main proxy endpoint
app.post('/api/dhan-historical', async (req, res) => {
    // It's safer to use an environment variable for the token
    const DHAN_ACCESS_TOKEN = process.env.DHAN_ACCESS_TOKEN;
    const DHAN_HISTORICAL_API_URL = 'https://api.dhan.co/v2/charts/intraday';

    if (!DHAN_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Server configuration error: DHAN_ACCESS_TOKEN is not set.' });
    }

    try {
        const response = await fetch(DHAN_HISTORICAL_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Token': DHAN_ACCESS_TOKEN
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            // Forward the error from the DhanHQ API
            const errorText = await response.text();
            console.error('API responded with an error:', response.status, errorText);
            return res.status(response.status).json({ error: `DhanHQ API responded with an error: ${response.status} - ${errorText}` });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ error: 'Failed to fetch data from the DhanHQ API.' });
    }
});

// A simple endpoint to check if the server is running
app.get('/', (req, res) => {
    res.send('Dhan Proxy Server is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
