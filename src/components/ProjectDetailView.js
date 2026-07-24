import React, { useState } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';

const CATEGORY_LABEL = {
  standard_websites: 'Standard Website',
  dynamic_websites: 'Dynamic Website',
  cloud_software_development: 'Cloud Software',
  app_development: 'App Development',
};

const SectionHeading = ({ children }) => (
  <h2 className="border-b border-slate-200 pb-2 text-xl font-bold text-black">
    {children}
  </h2>
);

const InfoTooltip = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="More info"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-normal leading-5 text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
};

const ProjectDetailView = ({ project, onBack, onProceedWithPayment, onProceedWithoutPayment }) => {
  const categoryLabel = CATEGORY_LABEL[project.category] || 'Project';
  const description = project.formattedDescriptions?.[0]?.content || '';
  const perfectFor = project.perfectFor || [];
  const packageIncludes = project.packageIncludes || [];
  const additionalFeatures = project.additionalFeatures || [];

  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const toggleFeature = (featureId) => {
    setSelectedFeatures((current) =>
      current.includes(featureId) ? current.filter((id) => id !== featureId) : [...current, featureId]
    );
  };

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)]">
      {/* Title + Type (no price) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {project.serviceName}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-300 sm:text-base">{categoryLabel}</p>
      </div>

      <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
        {/* 1. Description */}
        {description && (
          <section>
            <SectionHeading>What is this project?</SectionHeading>
            <div
              className="prose prose-lg mt-3 max-w-none text-base leading-7 text-black"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </section>
        )}

        {/* 2. What's included */}
        {packageIncludes.length > 0 && (
          <section>
            <div className="flex items-center">
              <SectionHeading>What You Get</SectionHeading>
              <InfoTooltip text="These are the standard items already included in this project at no extra cost." />
            </div>
            <ul className="mt-3 space-y-2">
              {packageIncludes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base text-black">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 3. Add-on features (customize) */}
        {additionalFeatures.length > 0 && (
          <section>
            <div className="flex items-center">
              <SectionHeading>Add More to Your Project</SectionHeading>
              <InfoTooltip text="Optional. Select any extra feature you want added — you can change this before you proceed." />
            </div>
            <div className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {additionalFeatures.map((feature, index) => {
                const featureId = (feature && typeof feature === 'object' ? feature._id || feature.text : feature) || index;
                const featureLabel = feature && typeof feature === 'object' ? feature.serviceName || feature.text : feature;
                const isChecked = selectedFeatures.includes(featureId);
                return (
                  <label
                    key={featureId}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-base text-black hover:bg-slate-50"
                  >
                    <span className="font-medium">{featureLabel}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFeature(featureId)}
                      className="h-5 w-5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Who is it for */}
        {perfectFor.length > 0 && (
          <section>
            <SectionHeading>Who Is This For?</SectionHeading>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfectFor.map((item, index) => {
                const text = item && typeof item === 'object' ? item.text : item;
                return (
                  <span
                    key={text || index}
                    className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-black"
                  >
                    {text}
                  </span>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* 5. Proceed actions */}
      <div className="border-t border-slate-200 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onProceedWithPayment?.(selectedFeatures)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:flex-1"
          >
            Add to Cart &amp; Proceed to Payment
          </button>
          <button
            type="button"
            onClick={() => onProceedWithoutPayment?.(selectedFeatures)}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-100 sm:flex-1"
          >
            Submit Project Request (Without Payment)
          </button>
        </div>
        <p className="mt-3 text-sm text-black">
          Without payment: your project request is submitted and our team will contact you shortly.
        </p>
      </div>
    </article>
  );
};

export default ProjectDetailView;
