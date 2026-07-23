import Joi from 'joi';

export const createCouponSchema = Joi.object({
  code: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .uppercase()
    .required()
    .messages({
      'string.alphanum': 'Coupon code must contain only letters and numbers',
      'string.min': 'Coupon code must be at least 3 characters long',
      'string.max': 'Coupon code must not exceed 20 characters',
      'string.uppercase': 'Coupon code must be uppercase',
      'any.required': 'Coupon code is required'
    }),
  
  type: Joi.string()
    .valid('PERCENTAGE', 'FIXED')
    .required()
    .messages({
      'any.only': 'Coupon type must be either PERCENTAGE or FIXED',
      'any.required': 'Coupon type is required'
    }),
  
  value: Joi.number()
    .positive()
    .when('type', {
      is: 'PERCENTAGE',
      then: Joi.max(100),
      otherwise: Joi.min(0.01)
    })
    .required()
    .messages({
      'number.positive': 'Coupon value must be positive',
      'number.max': 'Percentage discount cannot exceed 100%',
      'number.min': 'Fixed discount must be at least 0.01',
      'any.required': 'Coupon value is required'
    }),
  
  minOrderValue: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Minimum order value cannot be negative'
    }),
  
  maxDiscount: Joi.number()
    .positive()
    .when('type', {
      is: 'FIXED',
      then: Joi.forbidden(),
      otherwise: Joi.optional()
    })
    .messages({
      'number.positive': 'Maximum discount must be positive',
      'any.unknown': 'Maximum discount is only allowed for percentage coupons'
    }),
  
  usageLimit: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.integer': 'Usage limit must be a whole number',
      'number.min': 'Usage limit must be at least 1'
    }),
  
  expiresAt: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.min': 'Expiry date must be in the future',
      'any.required': 'Expiry date is required'
    }),
  
  isActive: Joi.boolean()
    .default(true)
});

export const updateCouponSchema = Joi.object({
  type: Joi.string()
    .valid('PERCENTAGE', 'FIXED')
    .optional(),
  
  value: Joi.number()
    .positive()
    .when('type', {
      is: 'PERCENTAGE',
      then: Joi.max(100),
      otherwise: Joi.min(0.01)
    })
    .optional(),
  
  minOrderValue: Joi.number()
    .min(0)
    .optional(),
  
  maxDiscount: Joi.number()
    .positive()
    .when('type', {
      is: 'FIXED',
      then: Joi.forbidden(),
      otherwise: Joi.optional()
    })
    .optional(),
  
  usageLimit: Joi.number()
    .integer()
    .min(1)
    .optional(),
  
  expiresAt: Joi.date()
    .iso()
    .min('now')
    .optional(),
  
  isActive: Joi.boolean()
    .optional()
});
