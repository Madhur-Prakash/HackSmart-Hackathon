import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "HackSmart API",
    description: "API Documentation",
  },
  host: "localhost:8000",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["../../src/app.js"];

swaggerAutogen()(outputFile, endpointsFiles, doc);