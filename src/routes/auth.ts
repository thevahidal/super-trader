/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Authentication APIs
 */

import express from 'express';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Prisma, PrismaClient } from '@prisma/client'
import Joi from 'joi';

import { checkAuthentication } from '../middleware/auth'
import { JWT_EXPIRY_SECONDS, JWT_SECRET_KEY } from '../constants/auth';
import { schemaValidator } from '../utils';

const prisma = new PrismaClient()
const router = express.Router();


const registerInputSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(30),
    
    lastName: Joi.string()
        .min(2)
        .max(30),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),
})

/**
 * @openapi
 * /api/v1/auth/register/:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     description: Register API
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           email:
 *            type: string
 *           firstName:
 *            type: string
 *           lastName:
 *            type: string
 *           password:
 *            type: string
 *     responses:
 *       200:
 *         description: Returns success message and created default portfolio and sets token cookie
 *       400:
 *         description: Invalid input
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *            payload:
 *             type: object
 *           example:
 *            error: invalid_input
 *            payload: {
 *             "password": "This field is required"
 *            }
 *       422:
 *         description: User already exists
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: user_already_exists
 * 
 */
router.post('/register/', async (req, res) => {
    const { value: data, error, isInvalid } = schemaValidator(req.body, registerInputSchema)
    
    if (isInvalid) {
        return res.status(400).json({
            error: "invalid_input",
            payload: error,
        })
    }

    const { password } = data

    let user = await prisma.user.findFirst({
        where: {
            email: data.email,
        },
    })

    if (user) {
        return res.status(400).json({
            error: "user_already_exists"
        })
    }

    user = await prisma.user.create({
        data: {
            ...data,
            password: await bcrypt.hash(password, 10),
        },
    })

    const portfolio = await prisma.portfolio.create({
        data: {
            user: {
                connect: {
                    id: user.id,
                },
            },
            default: true,
        }
    })

    const token = jwt.sign({ id: user.id, ...data }, (<any>JWT_SECRET_KEY), {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRY_SECONDS,
    })

    res.cookie("token", token, { maxAge: JWT_EXPIRY_SECONDS * 1000 })
    res.json({
        error: null,
        message: "User created successfully",
        payload: {
            defaultPortfolio: portfolio.id,
        }
    })
});


const obtainTokenInputSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),
})

/**
 * @openapi
 * /api/v1/auth/token/obtain/:
 *   post:
 *     summary: Obtain new token
 *     tags: [Auth]
 *     description: Login API
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           email:
 *            type: string
 *           password:
 *            type: string
 *     responses:
 *       200:
 *         description: Sets token cookie
 *       400:
 *         description: Invalid input
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *            payload:
 *             type: object
 *           example:
 *            error: invalid_input
 *            payload: {
 *             "password": "This field is required"
 *            }
 *       401:
 *         description: Invalid credentials
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: invalid_credentials
 */
router.post('/token/obtain/', async (req, res) => {
    const { value: data, error, isInvalid } = schemaValidator(req.body, obtainTokenInputSchema)
    
    if (isInvalid) {
        return res.status(400).json({
            error: "invalid_input",
            payload: error,
        })
    }

    const { email } = data
    const user = await prisma.user.findFirst({
        where: {
            email: email.toLowerCase(),
        },
    })

    if (!user) {
        return res.status(401).json({
            error: "invalid_credentials"
        })
    }

    const { id, firstName, lastName } = user
    const token = jwt.sign({
        id,
        firstName,
        lastName,
        email,
    }, (<any>JWT_SECRET_KEY), {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRY_SECONDS,
    })

    res.cookie("token", token, { maxAge: JWT_EXPIRY_SECONDS * 1000 })
    res.json({
        error: null,
        message: "Token obtained successfully",
    })
});


export default router