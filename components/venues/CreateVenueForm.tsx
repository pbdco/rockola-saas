import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { Button, Input, Select, Checkbox } from 'react-daisyui';
import toast from 'react-hot-toast';
import { defaultHeaders } from 'lib/common';
import type { ApiResponse } from 'types';
import type { SerializedVenue } from 'models/venue';
import useVenues from 'hooks/useVenues';
import { slugify } from '@/lib/server-common';

interface CreateVenueFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateVenueForm = ({ onSuccess, onCancel }: CreateVenueFormProps) => {
  const { t } = useTranslation('common');
  const { mutate } = useVenues();

  const formik = useFormik({
    initialValues: {
      name: '',
      address: '',
      mode: 'QUEUE' as const,
      spotifyClientId: '',
      spotifyClientSecret: '',
      pricingEnabled: false,
      pricePerSong: '',
      currency: 'USD',
      isActive: true,
    },
    onSubmit: async (values) => {
      try {
        const payload = {
          name: values.name,
          // Slug is auto-generated from name on the backend
          address: values.address || undefined,
          mode: values.mode,
          spotifyClientId: values.spotifyClientId || undefined,
          spotifyClientSecret: values.spotifyClientSecret || undefined,
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
          <option value="QUEUE">{t('mode-queue')}</option>
          <option value="PLAYLIST">{t('mode-playlist')}</option>
          <option value="AUTOMATION">{t('mode-automation')}</option>
        </Select>
        <label className="label">
          <span className="label-text-alt">{t('venue-mode-help')}</span>
        </label>
      </div>

      {/* Spotify Credentials Section */}
      <div className="divider">{t('spotify-credentials')}</div>
      
      <div className="alert alert-info">
        <span className="text-sm">{t('spotify-credentials-help')}</span>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('spotify-client-id')}</span>
          <span className="label-text-alt">{t('optional')}</span>
        </label>
        <Input
          name="spotifyClientId"
          type="text"
          placeholder={t('spotify-client-id-placeholder')}
          value={formik.values.spotifyClientId}
          onChange={formik.handleChange}
        />
        <label className="label">
          <span className="label-text-alt">{t('spotify-client-id-help')}</span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('spotify-client-secret')}</span>
          <span className="label-text-alt">{t('optional')}</span>
        </label>
        <Input
          name="spotifyClientSecret"
          type="password"
          placeholder={t('spotify-client-secret-placeholder')}
          value={formik.values.spotifyClientSecret}
          onChange={formik.handleChange}
        />
        <label className="label">
          <span className="label-text-alt">{t('spotify-client-secret-help')}</span>
        </label>
      </div>

      <div className="divider"></div>

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



