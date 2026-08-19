import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import { customerReturnState, getCustomerPath } from '../helpers/customerReturnNavigation';
import CustomerWorkspaceTabs from '../components/CustomerWorkspaceTabs';
import SummaryApi from '../common';
import GlassPageState from '../components/GlassPageState';

const CATEGORY_STYLE = {
  website_updates: { icon: Layers3, color: 'text-teal-600' },
  service_plan: { icon: Layers3, color: 'text-teal-600' },
};

const BASE_TABS = [{ id: 'services', label: 'Explore Services' }];

const TAB_CATEGORIES = {
  services: ['website_updates', 'service_plan'],
};

// Categories that are add-ons, not standalone projects/plans.
const EXCLUDED_CATEGORIES = ['feature_upgrades'];

const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const StartNewProject = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Allows deep-linking straight to the service tab.
  const requestedTab = searchParams.get('tab');

  const [view, setView] = useState(requestedTab && TAB_CATEGORIES[requestedTab] ? requestedTab : 'services');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const response = await fetch(SummaryApi.allProduct.url);
        if (!response.ok) throw new Error('Could not load the catalogue');
        const dataResponse = await response.json();
        const allProducts = dataResponse?.data || [];
        setProjects(allProducts.filter((product) => TAB_CATEGORIES.services.includes(product.category) && !EXCLUDED_CATEGORIES.includes(product.category)));
      } catch (error) {
        setLoadError(error.message || 'Could not load the catalogue.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const tabs = BASE_TABS;

  const visibleProjects = useMemo(() => {
    const categories = TAB_CATEGORIES[view];
    if (categories) return projects.filter((project) => categories.includes(project.category));
    return projects.filter((project) => project.category === view);
  }, [view, projects]);

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
        <section className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
          <div className="relative bg-slate-950/45 px-5 py-5 text-white sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.14] to-transparent" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="relative max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Explore Services
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  Choose a service
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-6 text-white">
                  Browse available services, then tap View Details for the full picture.
                </p>
              </div>

              <div className="relative flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  Total: {projects.length}
                </div>
              </div>
            </div>
          </div>

          <CustomerWorkspaceTabs
            tabs={tabs}
            activeTab={view}
            onChange={setView}
            ariaLabel="Service categories"
            variant="inline"
          />

          <div className="border-t border-white/15">
            <div className="grid grid-cols-12 gap-3 border-b border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white sm:px-6">
              <div className="col-span-8 lg:col-span-10">Service</div>
              <div className="col-span-4 lg:col-span-2 text-right">Open</div>
            </div>

            {loading ? (
              <div className="p-5 sm:p-6"><GlassPageState message="Loading services…" /></div>
            ) : loadError ? (
              <div className="p-5 sm:p-6"><GlassPageState type="error" message={loadError} onRetry={() => window.location.reload()} /></div>
            ) : visibleProjects.length > 0 ? (
              <div className="divide-y divide-white/10">
                {visibleProjects.map((project, index) => {
                  const style = CATEGORY_STYLE[project.category] || CATEGORY_STYLE.service_plan;
                  const Icon = style.icon;

                  const description = stripHtml(project.formattedDescriptions?.[0]?.content || '');

                  return (
                    <button
                      key={project._id}
                      type="button"
                      onClick={() =>
                        navigate(
                          project.category === 'service_plan'
                            ? `/service-plan-detail/${project._id}`
                            : `/start-new-project/${project._id}`,
                          { state: customerReturnState(getCustomerPath(location)) }
                        )
                      }
                      className={[
                        'grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6',
                        index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.08]',
                      ].join(' ')}
                    >
                      <div className="col-span-8 lg:col-span-10">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <Icon className={`h-5 w-5 ${style.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-white">
                              {project.serviceName}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-300">{description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 flex items-center justify-end gap-2 lg:col-span-2">
                        <span className="text-base font-semibold text-white">View Details</span>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-base text-slate-300 sm:px-6">No projects found.</div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProject;
