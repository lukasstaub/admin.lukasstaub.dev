const { Router } = require("express");
const api = require("./api");
const blogs = require("./blogs");
const cdn = require("./cdn");
const knex = require("./helpers/knex");
const bcrypt = require("bcryptjs");

const router = Router();

router.get("/", async (req, res) => {
    const today = new Date();

    const query1 = `SELECT id, user_agent FROM access_logs WHERE ROUND(UNIX_TIMESTAMP(request_time) * 1000) > ${new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} 00:00:00`).getTime()}`;
    const query2 = `SELECT id, page_name FROM access_logs WHERE ROUND(UNIX_TIMESTAMP(request_time) * 1000) > ${new Date(`${today.getFullYear()}-${today.getMonth()}-${today.getDate()} 00:00:00`).getTime()}`;

    const [userAgentData] = await knex.raw(query1);
    const [requestData] = await knex.raw(query2);

    return res.render("home", {
        user: req.user,
        userAgentData,
        requestData,
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
    return res.cookie(process.env.COOKIE_NAME, "", { expires: new Date() }).redirect("/");
});

router.use("/cdn", cdn);
router.use("/blogs", blogs);
router.use("/api", api);

module.exports = router;
