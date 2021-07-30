require("dotenv").config();

const PORT = process.env.PORT || 4300;

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const layouts = require("express-ejs-layouts");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("express-fileupload");
const path = require("path");

const useAuth = require("./src/helpers/useAuth");

const knex = require("./src/helpers/knex");
const router = require("./src/index");

const app = express();
app.set("trust proxy", true);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(upload());
app.use(cookieParser());
app.use(
    cors({
        credentials: true,
        origin: process.env.NODE_ENV === "production" ? "admin.lukasstaub.dev" : "localhost:4300",
    })
);

app.use("/assets", express.static(path.join(__dirname, "./public/assets")));
app.use("/js", express.static(path.join(__dirname, "./public/js")));
app.set("view engine", "ejs");

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [user] = await knex("users").where("username", "=", username);

        if (user) {
            const authed = await bcrypt.compare(password, user.password);

            if (authed) {
                const newJwt = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

                return res.cookie(process.env.COOKIE_NAME, newJwt, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), secure: process.env.NODE_ENV === "production", httpOnly: true }).redirect("/");
            } else {
                return res.redirect("/?auth-error=wUnOpw");
            }
        } else {
            return res.redirect("/?auth-error=wUnOpw");
        }
    } catch (e) {
        console.log(e);
        return res.redirect("/?auth-error=fatal_exception");
    }
});

app.use(useAuth);
app.use(layouts);

app.use("/", router);

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
});
