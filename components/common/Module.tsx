
import React from 'react';

interface ModuleProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode; // New optional prop for custom header content
}

const Module: React.FC<ModuleProps> = ({ title, icon, children, className = '', headerContent }) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}>
      <header className="flex items-center p-4 border-b border-slate-700/50">
        <div className="text-purple-400 mr-3">{icon}</div>
        <h2 className="font-bold text-lg text-gray-200">{title}</h2>
        {headerContent && <div className="ml-auto">{headerContent}</div>}
      </header>
      <div className="p-4 flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Module;