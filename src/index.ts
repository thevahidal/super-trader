import express from 'express'
import cookieParser from "cookie-parser"

import authService from './services/auth'
import nomadService from './services/nomad'
import tradeService from './services/trade'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(`/api/v1/`, nomadService)
app.use(`/api/v1/`, tradeService)
app.use(`/api/v1/auth/`, authService)


const port = process.env.PORT || 8080;

const server = app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`))
