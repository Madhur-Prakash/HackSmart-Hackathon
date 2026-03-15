import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NavSwap API",
      version: "1.0.0",
      description:
        "NavSwap — Real-Time AI-Powered EV Charging Station Recommendation System. All protected routes use **cookie-based authentication** (`access_token` cookie set upon login/register).",
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://plays-sue-isolated-clinton.trycloudflare.com",
        description: "Production server",
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "JWT access token stored in an HttpOnly cookie. Set automatically on login/register.",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 200 },
            data: { type: "object" },
            message: { type: "string", example: "Success" },
            success: { type: "boolean", example: true },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 400 },
            message: { type: "string", example: "Bad request" },
            success: { type: "boolean", example: false },
          },
        },
        RegisterCompanyBody: {
          type: "object",
          required: ["full_name", "email", "phone_number", "country_code", "role", "password"],
          properties: {
            full_name: { type: "string", example: "Acme Corp" },
            email: { type: "string", format: "email", example: "admin@acme.com" },
            phone_number: { type: "string", example: "9876543210" },
            country_code: { type: "string", example: "+91" },
            role: { type: "string", enum: ["super_admin"], example: "super_admin" },
            password: { type: "string", format: "password", example: "Secret@123" },
          },
        },
        RegisterCustomerBody: {
          type: "object",
          required: ["full_name", "email", "phone_number", "country_code", "password", "driving_license_number"],
          properties: {
            full_name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            phone_number: { type: "string", example: "9876543210" },
            country_code: { type: "string", example: "+91" },
            password: { type: "string", format: "password", example: "Secret@123", minLength: 6 },
            driving_license_number: { type: "string", example: "DL1234567890123", minLength: 15, maxLength: 15 },
            role: { type: "string", enum: ["customer"], example: "customer" },
          },
        },
        RegisterTransporterBody: {
          type: "object",
          required: ["full_name", "email", "phone_number", "country_code", "password", "driving_license_number"],
          properties: {
            full_name: { type: "string", example: "Jane Smith" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            phone_number: { type: "string", example: "9876543211" },
            country_code: { type: "string", example: "+91" },
            password: { type: "string", format: "password", example: "Secret@123", minLength: 6 },
            driving_license_number: { type: "string", example: "DL9876543210987", minLength: 15, maxLength: 15 },
            role: { type: "string", enum: ["transporter"], example: "transporter" },
          },
        },
        RegisterStaffBody: {
          type: "object",
          required: ["full_name", "email", "phone_number", "addhar_card_number", "country_code", "role"],
          properties: {
            full_name: { type: "string", example: "Staff Member" },
            email: { type: "string", format: "email", example: "staff@navswap.com" },
            phone_number: { type: "string", example: "9876543212" },
            addhar_card_number: { type: "string", example: "123456789012" },
            country_code: { type: "string", example: "+91" },
            role: { type: "string", enum: ["staff"], example: "staff" },
          },
        },
        RegisterRegionalAdminBody: {
          type: "object",
          required: ["full_name", "email", "phone_number", "addhar_card_number", "country_code", "role"],
          properties: {
            full_name: { type: "string", example: "Regional Admin" },
            email: { type: "string", format: "email", example: "radmin@navswap.com" },
            phone_number: { type: "string", example: "9876543213" },
            addhar_card_number: { type: "string", example: "987654321098" },
            country_code: { type: "string", example: "+91" },
            role: { type: "string", enum: ["regional_admin"], example: "regional_admin" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["password"],
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            user_name: { type: "string", example: "john_doe" },
            password: { type: "string", format: "password", example: "Secret@123" },
          },
        },
        ChangePasswordBody: {
          type: "object",
          required: ["confirm_password", "new_password"],
          properties: {
            new_password: { type: "string", format: "password", example: "NewSecret@123" },
            confirm_password: { type: "string", format: "password", example: "NewSecret@123" },
          },
        },
        UpdateAccountDetailsBody: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "updated@example.com" },
            bio: { type: "string", example: "Software enthusiast" },
            phone_number: { type: "string", example: "9876543210" },
            country_code: { type: "string", example: "+91" },
            gender: { type: "string", enum: ["male", "female", "other"], example: "male" },
            dateOfBirth: { type: "string", format: "date", example: "1995-06-15" },
          },
        },
        UpdateCustomerProfileBody: {
          type: "object",
          properties: {
            vehicles: { type: "array", items: { type: "object" }, example: [] },
            addresses: { type: "array", items: { type: "object" }, example: [] },
            defaultAddress: { type: "string", example: "60d21b4667d0d8992e610c85" },
            preferences: { type: "object", example: { enableNotifications: true, maxDistanceKm: 10 } },
            subscriptionPlan: { type: "string", enum: ["free", "basic", "premium", "enterprise"], example: "basic" },
            paymentMethods: { type: "array", items: { type: "object" }, example: [] },
            defaultPaymentMethod: { type: "string", example: "60d21b4667d0d8992e610c86" },
          },
        },
        UpdateTransporterProfileBody: {
          type: "object",
          properties: {
            tier: { type: "string", enum: ["bronze", "silver", "gold", "platinum"], example: "silver" },
            verification: { type: "object", example: { idVerification: "approved" } },
            transportVehicle: { type: "object", example: { type: "truck", plateNumber: "MH01AB1234" } },
            bankDetails: { type: "object", example: { bankName: "HDFC", accountNumber: "123456789" } },
            preferences: { type: "object", example: { autoAcceptTasks: true } },
            isAvailable: { type: "boolean", example: true },
            isOnline: { type: "boolean", example: true },
            certifications: { type: "array", items: { type: "object" }, example: [] },
            emergencyContact: { type: "object", example: { name: "Jane Doe", phone: "9876543210" } },
          },
        },
      },
    },
    tags: [
      { name: "Auth — Company", description: "Company authentication endpoints" },
      { name: "Auth — Customer", description: "Customer authentication endpoints" },
      { name: "Auth — Transporter", description: "Transporter authentication endpoints" },
      { name: "Auth — Staff", description: "Staff authentication endpoints" },
      { name: "Auth — Regional Admin", description: "Regional Admin authentication endpoints" },
      { name: "Health", description: "Health check endpoints" },
      { name: "User — Company", description: "Company profile management (requires cookie auth)" },
      { name: "User — Customer", description: "Customer profile management (requires cookie auth)" },
      { name: "User — Transporter", description: "Transporter profile management (requires cookie auth)" },
      { name: "User — Staff", description: "Staff profile management (requires cookie auth)" },
      { name: "User — Regional Admin", description: "Regional Admin profile management (requires cookie auth)" },
    ],
  },
  apis: [
    "./src/services/auth/routes/*.js",
    "./src/services/user/routes/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;