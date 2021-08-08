const { Router } = require("express");
const knex = require("./helpers/knex");

const cdn = Router();

cdn.get("/", async (req, res) => {
    const [contents] = await knex.raw(`SELECT id, content_type, name, user_id, CONCAT("https://cdn.lukasstaub.dev/", name) AS url, timestamp FROM files ORDER BY timestamp DESC`);

    return res.render("cdn/index", { user: req.user, contents });
});

cdn.get("/edit", async (req, res) => {
    const { id } = req.query;

    if (id) {
        const [row] = await knex("files").select("id", "name", "content_type").where("id", "=", id);

        if (!row) return res.render("404", { user: req.user });

        return res.render("cdn/edit", { user: req.user, row, query: req.query });
    } else {
        return res.redirect("/cdn");
    }
});

cdn.post("/edit/:id", async (req, res) => {
    const { id } = req.params;
    const [row] = await knex("files").select("name", "content_type").where("id", "=", id);

    const { name } = req.body;

    if (name === row.name && !req.files) {
        return res.redirect("/cdn");
    } else {
        try {
            let object = {};

            if (req.files) {
                const file = req.files.file;

                object = {
                    name,
                    content_type: file.mimetype,
                    data: file.data,
                };
            } else {
                object = { name };
            }

            await knex("files").where("id", "=", id).update(object);

            return res.redirect("/cdn");
        } catch (e) {
            return res.redirect("/cdn/edit?id=" + id + "&error=" + e.toString());
        }
    }
});

cdn.post("/upload", async (req, res) => {
    let file;
    const { code } = req.query;

    if (code) {
        file = req.files.upload;
    } else {
        file = req.files.file;
    }

    const name = file.name.replace(/\s/g, "-");

    try {
        await knex("files").insert({
            name,
            content_type: file.mimetype,
            data: file.data,
            user_id: req.user.id,
        });

        if (code) {
            return res.json({
                url: "https://cdn.lukasstaub.dev/" + name,
            });
        } else {
            return res.redirect("/cdn");
        }
    } catch (e) {
        return res.redirect("/cdn");
    }
});

cdn.get("/delete", async (req, res) => {
    const { id } = req.query;

    if (!id) return res.redirect("/cdn");

    try {
        await knex("files").where("id", "=", id).del();

        return res.redirect("/cdn");
    } catch (e) {
        return res.redirect("/cdn");
    }
});

module.exports = cdn;
