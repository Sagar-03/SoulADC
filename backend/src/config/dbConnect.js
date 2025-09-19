const mongoose = require('mongoose');


const dBConnect = async () => {
    try {
        const connect = await mongoose.connect(process.env.ConnectionString);
        console.log(
            `Database connected successfully : ${connect.connection.host}, ${connect.connection.name} `
        );
    } catch (err) {
        console.log("Database connection failed");
        console.error(err);
        process.exit(1);
    }
};

module.exports = dBConnect;