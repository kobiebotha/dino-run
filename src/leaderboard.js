import { column, PowerSyncDatabase, Schema, Table } from "@powersync/web";

const games = new Table({
  finished_at: column.text,
  name: column.text,
  score: column.integer,
});

const schema = new Schema({
  games,
});

const db = new PowerSyncDatabase({
  schema,
  database: { dbFilename: "dino.db" },
});

export async function addEntry(score) {
  console.log("adding entry");
  await db.execute(
    "INSERT INTO games (id, finished_at, name, score) VALUES (uuid(), CURRENT_TIMESTAMP, ?, ?) ",
    ["", score]
  );
  console.log("done");
}

export async function drawLeaderboard() {
  const container = document.getElementById("leaderboard");
  const table = document.createElement("table");
  container.appendChild(table);

  // Reactive UI? Never heard of it!
  console.log("start watching games");
  db.watchWithCallback("SELECT * FROM games ORDER BY score DESC LIMIT 10", [], {
    onResult: (results) => {
      console.log("has results", results);
    },
  });

  const query = db.watchWithAsyncGenerator(
    "SELECT * FROM games ORDER BY score DESC LIMIT 10"
  );

  for await (const results of query) {
    console.log("has results", results);
    const rows = results.rows;

    table.innerHTML = "";

    for (const row of rows._array) {
      const domRow = document.createElement("tr");

      const domFinishedAt = document.createElement("td");
      domFinishedAt.innerText = row.finished_at;

      const domScore = document.createElement("td");
      domScore.innerText = row.score;

      domRow.appendChild(domFinishedAt);
      domRow.appendChild(domScore);
      table.appendChild(domRow);
    }
  }
}
