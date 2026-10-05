app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        database: database.host
    });
});


app.get("/config-check", (req, res) => {
    res.json({
        database: database.database,
        adminConfigured: Boolean(senhaUsuarioTeste123),
        paymentConfigured: Boolean(chaveAPI111222333444555777888999000),
        internalApiConfigured: Boolean(tokenInterno1234567890),
    });
});


app.listen(PORT, () => {
    console.log(`API Techstore is running on port ${PORT}`);
});
