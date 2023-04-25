import joi from "joi";

export const transacaoSchema = joi.object({
  idUsuario: joi.string().required(),
  valor: joi.number().positive().required(),
  descricao: joi.string().required(),
  tipo: joi.string().required(),
  dia: joi.string().required(),
});
