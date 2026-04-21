const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
    phone: Joi.string().required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema };
