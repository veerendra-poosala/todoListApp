const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, addDays, parseISO } = require("date-fns");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());

const initializeDbAndConnectToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running On http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndConnectToServer();

//test api
app.get("/", async (request, response) => {
  response.send("DB connected successfully");
});
//getting todos data using query parameters
app.get("/todos/", async (request, response) => {
  try {
    const queryParameters = request.query;
    const {
      status = "",
      priority = "",
      category = "",
      search_q = "",
    } = queryParameters;
    const dbQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date as dueDate
        FROM
            todo
        WHERE
            status like '%${status}%' AND
            priority like '%${priority}%' AND
            category like '%${category}%' AND
            todo like '%${search_q}%'
        ORDER BY 
            id ASC;
    `;
    const dbObjArray = await db.all(dbQuery);
    response.send(dbObjArray);
  } catch (e) {
    console.log(e.message);
  }
});
//getting specific todo data using todoId
app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const dbQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date as dueDate
        FROM
            todo
        WHERE
            id = ${todoId};
    `;
    const dbObj = await db.get(dbQuery);
    response.send(dbObj);
  } catch (e) {
    console.log(e.message);
  }
});
//getting todos data using query parameters

app.get("/agenda/", async (request, response) => {
  try {
    const queryParameters = request.query;
    const {
      status = "",
      priority = "",
      category = "",
      search_q = "",
      date = "",
    } = queryParameters;

    const parsedDateTime = new Date(date);

    const date1 = format(parsedDateTime, "yyyy-MM-dd");
    //console.log(date1, typeof date1);
    const dbQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date as dueDate
        FROM
            todo
        WHERE
            strftime(due_date) like '%${date1}%'
        ORDER BY 
            id ASC;
    `;
    const dbObjArray = await db.all(dbQuery);

    response.send(dbObjArray);
  } catch (e) {
    console.log(e.message);
  }
});
//creating a new todo data in the db
app.post("/todos/", async (request, response) => {
  try {
    const todoDetails = request.body;
    const { id, todo, priority, status, category, dueDate } = todoDetails;
    const dbQuery = `
        INSERT INTO
            todo(
                id,todo,priority,status,category,due_date
            )
        VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        );
    `;
    await db.run(dbQuery);
    response.send("Todo Successfully Added");
  } catch (e) {
    console.log(e.message);
  }
});

//updating todo using todoId
app.put("/todo/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;
    const todoDetails = request.body;
    const {
      status = "",
      todo = "",
      priority = "",
      category = "",
      dueDate = "",
    } = todoDetails;

    switch (true) {
      case status !== "":
        const arr = ["TO DO", "IN PROGRESS", "DONE"];
        const isValidStatus = arr.includes(status);
        if (isValidStatus) {
          const dbQuery = `
                UPDATE 
                    todo
                SET
                    status = '${status}'
                WHERE
                    id = ${todoId};
            `;
          await db.run(dbQuery);
          response.send("Status Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        break;

      case priority !== "":
        const priorityArr = ["HIGH", "MEDIUM", "LOW"];
        const isValidPriority = priorityArr.includes(priority);
        if (isValidPriority) {
          const dbQuery = `
                UPDATE 
                    todo
                SET 
                    priority = '${priority}'
                WHERE
                    id = ${todoId};
            `;
          await db.run(dbQuery);
          response.send("Priority Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        break;
      case todo !== "":
        const dbQuery = `
                UPDATE 
                    todo
                SET 
                    todo = '${todo}'
                WHERE
                    id = ${todoId};
            `;
        await db.run(dbQuery);
        response.send("Todo Updated");

        break;
      case category !== "":
        const categoryArr = ["WORK", "HOME", "LEARNING"];
        const isValidCategory = categoryArr.includes(category);
        if (isValidCategory) {
          const dbQuery = `
                UPDATE 
                    todo
                SET 
                    category = '${category}'
                WHERE
                    id = ${todoId};
            `;
          await db.run(dbQuery);
          response.send("Category Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        break;
      case dueDate !== "":
        function isValidDate(dateString) {
          const date = new Date(dateString);

          return (
            date.toString() !== "Invalid Date" &&
            date.toISOString().slice(0, 10) === dateString
          );
        }

        if (isValidDate(dueDate)) {
          const dbQuery = `
                UPDATE 
                    todo
                SET 
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};
            `;
          await db.run(dbQuery);
          response.send("Due Date Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Due Date");
        }
        break;
      default:
        break;
    }
  } catch (e) {
    console.log(e.message);
  }
});

//deleting todo using todoId
app.delete("/todo/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const dbQuery = `
            DELETE
                FROM todo
            WHERE
                id = ${todoId};
        `;
    await db.run(dbQuery);
    response.send("Todo Deleted");
  } catch (e) {
    console.log(e.message);
  }
});
//exporting app
module.exports = app;
