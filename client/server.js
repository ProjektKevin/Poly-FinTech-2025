import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files (weights, dist, public)
app.use('/weights', express.static(path.join(__dirname, './weights')))
app.use('/dist', express.static(path.join(__dirname, './dist')))
app.use('/public', express.static(path.join(__dirname, './public')))

// Serve the old HTML file for backwards compatibility (if needed)
app.use('/views', express.static(path.join(__dirname, './views')))

// API endpoint for the old HTML file
app.get('/webcam_face_detection', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/webcamFaceDetection.html'))
})

// For React development, let Vite handle routing
// In production, you'd serve the built React app here
app.get('/', (req, res) => {
  res.send(`
    <h1>Head Lean Filter</h1>
    <p>For development, use: <a href="http://localhost:5173">http://localhost:5173</a> (Vite dev server)</p>
    <p>Legacy HTML version: <a href="/webcam_face_detection">Test HTML Version</a></p>
  `)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Static files (weights) served from: ${path.join(__dirname, './weights')}`)
  console.log(`For React development, run: npm run dev`)
})