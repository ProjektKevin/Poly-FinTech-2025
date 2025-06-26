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

// Serve static files
app.use('/weights', express.static(path.join(__dirname, './weights')))
app.use('/dist', express.static(path.join(__dirname, './dist')))
app.use('/public', express.static(path.join(__dirname, './public')))
app.use('/views', express.static(path.join(__dirname, './views')))

// Serve CSS file from root directory
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')))

// Serve the main index page (HTML version)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Serve the webcam face detection game
app.get('/webcam_face_detection', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/webcamFaceDetection.html'))
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Visit: http://localhost:${PORT}`)
  console.log(`🎮 Game: http://localhost:${PORT}/webcam_face_detection`)
  console.log(`📁 Static files served from: ${path.join(__dirname, './weights')}`)
})