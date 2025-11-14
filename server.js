const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const licensesPath = path.join(__dirname, "licenses.json");

function loadLicenses() {
    try {
        const raw = fs.readFileSync(licensesPath, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error reading licenses.json:", err);
        return [];
    }
}

app.post("/auth/validate", (req, res) => {
    const {user, key} = req.body;

    if (!key) {
        return res.status(400).json({
            ok: false,
            message: "Key is required"
        });
    }

    const licenses = loadLicenses();
    const license = licenses.find((l) => l.key === key);

    if (!license) {
        return res.status(401).json({
            ok: false,
            message: "Invalid key"
        });
    }

    if (!license.active) {
        return res.status(403).json({
            ok: false,
            message: "Key is disabled"
        });
    }

    console.log(`[LOGIN OK] user="${user}" key="${key}" note="${license.note}"`);

    return res.json({
        ok: true,
        message: "Access granted",
        user: user || null,
        note: license.note
    });
});

app.get("/", (req, res) => {
    res.send("MultiSession License Server is running");
});

app.listen(PORT, () => {
    console.log(`✅ License server running on http://localhost:${PORT}`);
});
