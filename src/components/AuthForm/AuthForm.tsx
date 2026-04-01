import { useMemo } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { SubmitHandler, useForm } from 'react-hook-form';

import { LoginRequest, RegisterRequest } from '@entities/authRequest';
import { RoleEnum } from '@entities/role-enum';

import s from './AuthForm.module.css';

type AuthMode = 'login' | 'register';

type AuthFormValues = {
  fullName: string;
  email: string;
  password: string;
  groupname: string;
  role: RoleEnum | '';
};

type AuthFieldName = keyof AuthFormValues;

type CommonProps = {
  fields?: AuthFieldName[];
  defaultValues?: Partial<AuthFormValues>;
  submitText?: string;
  isLoading?: boolean;
  submitError?: string | null;
  className?: string;
};

type LoginFormProps = CommonProps & {
  mode: 'login';
  onSubmit: (data: LoginRequest) => void | Promise<void>;
};

type RegisterFormProps = CommonProps & {
  mode: 'register';
  onSubmit: (data: RegisterRequest) => void | Promise<void>;
};

type AuthFormProps = LoginFormProps | RegisterFormProps;

const REQUIRED_FIELDS: Record<AuthMode, AuthFieldName[]> = {
  login: ['email', 'password'],
  register: ['fullName', 'email', 'password', 'role'],
};

const DEFAULT_FIELDS: Record<AuthMode, AuthFieldName[]> = {
  login: ['email', 'password'],
  register: ['fullName', 'email', 'password', 'groupname', 'role'],
};

const FIELD_META: Record<
  AuthFieldName,
  {
    label: string;
    type?: React.HTMLInputTypeAttribute;
    placeholder?: string;
    autoComplete?: string;
  }
> = {
  fullName: {
    label: 'Full name',
    type: 'text',
    placeholder: 'Enter your full name',
    autoComplete: 'name',
  },
  email: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    autoComplete: 'email',
  },
  password: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
  },
  groupname: {
    label: 'Group name',
    type: 'text',
    placeholder: 'Enter your group name',
    autoComplete: 'organization',
  },
  role: {
    label: 'Role',
    placeholder: 'Select role',
  },
};

const ROLE_OPTIONS = [
  { label: 'Student', value: RoleEnum.STUDENT },
  { label: 'Teacher', value: RoleEnum.TEACHER },
  { label: 'Admin', value: RoleEnum.ADMIN },
  { label: 'Group leader', value: RoleEnum.GROUP_LEADER },
];

const trimValue = (value: string) => value.trim();

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const AuthForm: React.FC<AuthFormProps> = (props) => {
  const visibleFields = useMemo(() => {
    const source = props.fields?.length
      ? props.fields
      : DEFAULT_FIELDS[props.mode];

    return Array.from(new Set([...source, ...REQUIRED_FIELDS[props.mode]]));
  }, [props.fields, props.mode]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    shouldUnregister: true,
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      groupname: '',
      role: '',
      ...props.defaultValues,
    },
  });

  const getRules = (field: AuthFieldName) => {
    switch (field) {
      case 'fullName':
        return props.mode === 'register'
          ? {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Minimum 2 characters',
              },
            }
          : {};

      case 'email':
        return {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email',
          },
        };

      case 'password':
        return {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Minimum 6 characters',
          },
        };

      case 'groupname':
        return {};

      case 'role':
        return props.mode === 'register'
          ? {
              required: 'Role is required',
            }
          : {};

      default:
        return {};
    }
  };

  const onValid: SubmitHandler<AuthFormValues> = async (values) => {
    if (props.mode === 'login') {
      const payload: LoginRequest = {
        email: trimValue(values.email),
        password: values.password,
      };

      await props.onSubmit(payload);
      return;
    }

    const payload: RegisterRequest = {
      fullName: trimValue(values.fullName),
      email: trimValue(values.email),
      password: values.password,
      groupname: emptyToUndefined(values.groupname),
      role: values.role || undefined,
    };

    await props.onSubmit(payload);
  };

  const isBusy = props.isLoading || isSubmitting;

  return (
    <Form
      noValidate
      onSubmit={handleSubmit(onValid)}
      className={`${s.form} ${props.className ?? ''}`}
    >
      {props.submitError && (
        <Alert variant="danger" className={s.alert}>
          {props.submitError}
        </Alert>
      )}

      {visibleFields.map((field) => {
        const meta = FIELD_META[field];
        const errorMessage = errors[field]?.message as string | undefined;

        if (field === 'role') {
          return (
            <Form.Group key={field} className={s.field}>
              <Form.Label htmlFor={field} className={s.label}>
                {meta.label}
              </Form.Label>

              <Form.Select
                id={field}
                className={s.control}
                isInvalid={!!errorMessage}
                {...register('role', getRules('role'))}
              >
                <option value="">Not selected</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>

              <Form.Control.Feedback type="invalid">
                {errorMessage}
              </Form.Control.Feedback>
            </Form.Group>
          );
        }

        return (
          <Form.Group key={field} className={s.field}>
            <Form.Label htmlFor={field} className={s.label}>
              {meta.label}
            </Form.Label>

            <Form.Control
              id={field}
              type={meta.type}
              placeholder={meta.placeholder}
              autoComplete={meta.autoComplete}
              className={s.control}
              isInvalid={!!errorMessage}
              {...register(field, getRules(field))}
            />

            <Form.Control.Feedback type="invalid">
              {errorMessage}
            </Form.Control.Feedback>
          </Form.Group>
        );
      })}

      <Button
        type="submit"
        disabled={isBusy}
        className={s.submitButton}
        variant="primary"
      >
        {isBusy ? (
          <>
            <Spinner animation="border" size="sm" className={s.spinner} />
            Processing...
          </>
        ) : (
          (props.submitText ?? (props.mode === 'login' ? 'Login' : 'Register'))
        )}
      </Button>
    </Form>
  );
};
