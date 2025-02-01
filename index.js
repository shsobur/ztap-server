const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware__
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g4yea9q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection








    const productsCollection = client.db("ztap").collection("products");
    const reviewsCollection = client.db("ztap").collection("reviews");
    const userCollection = client.db("ztap").collection("users");

    // Post users__
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Get user__
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // Get all products__
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // Get product for shoping__
    app.get("/allProducts", async (req, res) => {
      const { name, category, status, size, sort, limit = 9, page = 1 } = req.query;
      const query = {};

      if (name) {
        query.name = { $regex: name, $options: "i" };
      }

      if (category) {
        query.category = category;
      }

      if (status) {
        query.productStatus = status;
      }

      if (size) {
        query.sizes = size;
      }

      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);

      const sortOption = sort === "asc" ? 1 : -1;
      const result = await productsCollection
      .find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ newPrice: sortOption })
      .toArray();

      const totalProduct = await productsCollection.countDocuments(query);
      res.json({result, totalProduct});
    });

    // Get specific product__
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await productsCollection.findOne(query);
      res.send(result);
    })

    // Get category from products__
    app.get("/categorys", async (req, res) => {
      const result = await productsCollection
        .aggregate([
          { $group: { _id: "$category" } },
          { $project: { _id: 0, category: "$_id" } },
        ])
        .toArray();
        res.send(result);
    });

    // Get size form products__
    app.get("/sizes", async (req, res) => {
      const result = await productsCollection
      .aggregate([
        {$unwind: "$sizes"},
        {$group: {_id: "$sizes"}},
        {$project: {_id: 0, sizes: "$_id"}}
      ])
      .toArray()
      res.send(result);
    })


    // Get all reviews__
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // Get new arrivals__
    app.get("/newItem", async (req, res) => {
      const query = { productStatus: "new" };
      const options = {
        projection: {
          name: 1,
          oldPrice: 1,
          newPrice: 1,
          savings: 1,
          category: 1,
          images: 1,
        },
      };
      const result = await productsCollection.find(query, options).toArray();
      res.send(result);
    });

    // Get top sells__
    app.get("/topSell", async (req, res) => {
      const query = { productStatus: "topSell" };
      const options = {
        projection: {
          name: 1,
          oldPrice: 1,
          newPrice: 1,
          savings: 1,
          category: 1,
          images: 1,
        },
      };
      const result = await productsCollection.find(query, options).toArray();
      res.send(result);
    });

    // Get limited reviews__
    app.get("/fewReviews", async (req, res) => {
      const query = req.query.limit || 6;
      const limit = parseInt(query);
      const result = await reviewsCollection.find().limit(limit).toArray();
      res.send(result);
    });














    await client.db("admin").command({ ping: 1 });
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
  const result = "ZTAP server is running";
  res.send(result);
});

app.listen(port, () => {
  console.log(`The ZTAP server is running on ${port} port`);
});
