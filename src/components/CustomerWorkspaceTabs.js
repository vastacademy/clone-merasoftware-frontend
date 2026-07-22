import React from 'react';

const CustomerWorkspaceTabs = ({ tabs, activeTab, onChange, ariaLabel = 'Workspace sections' }) => {
  return (
    <div className="border-b border-slate-200 px-5 sm:px-6">
      <div role="tablist" aria-label={ariaLabel} className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={[
                'relative -mb-px inline-flex shrink-0 cursor-pointer items-center justify-center border-b-2 px-1 py-4 text-sm font-semibold transition',
                isActive
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerWorkspaceTabs;
