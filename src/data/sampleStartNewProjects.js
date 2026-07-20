export const SAMPLE_PROJECTS = [
  {
    id: 'standard-website',
    serviceName: 'Standard Website',
    category: 'standard_websites',
    sellingPrice: 14999,
    criticalInfo: '4-10 pages, ready in 7 days',
    description:
      'A clean, professional website for businesses that need an online presence with core pages and contact details.',
    whatsIncluded: ['Up to 10 pages', 'Mobile responsive design', 'Basic SEO setup', 'Contact form integration'],
    perfectFor: ['Small businesses', 'Local shops', 'Portfolios'],
  },
  {
    id: 'dynamic-website',
    serviceName: 'Dynamic Website',
    category: 'dynamic_websites',
    sellingPrice: 29999,
    criticalInfo: '10-25 pages, admin panel included',
    description:
      'A database-driven website with an admin panel to manage content, products, or listings without touching code.',
    whatsIncluded: ['Admin dashboard', 'Database-driven content', 'User authentication', 'Up to 25 pages'],
    perfectFor: ['Growing businesses', 'Content-heavy sites', 'Membership platforms'],
  },
  {
    id: 'cloud-software',
    serviceName: 'Cloud Software Development',
    category: 'cloud_software_development',
    sellingPrice: 79999,
    criticalInfo: 'Custom-built, scalable cloud solution',
    description:
      'A fully custom cloud-based software solution built around your specific business workflow and requirements.',
    whatsIncluded: ['Custom architecture', 'Cloud hosting setup', 'API integrations', 'Ongoing scalability'],
    perfectFor: ['Startups', 'Enterprises', 'SaaS products'],
  },
  {
    id: 'app-development',
    serviceName: 'App Development',
    category: 'app_development',
    sellingPrice: 59999,
    criticalInfo: 'Android & iOS, launch-ready',
    description:
      'A mobile application built for Android and iOS with a smooth user experience and store-ready delivery.',
    whatsIncluded: ['Cross-platform build', 'UI/UX design', 'App store submission support', 'Push notifications'],
    perfectFor: ['Mobile-first businesses', 'On-demand services', 'Community apps'],
  },
];

export const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
