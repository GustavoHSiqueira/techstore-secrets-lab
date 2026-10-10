require("dotenv").config();

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "PAYMENT_API_KEY",
  "INTERNAL_API_TOKEN",
];

const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missingVariables.join(", ")}`
  );
}

const dbPort = Number(process.env.DB_PORT);
const appPort = Number(process.env.PORT || 3000);

if (!Number.isInteger(dbPort) || !Number.isInteger(appPort)) {
  throw new Error("DB_PORT e PORT devem ser números inteiros.");
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: appPort,
  database: {
    host: process.env.DB_HOST,
    port: dbPort,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  paymentApiKey: process.env.PAYMENT_API_KEY,
  internalApiToken: process.env.INTERNAL_API_TOKEN,
};