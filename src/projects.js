const { Router } = require("express");
const knex = require("./helpers/knex");

const projects = Router();

projects.get("/", async (req, res) => {
    const projects = await knex("projects").select("id", "name", "slug", "timestamp", "image_url").orderBy("slug", "asc");

    return res.render("projects/index", { user: req.user, contents: projects });
});

projects.get("/new", async (req, res) => {
    return res.render("projects/editor", { user: req.user, project: {} });
});
projects.post("/new", async (req, res) => {
    const { name, content, imgUrl } = req.body;

    if (!name || !content || !imgUrl) return res.redirect("/projects/new");

    const [id] = await knex("projects").insert({
        name,
        image_url: imgUrl,
        slug: name.toLowerCase().replace(/\s/g, "-"),
        content,
    });

    return res.redirect("/projects/edit?id=" + id);
});

projects.get("/edit", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/projects");

    const [project] = await knex("projects").where("id", "=", id);

    if (!project) return res.render("404", { user: req.user });

    return res.render("projects/editor", { user: req.user, project });
});
projects.post("/edit/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.redirect("/projects");

    const { name, content, imgUrl } = req.body;

    if (!name || !content || !imgUrl) return res.redirect("/projects/edit?id=" + id);

    await knex("projects")
        .where("id", "=", id)
        .update({
            name,
            slug: name.toLowerCase().replace(/\s/g, "-"),
            content,
            image_url: imgUrl,
        });

    return res.redirect("/projects/edit?id=" + id);
});

projects.get("/delete", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/projects");

    await knex("projects").where("id", "=", id).del();

    return res.redirect("/projects");
});

module.exports = projects;
