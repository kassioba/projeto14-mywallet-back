import { Router } from "express";
import transacaoRouter from "./transacao.routes.js";
import usuarioRouter from "./usuario.routes.js";

const router = Router();

router.use(transacaoRouter);
router.use(usuarioRouter);

export default router;
