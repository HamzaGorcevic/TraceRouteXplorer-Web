const ping = require("ping");
const cors = require("cors");
const axios = require("axios");
const express = require("express");
const tracerouter = require("./tracerouter");

const app = express();
const port = process.env.PORT || 8080;
const ipAddress = "0.0.0.0";

app.use(express.static(__dirname));
app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3000/traceroute",

    "https://hamzagorcevic.github.io",
    "https://hamzagorcevic.github.io/traceroute",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: "GET,POST,PUT,DELETE,HEAD,PATCH",
        allowedHeaders: "",
        credentials: false,
        maxAge: 8000,
    })
);

app.post("/traceroute", async (req, res) => {
    const { destination } = req.body;
    console.log("destination:", destination);
    try {
        tracerouter.getListOfHops(destination).then((hops) => res.json(hops));
    } catch (error) {
        console.error("Error during traceroute:", error);
        res.status(500).json({ error: "Error during traceroute" });
    }
});

app.get("/test", async (req, res) => {
    try {
        const response = await fetch("https://meme-api.com/gimme");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching meme:", error);
        res.status(500).json({ error: "Error fetching meme" });
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to CORS server 😁");
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
