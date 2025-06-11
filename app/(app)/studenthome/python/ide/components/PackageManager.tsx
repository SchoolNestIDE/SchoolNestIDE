// components/PackageManager.tsx
import React, { useState } from 'react';
import { Terminal, Loader } from 'lucide-react';

interface PackageManagerProps {
  pyodideLoaded: boolean;
  installPackage: (packageName: string) => Promise<void>;
  installedPackages: string[];
}

const commonPackages = [
  'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn',
  'micropip', 'pytz', 'packaging', 'pillow', 'requests'
];

export const PackageManager: React.FC<PackageManagerProps> = ({
  pyodideLoaded,
  installPackage,
  installedPackages,
}) => {
  const [packageInput, setPackageInput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPackageManager, setShowPackageManager] = useState(false);

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageInput.trim()) return;

    setIsInstalling(true);
    await installPackage(packageInput);
    setIsInstalling(false);
    setPackageInput('');
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300"> Packages</h3>
        <button
          onClick={() => setShowPackageManager(!showPackageManager)}
          className="text-xs flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-300 border border-neutral-700"
        >
          <Terminal className="h-3 w-3" />
          {showPackageManager ? 'Hide' : 'Show'}
        </button>
      </div>

      {showPackageManager ? (
        <div className="space-y-3">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={packageInput}
              onChange={(e) => setPackageInput(e.target.value)}
              placeholder="Package name"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePackageSubmit(e);
                }
              }}
            />
            <button
              onClick={handlePackageSubmit}
              disabled={!pyodideLoaded || isInstalling || !packageInput.trim()}
              className="px-3 py-1 bg-[#304529] hover:bg-[#4a6741] text-white rounded text-sm disabled:opacity-50"
            >
              {isInstalling ? (
                <Loader className="h-4 w-4 animate-spin mx-auto" />
              ) : 'Install'}
            </button>
          </div>

          <div className="text-xs text-neutral-400 mb-2">Common packages:</div>
          <div className="grid grid-cols-2 gap-2">
            {commonPackages.map(pkg => (
              <button
                key={pkg}
                onClick={() => installPackage(pkg)}
                disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
                className="text-center p-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:opacity-50 rounded border border-neutral-700 hover:border-neutral-600"
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {['numpy', 'matplotlib', 'pandas'].map(pkg => (
            <button
              key={pkg}
              onClick={() => installPackage(pkg)}
              disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
              className="text-center p-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:opacity-50 rounded border border-neutral-700"
            >
              {pkg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};