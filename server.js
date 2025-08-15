const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve static site if desired

const DB = path.join(__dirname, 'messages.json');

app.post('/api/chat', async (req, res) => {
  try{
    const entry = { id: Date.now(), ts: new Date().toISOString(), ...req.body };
    let arr = [];
    try { arr = JSON.parse(await fs.readFile(DB, 'utf8') || '[]'); } catch(e){ arr = []; }
    arr.unshift(entry);
    await fs.writeFile(DB, JSON.stringify(arr, null, 2), 'utf8');
    res.json({ ok: true });
  }catch(err){
    console.error(err);
    res.status(500).json({ ok:false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));