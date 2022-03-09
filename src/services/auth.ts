import express from 'express';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Prisma, PrismaClient } from '@prisma/client'

import { checkAuthentication } from '../middleware/auth'
import { JWT_EXPIRY_SECONDS, JWT_SECRET_KEY } from '../constants/auth';

const prisma = new PrismaClient()
const router = express.Router();


router.post('/register/', async (req, res) => {
    const { firstName, lastName, email, password } = req.body
    if (!email || !password) {
        return res.status(401).end()
    }

    const data = {
        firstName,
        lastName,
        email: email.toLowerCase(),
    }

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

    const token = jwt.sign({ id: user.id, ...data }, (<any> JWT_SECRET_KEY), {
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

router.post('/token/obtain/', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(401).end()
    }

    const user = await prisma.user.findFirst({
        where: {
            email: email.toLowerCase(),
        },
    })

    if (!user) {
        return res.status(401).end()
    }

    const data = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    }

    const token = jwt.sign({ ...data }, (<any> JWT_SECRET_KEY), {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRY_SECONDS,
    })

    res.cookie("token", token, { maxAge: JWT_EXPIRY_SECONDS * 1000 })
    res.json({
        error: null,
        message: "Token obtained successfully",
    })
});

router.post('/token/refresh/', checkAuthentication, async (req, res) => {
    const user = req.user

    const data = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    }

    const newToken = jwt.sign({ ...data }, (<any> JWT_SECRET_KEY), {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRY_SECONDS,
    })

    res.cookie("token", newToken, { maxAge: JWT_EXPIRY_SECONDS * 1000 })
    res.json({
        error: null,
        message: "Token refreshed successfully",
    })
});


export default router