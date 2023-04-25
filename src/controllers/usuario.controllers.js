import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { db } from "../database/database.connection.js";
import { tokenSchema } from "../schemas/token.schema.js";

export const cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const resp = await db
      .collection("usuariosCadastrados")
      .findOne({ email: email });

    if (resp) return res.status(409).send("Email já cadastrado");
  } catch (err) {
    return res.status(500).send(err.message);
  }

  const hashSenha = bcrypt.hashSync(senha, 10);

  try {
    await db
      .collection("usuariosCadastrados")
      .insertOne({ nome: nome, email: email, senha: hashSenha });
    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const resp = await db
      .collection("usuariosCadastrados")
      .findOne({ email: email });

    if (!resp) return res.status(404).send("Email não cadastrado");

    if (!bcrypt.compareSync(senha, resp.senha))
      return res.status(401).send("Senha incorreta");

    const token = uuid();

    await db.collection("sessoes").insertOne({ idUsuario: resp._id, token });

    res.status(200).send(token);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const logout = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  const validacaoToken = tokenSchema.validate(token);

  if (validacaoToken.error)
    return res.status(401).send(validacaoToken.error.details[0].message);

  try {
    await db.collection("sessoes").deleteOne({ token: token });

    res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const buscarUsuario = async (req, res) => {
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

    const usuario = await db
      .collection("usuariosCadastrados")
      .findOne({ _id: sessao.idUsuario });

    delete usuario.senha;
    delete usuario.email;

    res.send(usuario);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
