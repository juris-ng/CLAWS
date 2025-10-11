import * as yup from 'yup';

export const petitionSchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .min(10, 'Title must be at least 10 characters')
    .max(150, 'Title must not exceed 150 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  
  category: yup
    .string()
    .required('Please select a category'),
});

export const validatePetitionForm = (data) => {
  try {
    petitionSchema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    err.inner.forEach((error) => {
      errors[error.path] = error.message;
    });
    return { isValid: false, errors };
  }
};

// Profile validation schema
export const profileSchema = yup.object().shape({
  full_name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  bio: yup
    .string()
    .max(500, 'Bio must not exceed 500 characters'),
  
  phone_number: yup
    .string()
    .matches(/^[+]?[\d\s-()]*$/, 'Invalid phone number format')
    .max(15, 'Phone number is too long'),
  
  location: yup
    .string()
    .max(100, 'Location must not exceed 100 characters'),
});

export const validateProfileForm = (data) => {
  try {
    profileSchema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    err.inner.forEach((error) => {
      errors[error.path] = error.message;
    });
    return { isValid: false, errors };
  }
};

// Password validation
export const passwordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
});

export const validatePassword = (password) => {
  try {
    passwordSchema.validateSync({ password }, { abortEarly: false });
    return { isValid: true, errors: [] };
  } catch (err) {
    const errors = err.inner.map((error) => error.message);
    return { isValid: false, errors };
  }
};

// Email validation
export const emailSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

export const validateEmail = (email) => {
  try {
    emailSchema.validateSync({ email }, { abortEarly: false });
    return { isValid: true, error: null };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
};

// Comment validation
export const commentSchema = yup.object().shape({
  comment_text: yup
    .string()
    .required('Comment cannot be empty')
    .min(1, 'Comment must be at least 1 character')
    .max(500, 'Comment must not exceed 500 characters'),
});

export const validateComment = (comment) => {
  try {
    commentSchema.validateSync({ comment_text: comment }, { abortEarly: false });
    return { isValid: true, error: null };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
};
