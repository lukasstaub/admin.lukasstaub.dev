const { Router } = require("express");
const knex = require("./helpers/knex");

const blogs = Router();

blogs.get("/", async (req, res) => {
    const [contents] = await knex.raw(`
        SELECT id, title, slug, (SELECT username FROM users WHERE id = user_id) AS username, published_at, (SELECT name FROM categories WHERE id = category_id) AS category
        FROM blogs
        ORDER BY title ASC
    `);

    return res.render("blogs/index", { user: req.user, contents });
});

//create blogpost
blogs.get("/new", async (req, res) => {
    const cats = await knex("categories").orderBy("name", "asc");

    return res.render("blogs/editor", { user: req.user, categories: cats, blog: {} });
});
blogs.post("/new", async (req, res) => {
    const { title, category, body } = req.body;

    const [id] = await knex("blogs").insert({
        title: title,
        slug: title.toLowerCase().replace(/\s/g, "-"),
        user_id: req.user.id,
        category_id: category,
        body,
    });

    return res.redirect("/blogs/edit?id=" + id);
});

//edit blogpost
blogs.get("/edit", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/blogs");

    const cats = await knex("categories").orderBy("name", "asc");
    const [blog] = await knex("blogs").where("id", "=", id);

    if (!blog) return res.render("404", { user: req.user });

    return res.render("blogs/editor", { user: req.user, blog, categories: cats });
});
blogs.post("/edit/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.redirect("/blogs");

    const { title, category, body } = req.body;

    await knex("blogs")
        .where("id", "=", id)
        .update({
            title: title,
            slug: title.toLowerCase().replace(/\s/g, "-"),
            user_id: req.user.id,
            category_id: category,
            body,
        });

    return res.redirect("/blogs/edit?id=" + id);
});

//publish blogpost
blogs.get("/publish/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.redirect("/blogs");

    await knex("blogs").where("id", "=", id).update({
        published_at: new Date(),
    });

    return res.redirect("/blogs");
});

//delete blogpost
blogs.get("/delete", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/blogs");

    try {
        await knex("blogs").where("id", "=", id).del();

        return res.redirect("/blogs");
    } catch (e) {
        return res.redirect("/blogs");
    }
});

//Categories section
blogs.get("/categories", async (req, res) => {
    const cats = await knex("categories").orderBy("name", "asc");

    return res.render("blogs/categories/index", { user: req.user, cats });
});

//create new
blogs.get("/categories/new", (req, res) => {
    return res.render("blogs/categories/editor", { user: req.user, category: {} });
});
blogs.post("/categories/new", async (req, res) => {
    const { name } = req.body;

    if (!name) return res.redirect("/blogs/categories");

    await knex("categories").insert({
        name,
    });

    return res.redirect("/blogs/categories");
});

//edit
blogs.get("/categories/edit", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/blogs/categories");

    const [data] = await knex("categories").where("id", "=", id);

    return res.render("blogs/categories/editor", { user: req.user, category: data });
});
blogs.post("/categories/edit", async (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) return res.redirect("/blogs/categories");

    await knex("categories").where("id", "=", id).update({
        name,
    });

    return res.redirect("/blogs/categories");
});

//delete
blogs.get("/categories/delete", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/blogs/categories");

    await knex("categories").where("id", "=", id).del();

    return res.redirect("/blogs/categories");
});

module.exports = blogs;
