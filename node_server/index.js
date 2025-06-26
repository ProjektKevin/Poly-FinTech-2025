import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();
const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
