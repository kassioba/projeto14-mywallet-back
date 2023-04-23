import express from 'express'
import cors from 'cors'
import {MongoClient, ObjectId} from 'mongodb'
import dotenv from 'dotenv'
import joi from 'joi'
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err.message));

// rotas requisitos

app.post('/cadastro', async (req, res) =>{
    const { nome, email, senha }  = req.body
    
    const cadastroSchema = joi.object({
        nome: joi.string().required(),
        email: joi.string().email().required(),
        senha: joi.string().min(3).required()
    })

    const validation = cadastroSchema.validate(req.body, {abortEarly: false})
    
    if(validation.error){
        const erros = validation.error.details.map(err => err.message)
 
        return res.status(422).send(erros)
    }

    try{
        const resp = await db.collection('usuariosCadastrados').findOne({email: email})
        
        if (resp) return res.status(409).send('Email já cadastrado')
    }catch(err){
        return res.status(500).send(err.message )
    }

        const hashSenha = bcrypt.hashSync(senha, 10)
    
    try{
        await db.collection('usuariosCadastrados').insertOne({nome: nome, email: email, senha: hashSenha})
        return res.sendStatus(201)
    }catch(err){
        return res.status(500).send(err.message)
    }  
})

app.post('/login', async (req, res) =>{
    const {email, senha} = req.body
    
    const loginSchema = joi.object({
        email: joi.string().email().required(),
        senha: joi.string().required()
    })

    const validation = loginSchema.validate(req.body, {abortEarly: false})

    if(validation.error){
        const erros = validation.error.details.map(err => err.message)
 
        return res.status(422).send(erros)
    }

    try{
        const resp = await db.collection('usuariosCadastrados').findOne({email: email})
        
        if(!resp) return res.status(404).send('Email não cadastrado')

        if(!bcrypt.compareSync(senha, resp.senha)) return res.status(401).send('Senha incorreta')

        const token = uuid()

        await db.collection('sessoes').insertOne({idUsuario: resp._id, token})

        res.status(200).send(token)
    }catch(err){
        return res.status(500).send(err.message)
    }
})

app.get('/usuario', async (req, res) =>{
    const token = req.headers.authorization?.replace('Bearer ', '')

    const tokenSchema = joi.string().required()

    const validacaoToken = tokenSchema.validate(token)

    if(validacaoToken.error) return res.status(401).send(validacaoToken.error.details[0].message)

    try{
    const sessao = await db.collection('sessoes').findOne({token: token});

    if(!sessao) return res.status(404).send('Sessão não encontrada. Por favor, faça login novamente.')

    const usuario = await db.collection('usuariosCadastrados').findOne({_id: sessao.idUsuario})

    delete usuario.senha
    delete usuario.email

    res.send(usuario)
    }catch(err){
        return res.status(500).send(err.message)
    }
})

app.post('/transacao/:tipo', async (req, res) =>{
    const descricao = req.body.descricao
    const valor = req.body.valor.replaceAll(',', '')
    const token = req.headers.authorization?.replace('Bearer ', '')
    const {tipo} = req.params
    const dia = dayjs().format('DD/MM')

    console.log(valor)

    let idUsuario;

    const tokenSchema = joi.string().required()

    const validacaoToken = tokenSchema.validate(token)

    if(validacaoToken.error) return res.status(401).send(validacaoToken.error.details[0].message)

    try{
        const sessao = await db.collection('sessoes').findOne({token: token})
        
        if(!sessao) return res.status(404).send('Sessão não encontrada. Por favor, faça login novamente.')

        idUsuario = sessao.idUsuario.toString()
    }catch(err){
        return res.status(500).send(err.message)
    }

    const transacaoSchema = joi.object({
        idUsuario: joi.string().required(),
        valor: joi.number().positive().required(),
        descricao: joi.string().required(),
        tipo: joi.string().required(),
        dia: joi.string().required()
    })

    const transacao = {
        idUsuario,
        valor,
        descricao,
        tipo,
        dia
    }

    const validacaoTransacao = transacaoSchema.validate(transacao, {abortEarly:false})

    if(validacaoTransacao.error){
        const erros = validacaoTransacao.error.details.map(err => err.message)
        return res.status(422).send(erros)
    }

    try{
        await db.collection('transacoes').insertOne(transacao)

        return res.sendStatus(201)
    }catch(err){
        return res.status(500).send(err.message)
    }
})

app.get('/transacao', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')

    const tokenSchema = joi.string().required()

    const validacaoToken = tokenSchema.validate(token)

    if(validacaoToken.error) return res.status(401).send(validacaoToken.error.details[0].message)

    try{
    const sessao = await db.collection('sessoes').findOne({token: token});
    
    if(!sessao) return res.status(404).send('Sessão não encontrada. Por favor, faça login novamente.')

    res.send(await db.collection('transacoes').find({idUsuario: sessao.idUsuario.toString()}).toArray())
    }catch(err){
        return res.status(500).send(err.message)
    }
})

app.delete('/logout', async (req, res) =>{
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    const tokenSchema = joi.string().required()

    const validacaoToken = tokenSchema.validate(token)

    if(validacaoToken.error) return res.status(401).send(validacaoToken.error.details[0].message)

    try{
        await db.collection('sessoes').deleteOne({token: token})

        res.sendStatus(200)
    } catch(err){
        return res.status(500).send(err.message)
    }
})

// rotas de teste

app.get('/usuarios', async (req, res) => res.send(await db.collection('usuariosCadastrados').find().toArray()))

app.get('/sessoes', async (req, res) => res.send(await db.collection('sessoes').find().toArray()))

app.delete('/transacao', async (req, res) => res.send(await db.collection('transacoes').deleteMany({})))

  app.listen(5000)