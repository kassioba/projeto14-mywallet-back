import {
  buscarUsuario,
  cadastrarUsuario,
  login,
  logout,
} from "../controllers/usuario.controllers.js";
import { Router } from "express";
import { validarUsuario } from "../middlewares/validarUsuario.middleware.js";
import { cadastroSchema } from "../schemas/cadastro.schema.js";
import { loginSchema } from "../schemas/login.schema.js";

const usuarioRouter = Router();

usuarioRouter.post(
  "/cadastro",
  validarUsuario(cadastroSchema),
  cadastrarUsuario
);

usuarioRouter.post("/login", validarUsuario(loginSchema), login);

usuarioRouter.get("/usuario", buscarUsuario);

usuarioRouter.delete("/logout", logout);

export default usuarioRouter;
