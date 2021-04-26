import { Router } from "express";

import User from "./app/models/User";

const routes = new Router();

routes.get("/", async (req, res) => {
  const user = await User.create({
    name: "açp",
    email: "alo@teste.com",
    password_hash: "13516511dsff56",
  });
  return res.json(user);
});

export default routes;
