const { database } = require("./config");

function connect() {
  console.log("Inicializando conexão segura com o banco de dados.");

  return {
    host: database.host,
    port: database.port,
    database: database.database,
    username: database.username,
    password: database.password,
  };
}

module.exports = {
  connect,
};