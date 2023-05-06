//importing all the necessary modules
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

let db = null;
let dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndConnectToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDbAndConnectToServer();

app.get("/", (request, response) => {
  response.send("Server running");
});

//api for getting todos
app.get("/todos/", async (request, response) => {
  try {
    const queryParameters = request.query;
    const { status = "", priority = "", search_q = "" } = queryParameters;
    //console.log(status, priority, search_q);

    const dbQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE 
            status like '%${status}%'
            AND
            priority like '%${priority}%'
            AND
            todo like '%${search_q}%'
        ORDER BY
            id ASC;
    
    `;
    const dbObj = await db.all(dbQuery);

    response.send(dbObj);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
});
//api for getting specific todo based on id
app.get("/todos/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;
    //const queryParameters = request.query;
    // const { status = "", priority = "", search_q = "" } = queryParameters;
    //console.log(status, priority, search_q);

    const dbQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE 
            id = ${todoId};
    
    `;
    const dbObj = await db.get(dbQuery);

    response.send(dbObj);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
});
//adding todo
app.post("/todos/", async (request, response) => {
  try {
    const todoDetails = request.body;
    //console.log(todoDetails);
    const { id, todo, status, priority } = todoDetails;
    const dbQuery = `
        INSERT INTO
            todo(id,todo,status,priority)
        VALUES(
            ${id},
            '${todo}',
            
            '${status}',
            '${priority}'
        );
    `;
    const dbObj = await db.run(dbQuery);
    response.send("Todo Successfully Added");
  } catch (e) {
    console.log(e.message);
  }
});

//updating todo
app.put("/todos/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;
    const todoDetails = request.body;
    const { todo, priority, status } = todoDetails;
    //console.log(todo, priority, status);
    //console.log(todo.length, priority.trim().length, status.length);

    if (todo !== undefined) {
      const dbQuery = `
            UPDATE 
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId};
       `;
      const dbObj = await db.run(dbQuery);
      response.send("Todo Updated");
    } else if (priority !== undefined) {
      const dbQuery = `
            UPDATE 
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId};
       `;
      const dbObj = await db.run(dbQuery);
      response.send("Priority Updated");
    } else if (status !== undefined) {
      const dbQuery = `
                UPDATE 
                    todo
                SET 
                    status = '${status}'
                WHERE 
                    id = ${todoId};
        `;
      const dbObj = await db.run(dbQuery);
      response.send("Status Updated");
    }
  } catch (e) {
    console.log(e.message);
  }
});
//deleting todo using todoId
app.delete("/todos/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;
    const dbQuery = `
            DELETE FROM
                todo
            WHERE 
                id = ${todoId};
        
        `;
    const dbObj = await db.run(dbQuery);
    response.send("Todo Deleted");
  } catch (e) {
    console.log(e.message);
  }
});

//exporting app using default export method
module.exports = app;
