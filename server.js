const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Wörter, die bereits verwendet wurden (global)
const usedWords = new Set();

// Erstelle HTTP-Server
const server = http.createServer((req, res) => {
    // Liefere die index.html aus
    const filePath = path.join(__dirname, 'index.html');
    const readStream = fs.createReadStream(filePath);

    readStream.on('open', () => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
    });

    readStream.on('error', (err) => {
        res.writeHead(404);
        res.end('Datei nicht gefunden');
    });

    readStream.pipe(res);
});

// WebSocket-Server für Echtzeit-Kommunikation
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Neuer Client verbunden');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'chat') {
                // Verarbeite die Nachricht und prüfe auf doppelte Wörter
                const processedMessage = processMessage(data.text);
                const response = {
                    type: 'chat',
                    text: processedMessage,
                    original: data.text
                };

                // Sende die verarbeitete Nachricht an alle Clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(response));
                    }
                });
            }
        } catch (err) {
            console.error('Fehler beim Verarbeiten der Nachricht:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client getrennt');
    });
});

// Hilfsfunktion: Prüfe, ob Wörter bereits verwendet wurden
function processMessage(text) {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = [];
    const usedInThisMessage = new Set();

    for (const word of words) {
        if (!usedWords.has(word) && !usedInThisMessage.has(word)) {
            uniqueWords.push(word);
            usedInThisMessage.add(word);
            usedWords.add(word); // Markiere das Wort als verwendet
        }
    }

    return uniqueWords.join(' ');
}

// Starte den Server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
