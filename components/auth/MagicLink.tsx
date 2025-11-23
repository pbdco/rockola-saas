import React from 'react';
import { Button } from 'react-daisyui';
import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import env from '@/lib/env';
import { InputWithLabel } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import type { ApiResponse } from 'types';

const MagicLink = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const callbackUrl = env.redirectIfAuthenticated;

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validate: (values) => {
      const errors: any = {};
      
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = 'Invalid email address';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ ...values, callbackUrl }),
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok) {
        toast.error(json.error.message);
        return;
      }

      formik.resetForm();
      toast.success(t('magic-link-sent'));
      router.push('/auth/magic-link');
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="space-y-2">
        <InputWithLabel
          type="email"
          label={t('email')}
          name="email"
          placeholder="jackson@boxyhq.com"
          value={formik.values.email}
          error={formik.touched.email ? formik.errors.email : undefined}
          onChange={formik.handleChange}
        />
        <Button
          type="submit"
          color="primary"
          loading={formik.isSubmitting}
          active={formik.dirty}
          fullWidth
          size="md"
        >
          {t('sign-in-with-email')}
        </Button>
      </div>
    </form>
  );
};

export default MagicLink;
