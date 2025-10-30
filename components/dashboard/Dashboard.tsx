
import React from 'react';
import Module from '../common/Module';
import { HomeIcon } from '../common/Icons';

const DashboardModule: React.FC = () => {
  return (
    <Module title="Dashboard" icon={<HomeIcon />}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to LifeSync'd</h2>
        <p className="text-gray-400">
          Your journey to a more organized and productive life starts here.
        </p>
        <p className="text-gray-400 mt-4">
          Select a module from the navigation bar below to begin.
        </p>
      </div>
    </Module>
  );
};

export default DashboardModule;