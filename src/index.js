const { Router } = require("express");
const api = require("./api");
const blogs = require("./blogs");
const cdn = require("./cdn");
const knex = require("./helpers/knex");
const bcrypt = require("bcryptjs");
const useragent = require("useragent");
const projects = require("./projects");
const config = require("./config");

const router = Router();

router.get("/", async (req, res) => {
    const today = new Date();

    const query1 = `SELECT id, user_agent FROM access_logs WHERE ROUND(UNIX_TIMESTAMP(request_time) * 1000) > ${Date.now() - 60 * 60 * 24 * 1000} ORDER BY user_agent ASC`;
    const query2 = `SELECT id, page_name FROM access_logs WHERE ROUND(UNIX_TIMESTAMP(request_time) * 1000) > ${new Date(`${today.getFullYear()}-${today.getMonth()}-${today.getDate()} 00:00:00`).getTime()} ORDER BY page_name ASC`;
    const query4 = `SELECT id, timestamp FROM sent_emails WHERE ROUND(UNIX_TIMESTAMP(timestamp) * 1000) > ${Date.now() - 60 * 60 * 24 * 30 * 1000}`;

    const [userAgentData] = await knex.raw(query1);
    const [requestData] = await knex.raw(query2);
    const [sentEmails] = await knex.raw(query4);

    return res.render("home", {
        user: req.user,
        userAgentData: userAgentData.map((el) => ({ ...el, user_agent: useragent.parse(el.user_agent) })),
        requestData,
        sentEmails,
    });
});

router.get("/user-settings", (req, res) => {
    return res.render("userSettings", { user: req.user, query: req.query });
});

router.post("/user-settings", async (req, res) => {
    if (!req.body) return res.redirect("/user-settings");

    await knex("users").where("id", "=", req.user.id).update(req.body);

    return res.redirect("/user-settings");
});

router.post("/change-password", async (req, res) => {
    const { password, newPassword, rpNewPw } = req.body;

    const authed = await bcrypt.compare(password, req.user.password);

    if (!authed) return res.redirect("/user-settings?error=Wrong%20Password!");

    if (newPassword !== rpNewPw) return res.redirect("/user-settings?error=Passwords%20do%20not%20match!");

    const salt = await bcrypt.genSalt(10);
    const newPw = await bcrypt.hash(newPassword, salt);

    await knex("users").where("id", "=", req.user.id).update({
        password: newPw,
    });

    return res.redirect("/user-settings?success=true");
});

router.get("/logout", (_, res) => {
    return res
        .cookie(process.env.COOKIE_NAME, "", {
            expires: new Date(),
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            domain: process.env.NODE_ENV === "production" ? ".lukasstaub.dev" : "localhost",
        })
        .redirect("/");
});

router.use("/api", api);
router.use("/cdn", cdn);
router.use("/blogs", blogs);
router.use("/projects", projects);
router.use("/config", config);

router.get("/*", (req, res) => {
    return res.render("404", { user: req.user });
});

module.exports = router;
