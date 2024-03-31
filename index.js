require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://task-management-coder-squad.web.app",
      "https://task-management-coder-squad.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wfumfky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, docoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = docoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const newTaskCollection = client.db("tmcs").collection("newTasks");
    const userCollection = client.db("userDB").collection("user");
    const purchaseCollection = client.db("purchaseDB").collection("purchased");

    // AllFood Related Api
    app.get("/newTasks", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log("pagination", req.query);
      const result = await newTaskCollection
        .find()
        .sort({ count: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.post("/addTask", async (req, res) => {
      const addTask = req.body;
      const result = await newTaskCollection.insertOne(addTask);
      res.send(result);
    });

    app.put("/api/v1/allFood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const food = {
        $set: {
          food_name: updatedFood.food_name,
          food_image: updatedFood.food_image,
          food_category: updatedFood.food_category,
          quantity: updatedFood.quantity,
          price: updatedFood.price,
          count: updatedFood.count,
          userName: updatedFood.userName,
          email: updatedFood.email,
          origin: updatedFood.origin,
          description: updatedFood.description,
        },
      };
      const result = await allFoodCollection.updateOne(filter, food, options);
      res.send(result);
      console.log(result);
    });


    app.put("/api/v1/alltask/quantity/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = req.body;
      const taskStatus = {
        $set: {
          status: updateStatus.status,
        },
      };
      const result = await newTaskCollection.updateOne(filter, taskStatus);
      res.send(result);
      console.log(result);
    });

    app.delete("/api/v1/alltask/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTaskCollection.deleteOne(query);
      res.send(result);
    });

    // Pagination related api
    app.get("/allTaskCount", async (req, res) => {
      const count = await newTaskCollection.estimatedDocumentCount();
      res.send({ count });
      const id = req.pa;
      console.log({ count });
    });
    // user related api

    app.post("/api/v1/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
      console.log(result);
    });


   

    // auth related api

    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/api/v1/loggedOut", async (req, res) => {
      const user = req.body;
      console.log("logged out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("task-management-coder-squad is running");
});

app.listen(port, () => {
  console.log(`tasks-management-coder-squad server is running ${port}`);
});
