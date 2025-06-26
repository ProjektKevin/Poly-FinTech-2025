import express from "express";
import cors from "cors"; 
import mainRoutes from "./routes/mainRoute.js";

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',  
        'http://localhost:3000',  
        'http://127.0.0.1:5173',  
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'Origin',
        'X-Requested-With'
    ],
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api", mainRoutes);

app.use("/", express.static('public'));

export default app;