const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.send("hello");
});

app.post("/addSchool", async function (req, res) {
    try {
        const { name, address, latitude, longitude } = req.body;

        if (!name || !address || latitude == null || longitude == null) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newSchool = await prisma.school.create({
            data: {
                name,
                address,
                latitude,
                longitude
            }
        });

        res.status(201).json({ message: "School added successfully", school: newSchool });
    } catch (error) {
        console.error("Error adding school:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/allschools", async function (req, res) {
    const school = await prisma.school.findFirst();
    res.json({ school: school });
});

app.get("/listSchools", async function (req, res) {
    try {
        const { latitude, longitude } = req.query;
        console.log("hi");
        console.log(latitude, longitude);

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const userLatitude = parseFloat(latitude);
        const userLongitude = parseFloat(longitude);

        const schools = await prisma.school.findMany();

        function getDistance(lat1, lon1, lat2, lon2) {
            function toRadian(value) {
                return (value * Math.PI) / 180;
            }
            const R = 6371;
            const dLat = toRadian(lat2 - lat1);
            const dLon = toRadian(lon2 - lon1);
            console.log(dLat);
            console.log(dLon);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        const sortedSchools = schools
            .map(function (school) {
                return {
                    ...school,
                    distance: getDistance(userLatitude, userLongitude, school.latitude, school.longitude)
                };
            })
            .sort(function (a, b) {
                return a.distance - b.distance;
            });
    console.log(sortedSchools);
        res.json({ schools: sortedSchools });
    } catch (error) {
        console.error("Error fetching schools:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});
