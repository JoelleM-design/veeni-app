const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csvtojson');

// Chemin vers ton CSV
const CSV_PATH = './assets/data/brazilian_wine_data.csv';
const DB_PATH = './assets/data/wines.db';

async function main() {
  // Convertir le CSV en JSON
  const wines = await csv().fromFile(CSV_PATH);

  // Créer la base SQLite
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(`CREATE TABLE wines (
      id TEXT PRIMARY KEY,
      name TEXT,
      producer TEXT,
      region TEXT,
      country TEXT,
      year TEXT,
      grapes TEXT,
      type TEXT,
      price TEXT,
      rating TEXT
    )`);

    const stmt = db.prepare(`INSERT INTO wines VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const wine of wines) {
      stmt.run(
        wine.id || null,
        wine.name || null,
        wine.producer || null,
        wine.region || null,
        wine.country || null,
        wine.year || null,
        wine.grapes || null,
        wine.type || null,
        wine.price || null,
        wine.rating || null
      );
    }
    stmt.finalize();
  });

  db.close();
  console.log('Base SQLite générée avec succès !');
}

main(); 