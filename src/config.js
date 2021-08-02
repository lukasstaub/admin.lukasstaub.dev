const { Router } = require("express");
const knex = require("./helpers/knex");

const config = Router();

config.get("/", async (req, res) => {
    const data = await knex("website_config");

    return res.render("config/index", { user: req.user, contents: data });
});

config.get("/edit", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/config");

    const [config] = await knex("website_config").where("id", "=", id);

    if (!config) return res.status(404).render("404", { user: req.user });

    return res.render("config/editor", { user: req.user, config });
});
config.post("/edit/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.redirect("/config");

    const { name, value } = req.body;

    await knex("website_config").where("id", "=", id).update({
        name,
        value,
    });

    return res.redirect("/config");
});

config.get("/new", (req, res) => {
    return res.render("config/editor", { user: req.user, config: {} });
});
config.post("/new", async (req, res) => {
    const { name, value } = req.body;

    if (!name || !value) return res.redirect("/config");

    await knex("website_config").insert({
        name,
        value,
    });

    return res.redirect("/config");
});

config.get("/delete", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/config");

    await knex("website_config").where("id", "=", id).del();

    return res.redirect("/config");
});

module.exports = config;
