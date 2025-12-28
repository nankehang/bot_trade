const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 1. Configuration (ใช้ค่าเดียวกับใน .env ของ Next.js)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://botltcusdt:2eSRZSNdoTR7BbG6@cluster0.9su8s2g.mongodb.net/bot?retryWrites=true&w=majority";
const DB_NAME = "bot";
const COLLECTION_NAME = "posts";

async function uploadArticle() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB...");

        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // 2. Read your article file
        const articlePath = path.join(__dirname, 'article.json');
        const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));

        // Add timestamp
        articleData.publishedAt = new Date();

        // 3. Upsert (Update if slug exists, otherwise Insert)
        const result = await collection.updateOne(
            { slug: articleData.slug },
            { $set: articleData },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log(`Successfully inserted new article with ID: ${result.upsertedId._id}`);
        } else {
            console.log("Successfully updated existing article.");
        }

        console.log(`Article URL: /blog/${articleData.slug}`);

    } catch (error) {
        console.error("Error uploading article:", error);
    } finally {
        await client.close();
        console.log("Disconnected from MongoDB");
    }
}

uploadArticle();