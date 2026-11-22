import Joi from "joi";

export type RegisterBody = { name: string; email: string; password: string };
export type LoginBody = { email: string; password: string };

// abortEarly: false → report every invalid field; stripUnknown → drop extra fields.
export const registerSchema = Joi.object<RegisterBody>({
    name: Joi.string().trim().min(1).max(64).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(8).max(128).required(),
}).options({ abortEarly: false, stripUnknown: true });

export const loginSchema = Joi.object<LoginBody>({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
}).options({ abortEarly: false, stripUnknown: true });
