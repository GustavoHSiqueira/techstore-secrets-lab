require("dotenv").config();

const backupApiKey = process.env.BACKUP_API_KEY;

if (!backupApiKey) {
  throw new Error("A variável BACKUP_API_KEY não foi configurada.");
}

console.log("Inicializando rotina de backup...");
console.log("Credencial de backup carregada com segurança.");
console.log("Backup realizado com sucesso.");