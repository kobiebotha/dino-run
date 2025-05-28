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

export async function addEntry(score, playerName = "Anonymous") {
  console.log("adding entry");
  await db.execute(
    "INSERT INTO games (id, finished_at, name, score) VALUES (uuid(), CURRENT_TIMESTAMP, ?, ?) ",
    [playerName, score]
  );
  console.log("done");
}

export async function drawLeaderboard() {
  console.log("drawLeaderboard called");
  const container = document.getElementById("leaderboard");

  // Clear existing content except the h2
  const existingTable = container.querySelector("table");
  if (existingTable) {
    existingTable.remove();
  }

  const table = document.createElement("table");
  table.className = "leaderboard-table";

  // Add table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const rankHeader = document.createElement("th");
  rankHeader.textContent = "Rank";

  const nameHeader = document.createElement("th");
  nameHeader.textContent = "Name";

  const scoreHeader = document.createElement("th");
  scoreHeader.textContent = "Score";

  // const dateHeader = document.createElement("th");
  // dateHeader.textContent = "Date";

  headerRow.appendChild(rankHeader);
  headerRow.appendChild(nameHeader);
  headerRow.appendChild(scoreHeader);
  // headerRow.appendChild(dateHeader);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  container.appendChild(table);

  // Initially show empty state
  const emptyRow = document.createElement("tr");
  const emptyCell = document.createElement("td");
  emptyCell.colSpan = 4;
  emptyCell.textContent = "Loading scores...";
  emptyCell.className = "empty-leaderboard";
  emptyRow.appendChild(emptyCell);
  tbody.appendChild(emptyRow);

  try {
    // Reactive UI? Never heard of it!
    console.log("start watching games");
    db.watchWithCallback(
      "SELECT * FROM games ORDER BY score DESC LIMIT 8",
      [],
      {
        onResult: (results) => {
          console.log("has results", results);
        },
      }
    );

    const query = db.watchWithAsyncGenerator(
      "SELECT * FROM games ORDER BY score DESC LIMIT 8"
    );

    for await (const results of query) {
      console.log("has results", results);
      const rows = results.rows;

      tbody.innerHTML = "";

      if (rows._array.length === 0) {
        // Show "No scores yet" message when leaderboard is empty
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 4;
        emptyCell.textContent = "No scores yet - be the first!";
        emptyCell.className = "empty-leaderboard";
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      } else {
        rows._array.forEach((row, index) => {
          const domRow = document.createElement("tr");

          const rankCell = document.createElement("td");
          rankCell.textContent = `#${index + 1}`;
          rankCell.className = "rank-cell";

          const nameCell = document.createElement("td");
          nameCell.textContent = row.name || "Anonymous";
          nameCell.className = "name-cell";

          const scoreCell = document.createElement("td");
          scoreCell.textContent = row.score.toLocaleString();
          scoreCell.className = "score-cell";

          const dateCell = document.createElement("td");
          // ... existing code ...
          // const date = new Date(row.finished_at);
          // date.setHours(date.getHours() + 2); // Add 2 hours to the date
          // dateCell.textContent = date.toLocaleTimeString("en-US", {
          //   hour12: false,
          //   hour: "2-digit",
          //   minute: "2-digit",
          //   second: "2-digit",
          // });
          // // ... existing code ...
          // dateCell.className = "date-cell";

          domRow.appendChild(rankCell);
          domRow.appendChild(nameCell);
          domRow.appendChild(scoreCell);
          // domRow.appendChild(dateCell);
          tbody.appendChild(domRow);
        });
      }
    }
  } catch (error) {
    console.error("Error in drawLeaderboard:", error);
    // Show error state
    tbody.innerHTML = "";
    const errorRow = document.createElement("tr");
    const errorCell = document.createElement("td");
    errorCell.colSpan = 4;
    errorCell.textContent = "Error loading scores";
    errorCell.className = "empty-leaderboard";
    errorRow.appendChild(errorCell);
    tbody.appendChild(errorRow);
  }
}
