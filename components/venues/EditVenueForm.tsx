import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { Button, Input, Select, Checkbox } from 'react-daisyui';
import toast from 'react-hot-toast';
import { defaultHeaders } from 'lib/common';
import type { ApiResponse } from 'types';
import type { SerializedVenue } from 'models/venue';
import useVenues from 'hooks/useVenues';
import { slugify } from '@/lib/server-common';
import { useState, useEffect, useCallback } from 'react';

interface EditVenueFormProps {
  venue: SerializedVenue;
  onSuccess?: () => void;
  onCancel?: () => void;
  onVenueUpdate?: (updatedVenue: SerializedVenue) => void; // Callback to update parent component
}

interface SlugCheckResponse {
  available: boolean;
  slug: string;
  suggestedSlug: string;
  willBeModified: boolean;
}

const EditVenueForm = ({ venue, onSuccess, onCancel, onVenueUpdate }: EditVenueFormProps) => {
  const { t } = useTranslation('common');
  const { mutate } = useVenues();
  const [slugWarning, setSlugWarning] = useState<{
    willBeModified: boolean;
    suggestedSlug: string;
  } | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Check slug availability when slug or name changes
  const checkSlugAvailability = useCallback(
    async (slugToCheck: string, currentVenueId: string) => {
      if (!slugToCheck.trim()) {
        setSlugWarning(null);
        return;
      }

      const normalizedSlug = slugify(slugToCheck);
      if (normalizedSlug === venue.slug) {
        // Same as current slug, no warning needed
        setSlugWarning(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/venues/check-slug?slug=${encodeURIComponent(normalizedSlug)}&venueId=${currentVenueId}`
        );
        const json = (await response.json()) as ApiResponse<SlugCheckResponse>;

        if (response.ok && json.data) {
          if (json.data.willBeModified) {
            setSlugWarning({
              willBeModified: true,
              suggestedSlug: json.data.suggestedSlug,
            });
          } else {
            setSlugWarning(null);
          }
        }
      } catch (error) {
        // Silently fail - don't block user
        console.error('Failed to check slug availability:', error);
      } finally {
        setIsCheckingSlug(false);
      }
    },
    [venue.slug]
  );

  const formik = useFormik({
    enableReinitialize: true, // Re-initialize when venue prop changes
    initialValues: {
      name: venue.name,
      slug: venue.slug,
      address: venue.address || '',
      mode: venue.mode,
      spotifyClientId: venue.spotifyClientId || '',
      spotifyClientSecret: venue.spotifyClientSecret || '',
      pricingEnabled: venue.pricingEnabled,
      pricePerSong: venue.pricePerSong?.toString() || '',
      currency: venue.currency || 'USD',
      isActive: venue.isActive,
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
          // If slug is empty, backend will auto-generate from name
          slug: values.slug?.trim() || undefined,
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

        const response = await fetch(
          `/api/venues/${venue.id}`,
          {
            method: 'PUT',
            headers: defaultHeaders,
            body: JSON.stringify(payload),
          }
        );

        const json = (await response.json()) as ApiResponse<SerializedVenue>;

        if (!response.ok) {
          throw new Error(json.error.message);
        }

        const updatedVenue = json.data;

        // Update formik values with the returned venue data (especially slug)
        formik.setValues({
          name: updatedVenue.name,
          slug: updatedVenue.slug,
          address: updatedVenue.address || '',
          mode: updatedVenue.mode,
          spotifyClientId: updatedVenue.spotifyClientId || '',
          spotifyClientSecret: updatedVenue.spotifyClientSecret || '',
          pricingEnabled: updatedVenue.pricingEnabled,
          pricePerSong: updatedVenue.pricePerSong?.toString() || '',
          currency: updatedVenue.currency || 'USD',
          isActive: updatedVenue.isActive,
        });

        // Clear slug warning after successful save
        setSlugWarning(null);

        toast.success(t('venue-updated'));
        
        // Update venues list
        mutate();
        
        // Notify parent component of the update
        onVenueUpdate?.(updatedVenue);
        
        // Scroll to top to show success state (smooth scroll)
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.message);
      }
    },
  });

  // Debounce slug checking - must be after formik is defined
  useEffect(() => {
    const slugToCheck = formik.values.slug || slugify(formik.values.name);
    if (!slugToCheck) return;

    const timeoutId = setTimeout(() => {
      checkSlugAvailability(slugToCheck, venue.id);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formik.values.slug, formik.values.name, venue.id, checkSlugAvailability]);

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('basic-information')}</h2>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('venue-name')}</span>
          </label>
          <Input
            name="name"
            type="text"
            placeholder={t('venue-name-placeholder')}
            value={formik.values.name}
            onChange={formik.handleChange}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('venue-slug')}</span>
            <span className="label-text-alt">{t('optional')}</span>
          </label>
          <Input
            name="slug"
            type="text"
            placeholder={formik.values.name ? slugify(formik.values.name) : t('venue-slug-placeholder')}
            value={formik.values.slug}
            onChange={formik.handleChange}
            className={slugWarning?.willBeModified ? 'input-warning' : ''}
          />
          {isCheckingSlug && (
            <label className="label">
              <span className="label-text-alt text-gray-500">
                {t('checking-slug-availability')}...
              </span>
            </label>
          )}
          {slugWarning?.willBeModified && !isCheckingSlug && (
            <div className="alert alert-warning py-2 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">
                {t('slug-will-be-modified')}: <code className="text-xs font-mono bg-base-200 px-1 py-0.5 rounded">{slugWarning.suggestedSlug}</code>
              </span>
            </div>
          )}
          <label className="label">
            <span className="label-text-alt">
              {t('venue-slug-help')} {!formik.values.slug && formik.values.name && (
                <span className="text-primary">({t('will-use')}: <code className="text-xs">{slugify(formik.values.name)}</code>)</span>
              )}
            </span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('address')}</span>
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
            <span className="label-text font-medium">{t('venue-mode')}</span>
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
      </div>

      <div className="divider"></div>

      {/* Spotify Configuration Section - Only for Automation Mode */}
      {formik.values.mode === 'AUTOMATION' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t('spotify-configuration')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('spotify-configuration-description-automation')}
            </p>
          </div>
          
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm" dangerouslySetInnerHTML={{ __html: t('spotify-credentials-help-automation') }} />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('spotify-client-id')}</span>
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
              <span className="label-text font-medium">{t('spotify-client-secret')}</span>
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
        </div>
      )}

      <div className="divider"></div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t('pricing-settings')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('pricing-settings-description')}
          </p>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <Checkbox
              name="pricingEnabled"
              checked={formik.values.pricingEnabled}
              onChange={formik.handleChange}
            />
            <span className="label-text font-medium">{t('enable-pricing')}</span>
          </label>
        </div>

        {formik.values.pricingEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t('price-per-song')}</span>
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
                <span className="label-text font-medium">{t('currency')}</span>
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
                <option value="ARS">ARS</option>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="divider"></div>

      {/* Status Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t('venue-status')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('venue-status-description')}
          </p>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <Checkbox
              name="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
            />
            <span className="label-text font-medium">{t('venue-is-active')}</span>
          </label>
          <label className="label">
            <span className="label-text-alt">{t('venue-is-active-help')}</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          color="primary"
          loading={formik.isSubmitting}
          disabled={formik.isSubmitting}
          size="lg"
        >
          {t('save-changes')}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={formik.isSubmitting}
            size="lg"
          >
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default EditVenueForm;


