const express = require("express");
const config = require("./config");
const { connect } = require("./database");

const app = express();
const databaseConnection = connect();

app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.json({
    application: "TechStore API",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

app.get("/config-check", (req, res) => {
  res.json({
    databaseConfigured: Boolean(
      databaseConnection.host &&
        databaseConnection.database &&
        databaseConnection.username &&
        databaseConnection.password
    ),
    paymentConfigured: Boolean(config.paymentApiKey),
    internalApiConfigured: Boolean(config.internalApiToken),
  });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API TechStore executando na porta ${config.port}.`);
});