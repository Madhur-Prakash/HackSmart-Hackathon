import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NavSwap API",
      version: "1.0.0",
      description: "API documentation for HackSmart backend"
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
      },
    ],
  },

  apis: ["./src/services/**/*.js"], // where swagger comments exist
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;