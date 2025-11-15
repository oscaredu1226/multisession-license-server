const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const licensesPath = path.join(__dirname, "licenses.json");

const LICENSE_PEPPER = process.env.LICENSE_PEPPER;

if (!LICENSE_PEPPER) {
    console.error("❌ LICENSE_PEPPER is not set. Define it as an environment variable.");
    process.exit(1);
}


function hashKey(plainKey) {
    return crypto
        .createHash("sha256")
        .update(plainKey + LICENSE_PEPPER)
        .digest("hex");
}

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

    const incomingHash = hashKey(key);

    const license = licenses.find((l) => l.hash === incomingHash);

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

    console.log(`[LOGIN OK] user="${user}" hash="${incomingHash}" note="${license.note}"`);

    return res.json({
        ok: true,
        message: "Access granted",
        user: user || null,
        note: license.note
    });
});

app.get("/", (req, res) => {
    res.send("MultiSession License Server with hashed keys is running");
});

app.listen(PORT, () => {
    console.log(`✅ License server running on http://localhost:${PORT}`);
});
