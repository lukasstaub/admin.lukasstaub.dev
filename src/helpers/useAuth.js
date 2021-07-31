const jwt = require("jsonwebtoken");
const knex = require("./knex");

module.exports = async (req, res, next) => {
    const jwtCookie = req.cookies[process.env.COOKIE_NAME];

    if (!jwtCookie) {
        return res.render("login", { query: req.query });
    } else {
        try {
            const decoded = jwt.verify(jwtCookie, process.env.JWT_SECRET);

            const [user] = await knex("users").where("id", "=", decoded.user_id);

            if (!user) {
                throw new Error("User not found");
            } else {
                req.user = user;
                const renewWhenLessThanDaysLeft = 3.5;
                if (decoded.exp * 1000 - Date.now() < 1000 * 60 * 60 * 24 * renewWhenLessThanDaysLeft) {
                    const newJwt = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
                    res.cookie(process.env.COOKIE_NAME, newJwt, {
                        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                        secure: process.env.NODE_ENV === "production",
                        httpOnly: true,
                        domain: process.env.NODE_ENV === "production" ? ".lukasstaub.dev" : "localhost",
                    });
                }
                return next();
            }
        } catch (e) {
            console.log(e);
            return res.cookie(process.env.COOKIE_NAME, null, { expires: new Date(Date.now()) }).render("login", { query: req.query });
        }
    }
};
