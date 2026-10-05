function getDatabaseConfig(){
    return {
        host: "localhost",
        port: 3306,
        database: "techstore",
        username: "techstore_root",
        password: "uchihaItachi"
    };
}

module.exports = {
    getDatabaseConfig
};