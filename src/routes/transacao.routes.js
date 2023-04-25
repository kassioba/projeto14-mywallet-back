import {
  buscarTransacoes,
  criarTransacao,
} from "../controllers/transacao.controller.js";
import { Router } from "express";

const transacaoRouter = Router();

transacaoRouter.post("/transacao/:tipo", criarTransacao);

transacaoRouter.get("/transacao", buscarTransacoes);

export default transacaoRouter;
