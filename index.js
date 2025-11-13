const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldizubn.mongodb.net/?appName=Cluster0`;
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
   
    const db = client.db("book_db");
    const booksCollection = db.collection("books");
    const usersCollection = db.collection("users");
    const commentsCollection=db.collection("comments");
   const reviewsCollection=db.collection("reviews")

    //users API
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({
          message: "user already exists. do not need to insert again ",
        });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });
    //books Api
    app.get("/books", async (req, res) => {
      const cursor = booksCollection.find().sort({ rating: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

 app.delete('/books/:id',async(req,res)=>{
   const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await booksCollection.deleteOne(query);
  res.send(result)
 })

//
app.post("/books", async (req, res) => {
  const { title, author, genre, rating, summary, coverImage, userEmail, userName, dateAdded } = req.body;

  let finalDate = dateAdded;
  if (!finalDate || new Date(finalDate).toString() === "Invalid Date") {
    finalDate = new Date().toISOString();
  } else {
    finalDate = new Date(finalDate).toISOString();
  }

  const newBook = {
    title,
    author,
    genre,
    rating,
    summary,
    coverImage,
    userEmail: userEmail || "Unknown",
    userName: userName || "Unknown",
    dateAdded: finalDate,
  };

  const result = await booksCollection.insertOne(newBook);
  res.send(result);
});

    //  Update Book by ID
app.patch("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedBook = req.body;
    const query = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: {
        title: updatedBook.title,
        author: updatedBook.author,
        genre: updatedBook.genre,
        rating: updatedBook.rating,
        summary: updatedBook.summary,
        coverImage: updatedBook.coverImage,
        dateAdded: updatedBook.dateAdded || new Date().toISOString(),
      },
    };

    const result = await booksCollection.updateOne(query, updateDoc);
    if (result.modifiedCount > 0) {
      res.send({ success: true, message: "Book updated successfully!" });
    } else {
      res.status(404).send({ success: false, message: "Book not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Error updating book" });
  }
});


    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    //all-books related API

    app.get("/all-books", async (req, res) => {
      const cursor = booksCollection.find().sort({ rating: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-books/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await booksCollection.findOne(query);
  res.send(result);
});

//comments API
// Add a comment
app.post("/comments", async (req, res) => {
  try {
    const comment = req.body; // { bookId, userName, userPhoto, comment, createdAt }
    if (!comment.bookId || !comment.comment) {
      return res.status(400).json({ error: "Missing bookId or comment" });
    }

    const result = await commentsCollection.insertOne(comment);
    res.status(201).json({ message: "Comment added!", commentId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get comments for a book
app.get("/comments", async (req, res) => {
  try {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: "Missing bookId" });

    const comments = await commentsCollection
      .find({ bookId })
      .sort({ createdAt: 1 }) // oldest first
      .toArray();

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

//review related API
// POST a review
app.post("/reviews", async (req, res) => {
  const review = req.body;
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});

// GET reviews by bookId
app.get("/reviews", async (req, res) => {
  const { bookId } = req.query;
  const reviews = await reviewsCollection.find({ bookId }).toArray();
  res.send(reviews);
});

// Get Top 3 Books by Highest Ratings
app.get("/top-books", async (req, res) => {
  try {
    const topBooks = await booksCollection
      .aggregate([
        { $addFields: { ratingValue: { $toDouble: "$rating" } } }, // ensure rating is numeric
        { $sort: { ratingValue: -1 } }, // sort descending by rating
        { $limit: 3 }, // top 3
      ])
      .toArray();
    res.send(topBooks);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch top books" });
  }
});

    // Send a ping to confirm a successful connection
   // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Book Heaven");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
