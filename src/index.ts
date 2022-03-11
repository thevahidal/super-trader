import express from 'express'
import cookieParser from "cookie-parser"

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth'
import nomadRoutes from './routes/nomad'
import tradeRoutes from './routes/trade'
import portfolioRoutes from './routes/portfolio'

const app = express()

app.use(express.json())
app.use(cookieParser())

// routes
app.use(`/api/v1/`, nomadRoutes)
app.use(`/api/v1/`, tradeRoutes)
app.use(`/api/v1/portfolios/`, portfolioRoutes)
app.use(`/api/v1/auth/`, authRoutes)

// swagger options
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Super Traders API",
      version: "0.1.0",
      description:
        "This is a simple API for Super Traders game",
      license: {
        name: "MIT",
      },
      contact: {
        name: "Super Traders",
        email: "info@email.com",
      },
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
  },

  apis: ["./src/routes/*"],
};

// swagger ui options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    basicAuth: {
      name: 'Authorization',
      schema: {
        type: 'basic',
        in: 'header'
      },
      value: 'Basic <user:password>'
    }
  }
}

const specs = swaggerJsdoc(options);
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, swaggerUiOptions)
);


const port = process.env.PORT || 8080;

const server = app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`))
