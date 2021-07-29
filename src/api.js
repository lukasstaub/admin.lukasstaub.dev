const { Router } = require("express");
const knex = require("./helpers/knex");

const api = Router();

api.get("/media", async (req, res) => {
    const [media] = await knex.raw(`
        SELECT id, name, CONCAT("https://cdn.lukasstaub.dev/", name) AS url FROM files ORDER BY name ASC
    `);

    return res.json(media);
});

// api.get("/categories", async (req, res) => {
//     const categories = await knex("categories").orderBy("name", "asc");

//     return res.json(categories);
// });

module.exports = api;
