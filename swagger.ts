import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },

  // Scan these files for comments
  apis: ["src/routes/**/*.ts", "src/app.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
