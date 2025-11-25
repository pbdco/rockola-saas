import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { Button, Input, Select, Checkbox } from 'react-daisyui';
import toast from 'react-hot-toast';
import { defaultHeaders } from 'lib/common';
import type { ApiResponse } from 'types';
import type { SerializedVenue } from 'models/venue';
import useVenues from 'hooks/useVenues';
import { slugify } from '@/lib/server-common';
import type { VenueMode } from '@prisma/client';

interface CreateVenueFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormValues {
  name: string;
  address: string;
  mode: VenueMode;
  spotifyClientId: string;
  spotifyClientSecret: string;
  pricingEnabled: boolean;
  pricePerSong: string;
  currency: string;
  isActive: boolean;
}

const CreateVenueForm = ({ onSuccess, onCancel }: CreateVenueFormProps) => {
  const { t } = useTranslation('common');
  const { mutate } = useVenues();

  const formik = useFormik<FormValues>({
    initialValues: {
      name: '',
      address: '',
      mode: 'PLAYLIST',
      spotifyClientId: '',
      spotifyClientSecret: '',
      pricingEnabled: false,
      pricePerSong: '',
      currency: 'USD',
      isActive: true,
    },
    onSubmit: async (values) => {
      try {
        // Validate Spotify credentials for Automation Mode
        if (values.mode === 'AUTOMATION') {
          if (!values.spotifyClientId || !values.spotifyClientSecret) {
            toast.error(t('spotify-credentials-required-for-automation'));
            return;
          }
        }

        const payload = {
          name: values.name,
          // Slug is auto-generated from name on the backend
          address: values.address || undefined,
          mode: values.mode,
          spotifyClientId: values.mode === 'AUTOMATION' ? values.spotifyClientId : undefined,
          spotifyClientSecret: values.mode === 'AUTOMATION' ? values.spotifyClientSecret : undefined,
          pricingEnabled: values.pricingEnabled,
          pricePerSong:
            values.pricingEnabled && values.pricePerSong
              ? parseFloat(values.pricePerSong)
              : null,
          currency: values.currency,
          isActive: values.isActive,
        };

        const response = await fetch('/api/venues', {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify(payload),
        });

        const json = (await response.json()) as ApiResponse<SerializedVenue>;

        if (!response.ok) {
          throw new Error(json.error.message);
        }

        toast.success(t('venue-created'));
        mutate();
        formik.resetForm();
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('venue-name')}</span>
        </label>
        <Input
          name="name"
          type="text"
          placeholder={t('venue-name-placeholder')}
          value={formik.values.name}
          onChange={formik.handleChange}
          required
        />
        {formik.values.name && (
          <label className="label">
            <span className="label-text-alt">
              {t('venue-slug-preview')}: <code className="text-xs bg-base-200 px-1 py-0.5 rounded">{slugify(formik.values.name)}</code>
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('address')}</span>
          <span className="label-text-alt">{t('optional')}</span>
        </label>
        <Input
          name="address"
          type="text"
          placeholder={t('venue-address-placeholder')}
          value={formik.values.address}
          onChange={formik.handleChange}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('venue-mode')}</span>
        </label>
        <Select
          name="mode"
          value={formik.values.mode}
          onChange={formik.handleChange}
        >
          <option value="PLAYLIST">{t('mode-playlist')}</option>
          <option value="AUTOMATION">{t('mode-automation')}</option>
        </Select>
        <label className="label">
          <span className="label-text-alt">{t('venue-mode-help')}</span>
        </label>
      </div>

      {/* Spotify Credentials Section - Only for Automation Mode */}
      {formik.values.mode === 'AUTOMATION' && (
        <>
          <div className="divider">{t('spotify-credentials')}</div>
          
          <div className="alert alert-info">
            <span className="text-sm" dangerouslySetInnerHTML={{ __html: t('spotify-credentials-help-automation') }} />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('spotify-client-id')}</span>
              <span className="label-text-alt text-error">{t('required')}</span>
            </label>
            <Input
              name="spotifyClientId"
              type="text"
              placeholder={t('spotify-client-id-placeholder')}
              value={formik.values.spotifyClientId}
              onChange={formik.handleChange}
              required={formik.values.mode === 'AUTOMATION'}
            />
            <label className="label">
              <span className="label-text-alt">{t('spotify-client-id-help')}</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('spotify-client-secret')}</span>
              <span className="label-text-alt text-error">{t('required')}</span>
            </label>
            <Input
              name="spotifyClientSecret"
              type="password"
              placeholder={t('spotify-client-secret-placeholder')}
              value={formik.values.spotifyClientSecret}
              onChange={formik.handleChange}
              required={formik.values.mode === 'AUTOMATION'}
            />
            <label className="label">
              <span className="label-text-alt">{t('spotify-client-secret-help')}</span>
            </label>
          </div>

          <div className="divider"></div>
        </>
      )}

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <Checkbox
            name="pricingEnabled"
            checked={formik.values.pricingEnabled}
            onChange={formik.handleChange}
          />
          <span className="label-text">{t('enable-pricing')}</span>
        </label>
      </div>

      {formik.values.pricingEnabled && (
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('price-per-song')}</span>
            </label>
            <Input
              name="pricePerSong"
              type="number"
              step="0.01"
              min="0"
              max="1000"
              placeholder="2.99"
              value={formik.values.pricePerSong}
              onChange={formik.handleChange}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('currency')}</span>
            </label>
            <Select
              name="currency"
              value={formik.values.currency}
              onChange={formik.handleChange}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="MXN">MXN</option>
            </Select>
          </div>
        </div>
      )}

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <Checkbox
            name="isActive"
            checked={formik.values.isActive}
            onChange={formik.handleChange}
          />
          <span className="label-text">{t('venue-is-active')}</span>
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          color="primary"
          loading={formik.isSubmitting}
          disabled={formik.isSubmitting}
          fullWidth
        >
          {t('create-venue')}
        </Button>
        {onCancel && (
          <Button
            type="button"
            color="ghost"
            onClick={onCancel}
            disabled={formik.isSubmitting}
          >
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CreateVenueForm;



