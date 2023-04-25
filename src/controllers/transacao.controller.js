import dayjs from "dayjs";
import { db } from "../database/database.connection.js";
import { tokenSchema } from "../schemas/token.schema.js";
import { transacaoSchema } from "../schemas/transacao.schema.js";

export const criarTransacao = async (req, res) => {
  const descricao = req.body.descricao;
  const valor = req.body.valor;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { tipo } = req.params;
  const dia = dayjs().format("DD/MM");

  let idUsuario;

  const validacaoToken = tokenSchema.validate(token);

  if (validacaoToken.error)
    return res.status(401).send(validacaoToken.error.details[0].message);

  try {
    const sessao = await db.collection("sessoes").findOne({ token: token });

    if (!sessao)
      return res
        .status(404)
        .send("Sessão não encontrada. Por favor, faça login novamente.");

    idUsuario = sessao.idUsuario.toString();
  } catch (err) {
    return res.status(500).send(err.message);
  }

  const transacao = {
    idUsuario,
    valor,
    descricao,
    tipo,
    dia,
  };

  const validacaoTransacao = transacaoSchema.validate(transacao, {
    abortEarly: false,
  });

  if (validacaoTransacao.error) {
    const erros = validacaoTransacao.error.details.map((err) => err.message);
    return res.status(422).send(erros);
  }

  try {
    await db.collection("transacoes").insertOne(transacao);

    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const buscarTransacoes = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  const validacaoToken = tokenSchema.validate(token);

  if (validacaoToken.error)
    return res.status(401).send(validacaoToken.error.details[0].message);

  try {
    const sessao = await db.collection("sessoes").findOne({ token: token });

    if (!sessao)
      return res
        .status(404)
        .send("Sessão não encontrada. Por favor, faça login novamente.");

    res.send(
      await db
        .collection("transacoes")
        .find({ idUsuario: sessao.idUsuario.toString() })
        .toArray()
    );
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
