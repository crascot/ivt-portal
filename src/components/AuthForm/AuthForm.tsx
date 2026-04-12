import { useMemo, type FC, type HTMLInputTypeAttribute } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import {
  type RegisterOptions,
  type SubmitHandler,
  useForm,
} from 'react-hook-form';

import {
  GroupDto,
  LoginRequest,
  RegisterStudentRequest,
  RegisterTeacherRequest,
} from '@entities/authRequest';

import s from './AuthForm.module.css';

type AuthMode = 'login' | 'register-student' | 'register-teacher';

type AuthFormValues = {
  fullName: string;
  email: string;
  password: string;
  position: string;
  groupId: number | '';
};

type AuthFieldName = keyof AuthFormValues;
type TextFieldName = Exclude<AuthFieldName, 'groupId'>;

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

type RegisterStudentFormProps = CommonProps & {
  mode: 'register-student';
  groups: GroupDto[];
  onSubmit: (data: RegisterStudentRequest) => void | Promise<void>;
};

type RegisterTeacherFormProps = CommonProps & {
  mode: 'register-teacher';
  onSubmit: (data: RegisterTeacherRequest) => void | Promise<void>;
};

type AuthFormProps =
  | LoginFormProps
  | RegisterStudentFormProps
  | RegisterTeacherFormProps;

const REQUIRED_FIELDS: Record<AuthMode, AuthFieldName[]> = {
  login: ['email', 'password'],
  'register-student': ['fullName', 'email', 'password', 'groupId'],
  'register-teacher': ['fullName', 'email', 'password', 'position'],
};

const DEFAULT_FIELDS: Record<AuthMode, AuthFieldName[]> = {
  login: ['email', 'password'],
  'register-student': ['fullName', 'email', 'password', 'groupId'],
  'register-teacher': ['fullName', 'email', 'password', 'position'],
};

const FIELD_META: Record<
  AuthFieldName,
  {
    label: string;
    type?: HTMLInputTypeAttribute;
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
  },
  position: {
    label: 'Position',
    type: 'text',
    placeholder: 'Enter your position',
    autoComplete: 'organization-title',
  },
  groupId: {
    label: 'Group',
    placeholder: 'Select group',
  },
};

const trimValue = (value: string) => value.trim();

export const AuthForm: FC<AuthFormProps> = (props) => {
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
      position: '',
      groupId: '',
      ...props.defaultValues,
    },
  });

  const getTextRules = (
    field: TextFieldName
  ): RegisterOptions<AuthFormValues, TextFieldName> => {
    switch (field) {
      case 'fullName':
        return props.mode !== 'login'
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

      case 'position':
        return props.mode === 'register-teacher'
          ? {
              required: 'Position is required',
              minLength: {
                value: 2,
                message: 'Minimum 2 characters',
              },
            }
          : {};

      default:
        return {};
    }
  };

  const getGroupRules = (): RegisterOptions<AuthFormValues, 'groupId'> => {
    return props.mode === 'register-student'
      ? {
          required: 'Group is required',
          setValueAs: (value: string) => (value === '' ? '' : Number(value)),
          validate: (value) =>
            (typeof value === 'number' &&
              Number.isInteger(value) &&
              value > 0) ||
            'Select group',
        }
      : {};
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

    if (props.mode === 'register-student') {
      const payload: RegisterStudentRequest = {
        fullName: trimValue(values.fullName),
        email: trimValue(values.email),
        password: values.password,
        groupId: Number(values.groupId),
      };

      await props.onSubmit(payload);
      return;
    }

    const payload: RegisterTeacherRequest = {
      fullName: trimValue(values.fullName),
      email: trimValue(values.email),
      password: values.password,
      position: trimValue(values.position),
    };

    await props.onSubmit(payload);
  };

  const isBusy = props.isLoading || isSubmitting;

  return (
    <Form
      noValidate
      onSubmit={handleSubmit(onValid)}
      className={`${s.form} ${props.className ?? ''}`.trim()}
    >
      {props.submitError && (
        <Alert variant="danger" className={s.alert}>
          {props.submitError}
        </Alert>
      )}

      {visibleFields.map((field) => {
        const meta = FIELD_META[field];
        const errorMessage = errors[field]?.message as string | undefined;

        if (field === 'groupId') {
          const groups = props.mode === 'register-student' ? props.groups : [];

          return (
            <Form.Group key={field} className={s.field}>
              <Form.Label htmlFor={field} className={s.label}>
                {meta.label}
              </Form.Label>

              <Form.Select
                id={field}
                className={s.control}
                isInvalid={!!errorMessage}
                {...register('groupId', getGroupRules())}
              >
                <option value="">Not selected</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Form.Select>

              <Form.Control.Feedback type="invalid">
                {errorMessage}
              </Form.Control.Feedback>
            </Form.Group>
          );
        }

        const textField = field as TextFieldName;

        return (
          <Form.Group key={textField} className={s.field}>
            <Form.Label htmlFor={textField} className={s.label}>
              {meta.label}
            </Form.Label>

            <Form.Control
              id={textField}
              type={meta.type}
              placeholder={meta.placeholder}
              autoComplete={
                textField === 'password'
                  ? props.mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                  : meta.autoComplete
              }
              className={s.control}
              isInvalid={!!errorMessage}
              {...register(textField, getTextRules(textField))}
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
