export function validarUsuario(schema) {
  return (req, res, next) => {
    const validation = schema.validate(req.body, { abortEarly: false });

    if (validation.error) {
      const erros = validation.error.details.map((err) => err.message);

      return res.status(422).send(erros);
    }

    next();
  };
}
